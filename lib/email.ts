const BREVO_API_KEY = process.env.BREVO_API_KEY
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email'

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@transcrilab.com.br'
const FROM_NAME = process.env.FROM_NAME || 'TranscriLab'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://transcrilab-dev.ramongomessilva.com.br'

interface SendEmailParams {
  to: string
  toName?: string
  subject: string
  htmlContent: string
  textContent?: string
}

export async function sendEmail({ to, toName, subject, htmlContent, textContent }: SendEmailParams): Promise<boolean> {
  if (!BREVO_API_KEY) {
    console.error('BREVO_API_KEY not configured')
    return false
  }

  try {
    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: FROM_NAME, email: FROM_EMAIL },
        to: [{ email: to, name: toName || to }],
        subject,
        htmlContent,
        textContent: textContent || htmlContent.replace(/<[^>]*>/g, ''),
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Brevo API error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Email send error:', error)
    return false
  }
}

// Email Templates

export async function sendWelcomeEmail(to: string, name: string): Promise<boolean> {
  return sendEmail({
    to,
    toName: name,
    subject: 'Bem-vindo ao TranscriLab! 🎉',
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 20px 0; }
          .logo { width: 60px; height: 60px; background: #6366f1; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: bold; }
          .content { background: #f9fafb; border-radius: 12px; padding: 30px; margin: 20px 0; }
          .button { display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; }
          .footer { text-align: center; color: #6b7280; font-size: 14px; padding: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">T</div>
            <h1>Bem-vindo ao TranscriLab!</h1>
          </div>
          <div class="content">
            <p>Olá <strong>${name}</strong>,</p>
            <p>Sua conta foi criada com sucesso! 🎉</p>
            <p>Com o TranscriLab você pode:</p>
            <ul>
              <li>Transcrever áudios automaticamente</li>
              <li>Gravar em tempo real</li>
              <li>Gerar resumos com IA</li>
              <li>Organizar suas transcrições</li>
            </ul>
            <p style="text-align: center; margin-top: 30px;">
              <a href="${APP_URL}" class="button">Acessar TranscriLab</a>
            </p>
          </div>
          <div class="footer">
            <p>TranscriLab - Transforme áudio em texto com inteligência</p>
          </div>
        </div>
      </body>
      </html>
    `,
  })
}

export async function sendPasswordResetEmail(to: string, name: string, resetToken: string): Promise<boolean> {
  const resetUrl = `${APP_URL}/reset-password?token=${resetToken}`
  
  return sendEmail({
    to,
    toName: name,
    subject: 'Redefinir sua senha - TranscriLab',
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 20px 0; }
          .logo { width: 60px; height: 60px; background: #6366f1; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: bold; }
          .content { background: #f9fafb; border-radius: 12px; padding: 30px; margin: 20px 0; }
          .button { display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; }
          .warning { background: #fef3c7; border-radius: 8px; padding: 15px; margin: 20px 0; color: #92400e; }
          .footer { text-align: center; color: #6b7280; font-size: 14px; padding: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">T</div>
            <h1>Redefinir Senha</h1>
          </div>
          <div class="content">
            <p>Olá <strong>${name}</strong>,</p>
            <p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>
            <p>Clique no botão abaixo para criar uma nova senha:</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" class="button">Redefinir Senha</a>
            </p>
            <div class="warning">
              ⚠️ Este link expira em <strong>1 hora</strong>. Se você não solicitou a redefinição, ignore este email.
            </div>
            <p style="font-size: 12px; color: #6b7280;">
              Se o botão não funcionar, copie e cole este link no navegador:<br>
              <a href="${resetUrl}">${resetUrl}</a>
            </p>
          </div>
          <div class="footer">
            <p>TranscriLab - Transforme áudio em texto com inteligência</p>
          </div>
        </div>
      </body>
      </html>
    `,
  })
}

export async function sendPasswordChangedEmail(to: string, name: string): Promise<boolean> {
  return sendEmail({
    to,
    toName: name,
    subject: 'Senha alterada com sucesso - TranscriLab',
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 20px 0; }
          .logo { width: 60px; height: 60px; background: #6366f1; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: bold; }
          .content { background: #f9fafb; border-radius: 12px; padding: 30px; margin: 20px 0; }
          .success { background: #d1fae5; border-radius: 8px; padding: 15px; margin: 20px 0; color: #065f46; text-align: center; }
          .button { display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; }
          .footer { text-align: center; color: #6b7280; font-size: 14px; padding: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">T</div>
            <h1>Senha Alterada</h1>
          </div>
          <div class="content">
            <p>Olá <strong>${name}</strong>,</p>
            <div class="success">
              ✅ Sua senha foi alterada com sucesso!
            </div>
            <p>Se você não fez essa alteração, entre em contato conosco imediatamente.</p>
            <p style="text-align: center; margin-top: 30px;">
              <a href="${APP_URL}/login" class="button">Fazer Login</a>
            </p>
          </div>
          <div class="footer">
            <p>TranscriLab - Transforme áudio em texto com inteligência</p>
          </div>
        </div>
      </body>
      </html>
    `,
  })
}
