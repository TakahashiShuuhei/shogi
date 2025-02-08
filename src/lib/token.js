import crypto from 'crypto';

export function generateToken(email) {
  const secret = process.env.SECRET_KEY || 'default-secret-key';
  return crypto
    .createHash('sha256')
    .update(email + secret)
    .digest('hex');
} 