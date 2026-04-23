import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

// TOKEN_ENCRYPTION_KEY は 32バイト hex文字列（64文字）
const KEY = Buffer.from(process.env.TOKEN_ENCRYPTION_KEY!, 'hex');

// 暗号化: AES-256-GCM → "iv:authTag:ciphertext" 形式の hex 文字列を返す
export function encrypt(text: string): string {
  const iv     = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', KEY, iv);
  const enc    = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag    = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${enc.toString('hex')}`;
}

// 復号: encrypt() の出力を受け取り元の文字列を返す
export function decrypt(encryptedText: string): string {
  const [ivHex, tagHex, encHex] = encryptedText.split(':');
  const iv      = Buffer.from(ivHex,  'hex');
  const authTag = Buffer.from(tagHex, 'hex');
  const enc     = Buffer.from(encHex, 'hex');
  const decipher = createDecipheriv('aes-256-gcm', KEY, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
}
