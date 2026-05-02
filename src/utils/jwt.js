import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

const getSharedJwtOptions = () => ({
  ...(env.jwtIssuer ? { issuer: env.jwtIssuer } : {}),
  ...(env.jwtAudience ? { audience: env.jwtAudience } : {}),
});

export const signAccessToken = (payload) =>
  jwt.sign(payload, env.jwtSecret, {
    algorithm: "HS256",
    expiresIn: env.jwtExpiresIn,
    ...getSharedJwtOptions(),
  });

export const verifyAccessToken = (token) =>
  jwt.verify(token, env.jwtSecret, {
    algorithms: ["HS256"],
    ...getSharedJwtOptions(),
  });
