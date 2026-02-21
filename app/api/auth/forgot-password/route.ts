import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/prisma'
import { generatePasswordResetToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      )
    }

    // Find user
    const user = await getPrisma().user.findUnique({
      where: { email: email.toLowerCase() },
    })

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        message: 'Se o email existir, você receberá instruções para redefinir sua senha',
      })
    }

    // Generate reset token
    const token = await generatePasswordResetToken(user.id)
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`

    // TODO: Send email with reset link
    // For now, log it (in production, use Brevo/Resend)
    console.log('Password reset URL:', resetUrl)

    // In development, return the token for testing
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json({
        message: 'Token de recuperação gerado',
        resetUrl, // Only in dev!
      })
    }

    return NextResponse.json({
      message: 'Se o email existir, você receberá instruções para redefinir sua senha',
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Erro ao processar solicitação' },
      { status: 500 }
    )
  }
}
