import "dotenv/config";
import express, { Request, Response } from "express";
import userRoutes from "./modules/users/user.routes";
import chatRoutes from "./modules/chats/chat.routes";
import messageRoutes from "./modules/messages/message.routes";
import userChatRoutes from "./modules/users/user-chat.routes";
import { authenticateToken } from "./modules/auth/auth.middleware";

const app = express();

app.use(express.json());

app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Chat backend is running!",
  });
});

// Public routes: registration and login
app.use("/api/users", userRoutes);

// Protected API routes
app.use("/api/chats", authenticateToken, chatRoutes);
app.use("/api/chats", authenticateToken, messageRoutes);

// Assignment-compatible protected routes
app.use("/chat", authenticateToken, chatRoutes);
app.use("/chat", authenticateToken, messageRoutes);
app.use("/user", authenticateToken, userChatRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});