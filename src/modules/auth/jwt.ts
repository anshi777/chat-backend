import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not configured");
}

export const generateAccessToken = (userId: string): string => {
  return jwt.sign(
    { userId },
    JWT_SECRET,
    {
      expiresIn: "1h",
      issuer: "chat-backend",
      audience: "chat-backend-users",
    }
  );
};

export const verifyAccessToken = (token: string) => {
  return jwt.verify(token, JWT_SECRET, {
    issuer: "chat-backend",
    audience: "chat-backend-users",
  });
};