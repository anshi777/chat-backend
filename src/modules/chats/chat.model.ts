
import { prisma } from "../../config/prisma";

export const createOrGetDirectChat = async (
  userId: string,
  otherUserId: string
) => {
  // 1. Check whether both users exist
  const users = await prisma.user.findMany({
    where: {
      id: {
        in: [userId, otherUserId],
      },
    },
    select: {
      id: true,
    },
  });

  if (users.length !== 2) {
    return null;
  }

  // 2. Generate a consistent key for both users
  // A-B and B-A will produce the same key
  const directKey = [userId, otherUserId].sort().join("_");

  // 3. Check whether this direct chat already exists
  const existingChat = await prisma.chat.findUnique({
    where: {
      directKey,
    },
    include: {
      members: {
        include: {
          user: true,
        },
      },
    },
  });

  if (existingChat) {
    return {
      chat: existingChat,
      created: false,
    };
  }

  // 4. Create chat and members in one transaction
  try {
    const chat = await prisma.$transaction(async (tx) => {
      const newChat = await tx.chat.create({
        data: {
          type: "DIRECT",
          directKey,
        },
      });

      await tx.chatMember.createMany({
        data: [
          { chatId: newChat.id, userId },
          { chatId: newChat.id, userId: otherUserId },
        ],
      });

      return tx.chat.findUniqueOrThrow({
        where: {
          id: newChat.id,
        },
        include: {
          members: {
            include: {
              user: true,
            },
          },
        },
      });
    });

    return {
      chat,
      created: true,
    };
  } catch (error) {
    // Another request might have created the same chat simultaneously.
    // The unique directKey constraint protects against duplicates.
    const existingChatAfterConflict = await prisma.chat.findUnique({
      where: {
        directKey,
      },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    if (existingChatAfterConflict) {
      return {
        chat: existingChatAfterConflict,
        created: false,
      };
    }

    throw error;
  }
};


export const getUserChats = async (userId: string) => {
  const chats = await prisma.chatMember.findMany({
    where: {
      userId,
    },
    include: {
      chat: {
        include: {
          members: {
            select: {
              userId: true,
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
    orderBy: {
      chat: {
        updatedAt: "desc",
      },
    },
  });

  return chats.map((chatMember) => chatMember.chat);
};