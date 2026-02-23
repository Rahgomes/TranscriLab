import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jsonResponse, errorResponse, dbUnavailableResponse } from '@/lib/api'
import { getSession } from '@/lib/auth'
import { encrypt, getKeyHint, getEncryptionSecret } from '@/lib/encryption'

export async function GET() {
  if (!prisma) return dbUnavailableResponse()

  try {
    const session = await getSession()
    if (!session) {
      return errorResponse('Não autenticado', 401)
    }

    // Buscar chaves do usuário (sem retornar a chave em si)
    const keys = await prisma.$queryRaw<
      {
        id: string
        provider: string
        name: string
        key_hint: string
        purpose: string
        is_active: boolean
        created_at: Date
      }[]
    >`
      SELECT id, provider, name, key_hint, purpose, is_active, created_at
      FROM api_keys
      WHERE user_id = ${session.userId}::uuid
      ORDER BY created_at DESC
    `

    return jsonResponse({
      keys: keys.map((k) => ({
        id: k.id,
        provider: k.provider,
        name: k.name,
        keyHint: k.key_hint,
        purpose: k.purpose,
        isActive: k.is_active,
        createdAt: k.created_at,
      })),
    })
  } catch (error) {
    console.error('Erro ao buscar API keys:', error)
    return errorResponse('Erro interno', 500)
  }
}

export async function POST(request: NextRequest) {
  if (!prisma) return dbUnavailableResponse()

  try {
    const session = await getSession()
    if (!session) {
      return errorResponse('Não autenticado', 401)
    }

    const body = await request.json()
    const { provider, name, apiKey, purpose = 'ALL' } = body

    if (!provider || !name || !apiKey) {
      return errorResponse('provider, name e apiKey são obrigatórios')
    }

    // Validar provider
    const validProviders = ['OPENAI', 'GROQ', 'ANTHROPIC', 'OTHER']
    if (!validProviders.includes(provider)) {
      return errorResponse(`Provider inválido. Use: ${validProviders.join(', ')}`)
    }

    // Validar purpose
    const validPurposes = ['TRANSCRIPTION', 'CHAT', 'ALL']
    if (!validPurposes.includes(purpose)) {
      return errorResponse(`Purpose inválido. Use: ${validPurposes.join(', ')}`)
    }

    // Criptografar a chave
    const secret = getEncryptionSecret()
    const encryptedKey = encrypt(apiKey, secret)
    const keyHint = getKeyHint(apiKey)

    // Salvar no banco
    const result = await prisma.$queryRaw<{ id: string }[]>`
      INSERT INTO api_keys (user_id, provider, name, encrypted_key, key_hint, purpose)
      VALUES (${session.userId}::uuid, ${provider}::api_key_provider, ${name}, ${encryptedKey}, ${keyHint}, ${purpose}::api_key_purpose)
      RETURNING id
    `

    return jsonResponse(
      {
        id: result[0].id,
        provider,
        name,
        keyHint,
        purpose,
        message: 'Chave de API salva com sucesso',
      },
      201
    )
  } catch (error) {
    console.error('Erro ao salvar API key:', error)
    return errorResponse('Erro ao salvar chave', 500)
  }
}

export async function DELETE(request: NextRequest) {
  if (!prisma) return dbUnavailableResponse()

  try {
    const session = await getSession()
    if (!session) {
      return errorResponse('Não autenticado', 401)
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return errorResponse('ID da chave é obrigatório')
    }

    // Deletar apenas se pertencer ao usuário
    const result = await prisma.$executeRaw`
      DELETE FROM api_keys
      WHERE id = ${id}::uuid AND user_id = ${session.userId}::uuid
    `

    if (result === 0) {
      return errorResponse('Chave não encontrada', 404)
    }

    return jsonResponse({ message: 'Chave removida com sucesso' })
  } catch (error) {
    console.error('Erro ao deletar API key:', error)
    return errorResponse('Erro ao remover chave', 500)
  }
}

export async function PATCH(request: NextRequest) {
  if (!prisma) return dbUnavailableResponse()

  try {
    const session = await getSession()
    if (!session) {
      return errorResponse('Não autenticado', 401)
    }

    const body = await request.json()
    const { id, isActive, purpose, name } = body

    if (!id) {
      return errorResponse('ID da chave é obrigatório')
    }

    // Construir SET clause dinâmico
    const updates: string[] = []
    const values: unknown[] = []

    if (typeof isActive === 'boolean') {
      updates.push('is_active = $1')
      values.push(isActive)
    }

    if (purpose) {
      const validPurposes = ['TRANSCRIPTION', 'CHAT', 'ALL']
      if (!validPurposes.includes(purpose)) {
        return errorResponse(`Purpose inválido. Use: ${validPurposes.join(', ')}`)
      }
      updates.push(`purpose = '${purpose}'::api_key_purpose`)
    }

    if (name) {
      updates.push(`name = '${name}'`)
    }

    if (updates.length === 0) {
      return errorResponse('Nenhum campo para atualizar')
    }

    updates.push('updated_at = NOW()')

    // Atualizar
    await prisma.$executeRaw`
      UPDATE api_keys
      SET is_active = COALESCE(${isActive}, is_active),
          purpose = COALESCE(${purpose}::api_key_purpose, purpose),
          name = COALESCE(${name}, name),
          updated_at = NOW()
      WHERE id = ${id}::uuid AND user_id = ${session.userId}::uuid
    `

    return jsonResponse({ message: 'Chave atualizada com sucesso' })
  } catch (error) {
    console.error('Erro ao atualizar API key:', error)
    return errorResponse('Erro ao atualizar chave', 500)
  }
}
