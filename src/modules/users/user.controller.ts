import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { createUserSchema, loginSchema } from "./user.validation";
import { createUser, findUserByEmail } from "./user.model";
import { generateAccessToken } from "../auth/jwt";

export const registerUser = async (
  req: Request,
  res: Response
) => {
  const validation = createUserSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid user data",
      errors: validation.error.issues,
    });
  }

  try {
  const { name, email, password } = validation.data;

const user = await createUser(name, email, password);

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      data: user,
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return res.status(409).json({
        success: false,
        message: "Email already exists",
      });
    }

    console.error("Register user error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const loginUser = async (
  req: Request,
  res: Response
) => {
  const validation = loginSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid login data",
      errors: validation.error.issues,
    });
  }

  try {
    const { email, password } = validation.data;

    const user = await findUserByEmail(email);

    if (!user || !user.passwordHash) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const accessToken = generateAccessToken(user.id);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        accessToken,
        tokenType: "Bearer",
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};