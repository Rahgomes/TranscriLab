import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/prisma'
import { generatePasswordResetToken } from '@/lib/auth'
import { sendPasswordResetEmail } from '@/lib/email'

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

    // Send email
    const emailSent = await sendPasswordResetEmail(user.email, user.name, token)

    if (!emailSent) {
      console.error('Failed to send password reset email to:', user.email)
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
