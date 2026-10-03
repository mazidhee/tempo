import { randomBytes, scrypt, createCipheriv, createDecipheriv } from 'node:crypto';
import { gzipSync, gunzipSync } from 'node:zlib';
const derive = (password: string, salt: Buffer) =>
  new Promise<Buffer>((resolve, reject) =>
    scrypt(password, salt, 32, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }, (error, key) =>
      error ? reject(error) : resolve(key),
    ),
  );
const maxBytes = 20 * 1024 * 1024;
export async function encryptBackup(value: unknown, password: string) {
  if (typeof password !== 'string' || password.length < 12 || password.length > 1024)
    throw new Error('Choose a backup password of at least 12 characters.');
  const plain = Buffer.from(JSON.stringify(value));
  if (plain.length > maxBytes) throw new Error('Backup exceeds the 20 MB limit.');
  const salt = randomBytes(16),
    iv = randomBytes(12);
  const key = await derive(password, salt);
  try {
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const content = Buffer.concat([cipher.update(gzipSync(plain)), cipher.final()]);
    const envelope = JSON.stringify({
      format: 'tempo-encrypted-backup',
      version: 1,
      kdf: 'scrypt-32768-8-1',
      salt: salt.toString('base64'),
      iv: iv.toString('base64'),
      tag: cipher.getAuthTag().toString('base64'),
      content: content.toString('base64'),
    });
    if (Buffer.byteLength(envelope) > maxBytes)
      throw new Error('Encrypted backup exceeds the 20 MB limit.');
    return envelope;
  } finally {
    key.fill(0);
    plain.fill(0);
  }
}
export async function decryptBackup(input: string, password: string): Promise<unknown> {
  if (
    typeof input !== 'string' ||
    Buffer.byteLength(input) > maxBytes ||
    typeof password !== 'string' ||
    password.length > 1024
  )
    throw new Error('Invalid encrypted backup.');
  let envelope;
  try {
    envelope = JSON.parse(input);
  } catch {
    throw new Error('Invalid encrypted backup.');
  }
  if (
    envelope?.format !== 'tempo-encrypted-backup' ||
    envelope.version !== 1 ||
    envelope.kdf !== 'scrypt-32768-8-1'
  )
    throw new Error('Unsupported encrypted backup format.');
  const decode = (value: unknown, length?: number) => {
    if (typeof value !== 'string' || !/^[A-Za-z0-9+/]*={0,2}$/.test(value))
      throw new Error('Invalid encrypted backup.');
    const bytes = Buffer.from(value, 'base64');
    if (length && bytes.length !== length) throw new Error('Invalid encrypted backup.');
    return bytes;
  };
  const salt = decode(envelope.salt, 16),
    iv = decode(envelope.iv, 12),
    tag = decode(envelope.tag, 16),
    content = decode(envelope.content);
  const key = await derive(password, salt);
  try {
    const cipher = createDecipheriv('aes-256-gcm', key, iv);
    cipher.setAuthTag(tag);
    const compressed = Buffer.concat([cipher.update(content), cipher.final()]);
    return JSON.parse(gunzipSync(compressed, { maxOutputLength: maxBytes }).toString('utf8'));
  } catch {
    throw new Error('Could not unlock backup. Check your password and file.');
  } finally {
    key.fill(0);
  }
}
