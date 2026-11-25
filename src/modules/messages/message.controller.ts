
import { Request, Response } from "express";
import {
  sendMessageSchema,
  getMessagesQuerySchema,
  markReadSchema,
  getReadReceiptsQuerySchema,
  getLastSeenSchema,
  editMessageSchema,
  deleteMessageSchema,
  getUserChatsSchema,
  updateLastSeenSchema,
} from "./message.validation";
import {
  createMessage,
  getMessages,
  getMessageReadReceipts,
  getMemberLastSeen,
  getUserChats,
  editMessage,
  deleteMessage,
  updateMemberLastSeen,
} from "./message.model";

import { markMessageAsRead } from "./message.model";



// POST: Send a message
export const sendMessageController = async (
  req: Request,
  res: Response
) => {
  try {
    const chatId = req.params.chatId as string;

    const validation = sendMessageSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid message data",
        errors: validation.error.flatten(),
      });
    }

const { text } = validation.data;
const senderId = req.user!.id;

const message = await createMessage(chatId, senderId, text);

    if (!message) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this chat",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: message,
    });
  } catch (error) {
    console.error("Send message error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to send message",
    });
  }
};

// GET: Retrieve messages
export const getMessagesController = async (
  req: Request,
  res: Response
) => {
  try {
    const chatId = req.params.chatId as string;

    const validation = getMessagesQuerySchema.safeParse(req.query);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid query parameters",
        errors: validation.error.flatten(),
      });
    }

    const { limit, cursor } = validation.data;
const userId = req.user!.id;

const messages = await getMessages(chatId, userId, limit, cursor);

    if (!messages) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this chat",
      });
    }

    const nextCursor =
      messages.length > 0
        ? messages[0].id
        : null;

    return res.status(200).json({
      success: true,
      message: "Messages retrieved successfully",
      data: messages,
      pagination: {
        limit,
        nextCursor,
        hasMore: messages.length === limit,
      },
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "INVALID_MESSAGE_CURSOR"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid message cursor",
      });
    }

    console.error("Get messages error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve messages",
    });
  }
};


export const markMessageAsReadController = async (
  req: Request,
  res: Response
) => {
  try {
   const chatId = req.params.chatId;
   const messageId = req.params.messageId;

if (
  typeof chatId !== "string" ||
  typeof messageId !== "string"
) {
  return res.status(400).json({
    success: false,
    message: "Invalid chat ID or message ID",
  });
}

    const validation = markReadSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid request data",
        errors: validation.error.flatten(),
      });
    }

    const { userId } = validation.data;

    const result = await markMessageAsRead(
      chatId,
      messageId,
      userId
    );

    if (result === null) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this chat",
      });
    }

    if (result === undefined) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Message marked as read",
      data: result,
    });
  } catch (error) {
    console.error("Mark message as read error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to mark message as read",
    });
  }
};


export const getMessageReadReceiptsController = async (
  req: Request,
  res: Response
) => {
  try {
    const chatId = req.params.chatId;
    const messageId = req.params.messageId;

    if (
      typeof chatId !== "string" ||
      typeof messageId !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid chat ID or message ID",
      });
    }

    const validation = getReadReceiptsQuerySchema
    .safeParse(
      req.query
    );

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid query parameters",
        errors: validation.error.flatten(),
      });
    }

    const { userId } = validation.data;

    const receipts = await getMessageReadReceipts(
      chatId,
      messageId,
      userId
    );

    if (receipts === null) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this chat",
      });
    }

    if (receipts === undefined) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Read receipts retrieved successfully",
      data: receipts,
    });
  } catch (error) {
    console.error("Get read receipts error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve read receipts",
    });
  }
};



export const getMemberLastSeenController = async (
  req: Request,
  res: Response
) => {
  try {
    const chatId = req.params.chatId;

    if (typeof chatId !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid chat ID",
      });
    }

    const validation = getLastSeenSchema.safeParse(req.query);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid query parameters",
        errors: validation.error.flatten(),
      });
    }

    const { memberId } = validation.data;
const requesterId = req.user!.id;
    const lastSeen = await getMemberLastSeen(
      chatId,
      requesterId,
      memberId
    );

    if (!lastSeen) {
      return res.status(403).json({
        success: false,
        message: "User is not a member of this chat",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Last seen retrieved successfully",
      data: lastSeen,
    });
  } catch (error) {
    console.error("Get last seen error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve last seen",
    });
  }
};



export const getUserChatsController = async (
  req: Request,
  res: Response
) => {
  try {
    const validation = getUserChatsSchema.safeParse(req.query);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid query parameters",
        errors: validation.error.flatten(),
      });
    }

    const { userId } = validation.data;

    const chats = await getUserChats(userId);

    return res.status(200).json({
      success: true,
      message: "User chats retrieved successfully",
      data: chats,
    });
  } catch (error) {
    console.error("Get user chats error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve user chats",
    });
  }
};



export const editMessageController = async (
  req: Request,
  res: Response
) => {
  try {
    const chatId = req.params.chatId;
    const messageId = req.params.messageId;

    if (
      typeof chatId !== "string" ||
      typeof messageId !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid chat ID or message ID",
      });
    }

    const validation = editMessageSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid request data",
        errors: validation.error.flatten(),
      });
    }

    const { text } = validation.data;
const userId = req.user!.id;

const updatedMessage = await editMessage(chatId, messageId, userId, text);

    if (updatedMessage === null) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this chat",
      });
    }

    if (updatedMessage === undefined) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Message updated successfully",
      data: updatedMessage,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "ONLY_SENDER_CAN_EDIT"
    ) {
      return res.status(403).json({
        success: false,
        message: "Only the original sender can edit this message",
      });
    }

    if (
      error instanceof Error &&
      error.message === "MESSAGE_ALREADY_DELETED"
    ) {
      return res.status(400).json({
        success: false,
        message: "Deleted messages cannot be edited",
      });
    }

    console.error("Edit message error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to edit message",
    });
  }
};



export async function deleteMessageController(
  req: Request,
  res: Response
) {
  try {
    const { chatId, messageId } = req.params;

    if (typeof chatId !== "string" || typeof messageId !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid chat or message ID",
      });
    }

    const validation = deleteMessageSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: validation.error.issues,
      });
    }

    const { userId } = validation.data;

    const deletedMessage = await deleteMessage(
      chatId,
      messageId,
      userId
    );

    if (deletedMessage === null) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this chat",
      });
    }

    if (deletedMessage === undefined) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Message deleted successfully",
      data: deletedMessage,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "ONLY_SENDER_CAN_DELETE") {
        return res.status(403).json({
          success: false,
          message: "Only the original sender can delete this message",
        });
      }

      if (error.message === "MESSAGE_ALREADY_DELETED") {
        return res.status(400).json({
          success: false,
          message: "Message has already been deleted",
        });
      }
    }

    console.error("Delete message error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}


export async function updateLastSeenController(
  req: Request,
  res: Response
) {
  try {
    const { chatId } = req.params;

    if (typeof chatId !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid chat ID",
      });
    }

    const validation = updateLastSeenSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: validation.error.issues,
      });
    }

    const { messageId } = validation.data;
const userId = req.user!.id;

const result = await updateMemberLastSeen(chatId, userId, messageId);

    if (result === null) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this chat",
      });
    }

    if (result === undefined) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: result.updated
        ? "Last seen updated successfully"
        : "Last seen cannot move backwards",
      data: result,
    });
  } catch (error) {
    console.error("Update last seen error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}
