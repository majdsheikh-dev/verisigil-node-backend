import { asyncHandler } from "../../utils/async-handler.js";

export const profile = asyncHandler(async (req, res) => {
  res.status(200).json({
    user: req.user,
  });
});