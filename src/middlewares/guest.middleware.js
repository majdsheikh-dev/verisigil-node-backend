export const guestMiddleware = (req, res, next) => {
  const guestToken = req.headers["x-guest-token"] || null;
  req.guestToken = typeof guestToken === "string" ? guestToken : null;
  next();
};