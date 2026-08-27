import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';

// DEV-ONLY local disk storage. In production, swap the three functions below
// for calls to S3/R2 (putObject, deleteObject, and a presigned GET URL) —
// nothing outside this file needs to change, because callers only see
// saveImage / deleteImage / getSignedReadUrl.
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

export function saveImage(buffer, key) {
  fs.writeFileSync(path.join(UPLOAD_DIR, key), buffer);
}

export function deleteImage(key) {
  const filePath = path.join(UPLOAD_DIR, key);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
}

export function imageExists(key) {
  return fs.existsSync(path.join(UPLOAD_DIR, key));
}

export function readImage(key) {
  return fs.readFileSync(path.join(UPLOAD_DIR, key));
}

// Short-lived signed token standing in for a cloud provider's presigned URL.
// A real S3/R2 setup would generate this via the SDK instead of a JWT.
export function generateReadToken(key, userId) {
  return jwt.sign({ key, userId }, process.env.JWT_SECRET, { expiresIn: '60s' });
}

export function verifyReadToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET); // throws if invalid/expired
}
