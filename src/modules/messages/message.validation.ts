
import { z } from "zod";

// Send message
export const sendMessageSchema = z.object({
  text: z.string().trim().min(1).max(5000),
});

// Get messages
export const getMessagesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

// Mark message as read
export const markReadSchema = z.object({});

// Get read receipts
export const getReadReceiptsQuerySchema = z.object({});

// Get last seen
export const getLastSeenSchema = z.object({
  memberId: z.string().uuid(),
});

// Get user chats
export const getUserChatsSchema = z.object({});

// Edit message
export const editMessageSchema = z.object({
  text: z.string().trim().min(1).max(5000),
});

// Delete message
export const deleteMessageSchema = z.object({});

// Update last seen
export const updateLastSeenSchema = z.object({
  messageId: z.string().min(1),
});

