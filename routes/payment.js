
import express from "express";
const router = express.Router();

import { isAuthenticatedUser } from "../middlewares/auth.js";
import {
  stripeCheckoutSession,
  stripeWebhook,
} from "../controllers/paymentControllers.js";

router
  .route("/payment/checkout_session")
  .post(isAuthenticatedUser, stripeCheckoutSession);

// Webhook için raw body kullanarak middleware
router.route("/payment/webhook").post(express.raw({ type: 'application/json' }), stripeWebhook);

export default router;











// import express from "express";
// const router = express.Router();

// import { isAuthenticatedUser } from "../middlewares/auth.js";
// import {
//   stripeCheckoutSession,
//   stripeWebhook,
// } from "../controllers/paymentControllers.js";

// router
//   .route("/payment/checkout_session")
//   .post(isAuthenticatedUser, stripeCheckoutSession);

// router.route("/payment/webhook").post(stripeWebhook);
// export default router;
