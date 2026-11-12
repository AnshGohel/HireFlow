export const sendToken = (user, statusCode, res, message) => {
  const token = user.getJWTToken();
  const isProduction = process.env.NODE_ENV === "production";
  const options = {
    expires: new Date(
      Date.now() + Number(process.env.COOKIE_EXPIRE || 7) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    path: "/",
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
  };

  res.status(statusCode).cookie("token", token, options).json({
    success: true,
    user,
    message,
    token,
  });
};
