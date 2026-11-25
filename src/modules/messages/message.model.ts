
import { FieldValue } from "firebase-admin/firestore";
import { db } from "../../config/firebase";
import { prisma } from "../../config/prisma";

// Check whether a user belongs to a chat
export const isChatMember = async (
  chatId: string,
  userId: string
): Promise<boolean> => {
  const membership = await prisma.chatMember.findUnique({
    where: {
      chatId_userId: {
        chatId,
        userId,
      },
    },
    select: {
      id: true,
    },
  });

  return Boolean(membership);
};

// Send a message
export const createMessage = async (
  chatId: string,
  senderId: string,
  text: string
) => {
  const isMember = await isChatMember(chatId, senderId);

  if (!isMember) return null;

  const messageRef = db
    .collection("chats")
    .doc(chatId)
    .collection("messages")
    .doc();

  const messageData = {
    id: messageRef.id,
    senderId,
    text,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    isEdited: false,
    isDeleted: false,
  };

  await messageRef.set(messageData);

  const savedMessage = await messageRef.get();

  return savedMessage.data();
};

// Retrieve messages with pagination
export const getMessages = async (
  chatId: string,
  userId: string,
  limit: number,
  cursor?: string
) => {
  const isMember = await isChatMember(chatId, userId);

  if (!isMember) return null;

  const messagesRef = db
    .collection("chats")
    .doc(chatId)
    .collection("messages");

  let query = messagesRef
    .orderBy("createdAt", "desc")
    .limit(limit);

  if (cursor) {
    const cursorSnapshot = await messagesRef.doc(cursor).get();

    if (!cursorSnapshot.exists) {
      throw new Error("INVALID_MESSAGE_CURSOR");
    }

    query = query.startAfter(cursorSnapshot);
  }

  const snapshot = await query.get();

  return snapshot.docs.reverse().map((document) => document.data());
};

// Mark a message as read
export const markMessageAsRead = async (
  chatId: string,
  messageId: string,
  userId: string
) => {
  const isMember = await isChatMember(chatId, userId);

  if (!isMember) return null;

  const messageRef = db
    .collection("chats")
    .doc(chatId)
    .collection("messages")
    .doc(messageId);

  const messageSnapshot = await messageRef.get();

  if (!messageSnapshot.exists) {
    return undefined;
  }

  const readAt = new Date();

  const readRef = messageRef
    .collection("reads")
    .doc(userId);

  await readRef.set(
    {
      userId,
      readAt,
    },
    { merge: true }
  );

  const lastSeenRef = db
    .collection("chats")
    .doc(chatId)
    .collection("members")
    .doc(userId);

  await lastSeenRef.set(
    {
      userId,
      lastSeenMessageId: messageId,
      lastSeenAt: readAt,
    },
    { merge: true }
  );

  return {
    messageId,
    userId,
    readAt,
  };
};



export const getMessageReadReceipts = async (
  chatId: string,
  messageId: string,
  userId: string
) => {
  // Verify that the requesting user belongs to this chat
  const isMember = await isChatMember(chatId, userId);

  if (!isMember) return null;

  // Verify that the message exists
  const messageRef = db
    .collection("chats")
    .doc(chatId)
    .collection("messages")
    .doc(messageId);

  const messageSnapshot = await messageRef.get();

  if (!messageSnapshot.exists) {
    return undefined;
  }

  // Retrieve all read receipts for this message
  const snapshot = await messageRef
    .collection("reads")
    .get();

  return snapshot.docs.map((document) => document.data());
};



export const getMemberLastSeen = async (
  chatId: string,
  requesterId: string,
  memberId: string
) => {
  // Verify that the requesting user belongs to this chat
  const requesterIsMember = await isChatMember(
    chatId,
    requesterId
  );

  if (!requesterIsMember) return null;

  // Verify that the requested member belongs to this chat
  const targetIsMember = await isChatMember(
    chatId,
    memberId
  );

  if (!targetIsMember) return null;

  // Retrieve last-seen information from Firestore
  const lastSeenRef = db
    .collection("chats")
    .doc(chatId)
    .collection("members")
    .doc(memberId);

  const snapshot = await lastSeenRef.get();

  if (!snapshot.exists) {
    return {
      userId: memberId,
      lastSeenMessageId: null,
      lastSeenAt: null,
    };
  }

  return snapshot.data();
};


// Get all chats belonging to a user
export const getUserChats = async (userId: string) => {
  // 1. Find all chats where the user is a member
  const memberships = await prisma.chatMember.findMany({
    where: {
      userId,
    },
    include: {
      chat: {
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      },
    },
  });

  // 2. Fetch the latest message for each chat
  const chatsWithLastMessage = await Promise.all(
    memberships.map(async (membership) => {
      const messagesSnapshot = await db
        .collection("chats")
        .doc(membership.chatId)
        .collection("messages")
        .orderBy("createdAt", "desc")
        .limit(1)
        .get();

      const lastMessage = messagesSnapshot.empty
        ? null
        : messagesSnapshot.docs[0].data();

      return {
        ...membership.chat,
        members: membership.chat.members,
        lastMessage,
      };
    })
  );

  // 3. Return chats with latest message first
  return chatsWithLastMessage.sort((a, b) => {
    const timeA = a.lastMessage?.createdAt?.toMillis() ?? 0;
    const timeB = b.lastMessage?.createdAt?.toMillis() ?? 0;

    return timeB - timeA;
  });
};



export const editMessage = async (
  chatId: string,
  messageId: string,
  userId: string,
  newText: string
) => {
  // 1. Verify that the user belongs to this chat
  const isMember = await isChatMember(chatId, userId);

  if (!isMember) return null;

  // 2. Get the message reference
  const messageRef = db
    .collection("chats")
    .doc(chatId)
    .collection("messages")
    .doc(messageId);

  // 3. Check whether the message exists
  const messageSnapshot = await messageRef.get();

  if (!messageSnapshot.exists) {
    return undefined;
  }

  const messageData = messageSnapshot.data();

  // 4. Only the original sender can edit
  if (messageData?.senderId !== userId) {
    throw new Error("ONLY_SENDER_CAN_EDIT");
  }

  // 5. Don't allow editing deleted messages
  if (messageData?.isDeleted === true) {
    throw new Error("MESSAGE_ALREADY_DELETED");
  }

  // 6. Update the message
  await messageRef.update({
    text: newText,
    isEdited: true,
    updatedAt: FieldValue.serverTimestamp(),
  });

  // 7. Return the updated message
  const updatedSnapshot = await messageRef.get();

  return updatedSnapshot.data();
};

export async function deleteMessage(
  chatId: string,
  messageId: string,
  userId: string
) {
  // 1. Check whether the user belongs to this chat
  const isMember = await isChatMember(chatId, userId);

  if (!isMember) {
    return null;
  }

  // 2. Find the message in Firestore
  const messageRef = db
    .collection("chats")
    .doc(chatId)
    .collection("messages")
    .doc(messageId);

  const messageDoc = await messageRef.get();

  if (!messageDoc.exists) {
    return undefined;
  }

  const message = messageDoc.data()!;

  // 3. Only the original sender can delete the message
  if (message.senderId !== userId) {
    throw new Error("ONLY_SENDER_CAN_DELETE");
  }

  // 4. Prevent deleting an already deleted message
  if (message.isDeleted) {
    throw new Error("MESSAGE_ALREADY_DELETED");
  }

  // 5. Soft delete the message
  await messageRef.update({
    text: "This message was deleted",
    isDeleted: true,
    deletedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  // 6. Return the updated message
  const updatedDoc = await messageRef.get();

  return {
    id: updatedDoc.id,
    ...updatedDoc.data(),
  };
}

export async function updateMemberLastSeen(
  chatId: string,
  userId: string,
  messageId: string
) {
  // 1. Verify that the user belongs to this chat
  const isMember = await isChatMember(chatId, userId);

  if (!isMember) {
    return null;
  }

  // 2. Get the message whose position should be marked as seen
  const messageRef = db
    .collection("chats")
    .doc(chatId)
    .collection("messages")
    .doc(messageId);

  const messageDoc = await messageRef.get();

  if (!messageDoc.exists) {
    return undefined;
  }

  const message = messageDoc.data()!;

  // 3. Get this user's existing last-seen information
  const memberRef = db
    .collection("chats")
    .doc(chatId)
    .collection("members")
    .doc(userId);

  const memberDoc = await memberRef.get();
  const previousMessageId = memberDoc.data()?.lastSeenMessageId;

  // 4. Prevent last-seen from moving backwards
  if (previousMessageId) {
    const previousMessageDoc = await db
      .collection("chats")
      .doc(chatId)
      .collection("messages")
      .doc(previousMessageId)
      .get();

    if (previousMessageDoc.exists) {
      const previousMessage = previousMessageDoc.data()!;

      const previousTime = previousMessage.createdAt.toMillis();
      const newTime = message.createdAt.toMillis();

      if (newTime < previousTime) {
        return {
          lastSeenMessageId: previousMessageId,
          lastSeenAt: memberDoc.data()?.lastSeenAt,
          updated: false,
        };
      }
    }
  }

  // 5. Update last-seen information
  await memberRef.set(
    {
      lastSeenMessageId: messageId,
      lastSeenAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return {
    lastSeenMessageId: messageId,
    updated: true,
  };
}