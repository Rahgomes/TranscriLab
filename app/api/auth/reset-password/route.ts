import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/prisma'
import { verifyPasswordResetToken, consumePasswordResetToken, hashPassword } from '@/lib/auth'
import { sendPasswordChangedEmail } from '@/lib/email'

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

    // Get user info before update
    const user = await getPrisma().user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Update password
    const passwordHash = await hashPassword(password)
    await getPrisma().user.update({
      where: { id: userId },
      data: { passwordHash },
    })

    // Consume token
    await consumePasswordResetToken(token)

    // Invalidate all sessions for this user
    await getPrisma().session.deleteMany({
      where: { userId },
    })

    // Send confirmation email (async)
    sendPasswordChangedEmail(user.email, user.name).catch(err => {
      console.error('Failed to send password changed email:', err)
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
