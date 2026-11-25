
import { z } from "zod";

// Validate the other participant's ID.
// The logged-in user's ID comes from the JWT.
export const createDirectChatSchema = z.object({
  otherUserId: z.string().uuid(),
});

// Validate user ID for listing chats
export const getUserChatsParamsSchema = z.object({
  userId: z.string().uuid(),
});
