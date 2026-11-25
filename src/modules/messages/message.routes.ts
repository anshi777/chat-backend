
import { Router } from "express";
import {
  sendMessageController,
  getMessagesController,
  markMessageAsReadController,
  getMessageReadReceiptsController,
  getMemberLastSeenController,
  getUserChatsController,
  editMessageController,
  deleteMessageController,
  updateLastSeenController,
} from "./message.controller";

const router = Router();

router.post("/:chatId/messages", sendMessageController);
router.get("/:chatId/messages", getMessagesController);
router.get(
  "/:chatId/messages/:messageId/reads",
  getMessageReadReceiptsController
);
router.get(
  "/:chatId/members/:memberId/last-seen",
  getMemberLastSeenController
);
router.get("/", getUserChatsController);
router.patch(
  "/:chatId/messages/:messageId",
  editMessageController
);
router.delete(
  "/:chatId/messages/:messageId",
  deleteMessageController
);
router.post(
  "/:chatId/lastseen",
  updateLastSeenController
);
router.post(
  "/:chatId/messages/:messageId/read",
  markMessageAsReadController
);

// Assignment-compatible routes
router.post(
  "/:chatId/message/send",
  sendMessageController
);

router.post(
  "/:chatId/message/:messageId/read",
  markMessageAsReadController
);

export default router;
