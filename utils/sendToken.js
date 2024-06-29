// Create token and save in the cookie
export default (user, statusCode, res) => {
  // Create JWT Token
  const token = user.getJwtToken()

  // Options for cookie
  const options = {
    expires: new Date(
      Date.now() + process.env.COOKIE_EXPIRES_TIME * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'PRODUCTION', // production'da secure flag'ini ekleyin
   sameSite: 'None', // üçüncü taraf cookie'leri için None, CSRF saldırılarına karşı koruma
  }

  res.status(statusCode).cookie('token', token, options).json({
    token,
  })
}
