import { Router } from "express";
import { getUserChatsController } from "../chats/chat.controller";

const router = Router();

router.get("/chats", getUserChatsController);

export default router;