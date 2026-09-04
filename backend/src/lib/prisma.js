import { PrismaClient } from '@prisma/client'

// Reuse a single PrismaClient instance across hot-reloads in development
const prisma = new PrismaClient()

export default prisma
