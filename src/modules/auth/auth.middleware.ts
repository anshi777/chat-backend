import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "./jwt";
import jwt from "jsonwebtoken";

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Authentication token is required",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verifyAccessToken(token);

    if (
      typeof decoded === "string" ||
      typeof decoded.userId !== "string"
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token",
      });
    }

    req.user = {
      id: decoded.userId,
    };

    return next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        message: "Authentication token has expired",
      });
    }

    return res.status(401).json({
      success: false,
      message: "Invalid authentication token",
    });
  }
};
