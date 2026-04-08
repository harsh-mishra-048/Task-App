import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'path';

// Root directory database path
const dbPath = path.join(process.cwd(), 'todo.db');

// Initialize the adapter with the path to your SQLite database file
const adapter = new PrismaBetterSqlite3({ 
  url: `file:${dbPath}` 
});

// Create a singleton Prisma client
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
