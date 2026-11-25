import { Request, Response } from "express";
import {
  createDirectChatSchema,
  getUserChatsParamsSchema,
} from "./chat.validation";
import { createOrGetDirectChat, getUserChats } from "./chat.model";

export const createDirectChatController = async (
  req: Request,
  res: Response,
) => {
  try {
    // 1. Validate request body
    const validation = createDirectChatSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid request data",
        errors: validation.error.flatten(),
      });
    }

    const { otherUserId } = validation.data;
    const userId = req.user!.id;
    // 2. Call model to create or get the direct chat
    const result = await createOrGetDirectChat(userId, otherUserId);

    // 3. Check whether both users exist
    if (!result) {
      return res.status(404).json({
        success: false,
        message: "One or both users were not found",
      });
    }

    // 4. Return response
    return res.status(result.created ? 201 : 200).json({
      success: true,
      message: result.created
        ? "Direct chat created successfully"
        : "Direct chat already exists",
      data: result.chat,
    });
  } catch (error) {
    console.error("Create direct chat error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getUserChatsController = async (req: Request, res: Response) => {
  try {
    // 1. Validate userId from URL params

 const userId = req.user!.id;

    // 2. Get all chats belonging to this user
    const chats = await getUserChats(userId);

    // 3. Return the result
    return res.status(200).json({
      success: true,
      message: "User chats fetched successfully",
      count: chats.length,
      data: chats,
    });
  } catch (error) {
    console.error("Get user chats error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
