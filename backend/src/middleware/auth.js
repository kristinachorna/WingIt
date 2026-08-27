import jwt from 'jsonwebtoken';

// Every protected route runs this first. It reads the JWT from the
// Authorization header, verifies it, and attaches the user id to req.user
// so controllers can trust req.user.id without re-checking credentials.
export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed token' });
  }

  const token = header.slice('Bearer '.length);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.userId };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
