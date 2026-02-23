import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16

/**
 * Deriva uma chave de criptografia a partir do secret
 */
function deriveKey(secret: string): Buffer {
  // Usa scrypt para derivar a chave (mais seguro que hash simples)
  return scryptSync(secret, 'transcrilab-salt', KEY_LENGTH)
}

/**
 * Criptografa uma string
 * Retorna: iv:authTag:encryptedData (base64)
 */
export function encrypt(text: string, secret: string): string {
  const key = deriveKey(secret)
  const iv = randomBytes(IV_LENGTH)
  
  const cipher = createCipheriv(ALGORITHM, key, iv)
  
  let encrypted = cipher.update(text, 'utf8', 'base64')
  encrypted += cipher.final('base64')
  
  const authTag = cipher.getAuthTag()
  
  // Formato: iv:authTag:encrypted (todos em base64)
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`
}

/**
 * Descriptografa uma string
 */
export function decrypt(encryptedText: string, secret: string): string {
  const key = deriveKey(secret)
  
  const [ivBase64, authTagBase64, encrypted] = encryptedText.split(':')
  
  if (!ivBase64 || !authTagBase64 || !encrypted) {
    throw new Error('Formato de texto criptografado inválido')
  }
  
  const iv = Buffer.from(ivBase64, 'base64')
  const authTag = Buffer.from(authTagBase64, 'base64')
  
  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)
  
  let decrypted = decipher.update(encrypted, 'base64', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}

/**
 * Gera hint da chave (últimos 4 caracteres)
 */
export function getKeyHint(apiKey: string): string {
  if (apiKey.length < 4) return '****'
  return `****${apiKey.slice(-4)}`
}

/**
 * Obtém o secret de criptografia das variáveis de ambiente
 */
export function getEncryptionSecret(): string {
  const secret = process.env.ENCRYPTION_SECRET || process.env.JWT_SECRET
  if (!secret) {
    throw new Error('ENCRYPTION_SECRET ou JWT_SECRET não configurado')
  }
  return secret
}
