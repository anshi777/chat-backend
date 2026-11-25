
import { Router } from "express";
import { createDirectChatController } from "./chat.controller";

const router = Router();

router.post("/direct", createDirectChatController);
router.post("/create", createDirectChatController);

export default router;
