import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { prisma } from './prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'transcrilab-dev-secret-change-in-production'
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days

export interface JWTPayload {
  userId: string
  email: string
  name: string
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch {
    return null
  }
}

export async function createSession(userId: string): Promise<string> {
  const token = generateToken({ userId, email: '', name: '' })
  const expiresAt = new Date(Date.now() + SESSION_DURATION)

  await prisma.session.create({
    data: {
      token,
      userId,
      expiresAt,
    },
  })

  return token
}

export async function getSession(): Promise<JWTPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('session')?.value

  if (!token) return null

  const payload = verifyToken(token)
  if (!payload) return null

  // Verify session exists in DB and is not expired
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  })

  if (!session || session.expiresAt < new Date()) {
    return null
  }

  return {
    userId: session.user.id,
    email: session.user.email,
    name: session.user.name,
  }
}

export async function getCurrentUser() {
  const session = await getSession()
  if (!session) return null

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      emailVerified: true,
      createdAt: true,
    },
  })

  return user
}

export async function destroySession(token: string): Promise<void> {
  await prisma.session.deleteMany({
    where: { token },
  })
}

export async function generatePasswordResetToken(userId: string): Promise<string> {
  // Invalidate existing tokens
  await prisma.passwordResetToken.updateMany({
    where: { userId, used: false },
    data: { used: true },
  })

  // Create new token (valid for 1 hour)
  const token = jwt.sign({ userId, type: 'password-reset' }, JWT_SECRET, { expiresIn: '1h' })
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

  await prisma.passwordResetToken.create({
    data: {
      token,
      userId,
      expiresAt,
    },
  })

  return token
}

export async function verifyPasswordResetToken(token: string): Promise<string | null> {
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
  })

  if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
    return null
  }

  return resetToken.userId
}

export async function consumePasswordResetToken(token: string): Promise<void> {
  await prisma.passwordResetToken.update({
    where: { token },
    data: { used: true },
  })
}
