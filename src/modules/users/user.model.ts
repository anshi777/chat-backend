import bcrypt from "bcryptjs";
import { prisma } from "../../config/prisma";

export const createUser = async (
  name: string,
  email: string,
  password: string
) => {
  const passwordHash = await bcrypt.hash(password, 12);

  return prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    },
  });
};

export const findUserByEmail = async (email: string) => {
  return prisma.user.findUnique({
    where: { email },
  });
};