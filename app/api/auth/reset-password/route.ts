import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPasswordResetToken, consumePasswordResetToken, hashPassword } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, password } = body

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token e nova senha são obrigatórios' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      )
    }

    // Verify token
    const userId = await verifyPasswordResetToken(token)
    if (!userId) {
      return NextResponse.json(
        { error: 'Token inválido ou expirado' },
        { status: 400 }
      )
    }

    // Update password
    const passwordHash = await hashPassword(password)
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    })

    // Consume token
    await consumePasswordResetToken(token)

    // Invalidate all sessions for this user
    await prisma.session.deleteMany({
      where: { userId },
    })

    return NextResponse.json({
      message: 'Senha alterada com sucesso. Faça login com sua nova senha.',
    })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'Erro ao redefinir senha' },
      { status: 500 }
    )
  }
}
