import { PrismaClient } from "@prisma/client";

// Single shared Prisma client instance (constitution: one relational
// database, no microservices — one client per process is sufficient).
export const prisma = new PrismaClient();
