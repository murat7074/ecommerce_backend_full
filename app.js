import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { connectDatabase } from './config/dbConnect.js';
import errorMiddleware from './middlewares/errors.js';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Handle Uncaught Exception
process.on('uncaughtException', (err) => {
  console.error(`ERROR: ${err}`);
  console.log('Shutting down server due to Unhandled uncaught Exception');
  process.exit(1);
});

if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: 'config/config.env' });
}

const app = express();

app.set('trust proxy', 1); // Proxy ayarını güven

// Helmet Middleware for securing HTTP headers with Content Security Policy
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        'img-src': ["'self'", 'data:', 'https://res.cloudinary.com'],
      },
    },
  })
);

// CORS Middleware
const allowedOrigins = ['http://localhost:5173', 'https://beybuilmek.com']; 
const options = {
  origin: function (origin, callback) {
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // İzin verilen origin'den gelen isteklerde cookie'lerin gönderilmesi için credentials ayarı
};
app.use(cors(options));

// Rate Limiting Middleware
const limiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 dakika
  max: 100, // Her IP için 5 dakika içinde 100 istek
});
app.use(limiter);

// Mongo Sanitize Middleware to prevent NoSQL injection
app.use(mongoSanitize());

// XSS Clean Middleware to prevent XSS attacks
app.use(xss());

// Morgan for logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Connecting to database
connectDatabase();

app.use(
  express.json({
    limit: '10mb', // limiti 10 mb yapmazsak cloudinary e 1mb üzerinde resim vs yükleyemiyoruz
    verify: (req, res, buf) => {
      req.rawBody = buf.toString();
    },
  })
);
app.use(cookieParser());

// CORS ve HttpOnly, Secure Cookie Ayarları
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'https://beybuilmek.com');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

    // HttpOnly ve Secure olarak cookie'leri ayarla
    res.cookie('key', 'value', { httpOnly: true, secure: false }); // Yerel geliştirme ortamında secure: false olmalıdır

    next();
  });
}

// Import all routes
import productRoutes from './routes/products.js';
import authRoutes from './routes/auth.js';
import orderRoutes from './routes/order.js';
import paymentRoutes from './routes/payment.js';

app.use('/api/v1', productRoutes);
app.use('/api/v1', authRoutes);
app.use('/api/v1', orderRoutes);
app.use('/api/v1', paymentRoutes);

// Error Middleware
app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server started on PORT: ${PORT} in ${process.env.NODE_ENV} Mode..`);
});

// Handle unHandled Promise rejection
process.on('unhandledRejection', (err) => {
  console.error(`ERROR: ${err}`);
  console.log('Shutting down server due to Unhandled Promise Rejection');
  server.close(() => {
    process.exit(1);
  });
});






