import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { query } from '../db/index.js';

const SALT_ROUNDS = 12;
const RESET_TOKEN_TTL_MINUTES = 15;

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function register(req, res) {
  const { username, email, password, display_name } = req.body;

  if (!username || !email || !password || !display_name) {
    return res.status(400).json({ error: 'username, email, password, and display_name are required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  try {
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await query(
      `INSERT INTO users (username, email, password_hash, display_name)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, display_name, avatar_url, created_at`,
      [username, email, password_hash, display_name]
    );

    const user = result.rows[0];
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.status(201).json({ user, token });
  } catch (err) {
    // Postgres unique_violation code
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Username or email already in use' });
    }
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
}

export async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  try {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    // Same error for "no user" and "wrong password" — don't leak which one failed.
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.json({
      user: {
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        avatar_url: user.avatar_url,
      },
      token,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
}

export async function me(req, res) {
  const result = await query(
    'SELECT id, username, email, display_name, avatar_url, created_at FROM users WHERE id = $1',
    [req.user.id]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'User not found' });
  res.json(result.rows[0]);
}

// Step 1: user requests a reset. In a real deployment this would email a link
// containing the token — there's no email service configured here, so for
// local development we return the token directly in the response and log it.
// NEVER do this in production; replace with an actual email send before launch.
export async function forgotPassword(req, res) {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'email is required' });

  const result = await query('SELECT id FROM users WHERE email = $1', [email]);
  const user = result.rows[0];

  // Always respond the same way whether or not the email exists, so a caller
  // can't use this endpoint to discover which emails have accounts.
  if (!user) {
    return res.json({ message: 'If that email has an account, a reset link has been sent.' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000);

  await query(
    'UPDATE users SET reset_token_hash = $1, reset_token_expires_at = $2 WHERE id = $3',
    [tokenHash, expiresAt, user.id]
  );

  console.log(`[DEV ONLY] Password reset token for ${email}: ${token}`);

  res.json({
    message: 'If that email has an account, a reset link has been sent.',
    dev_token: token, // remove this field once real email sending is added
  });
}

// Step 2: user submits the token (from the email link, or the dev_token above)
// plus a new password.
export async function resetPassword(req, res) {
  const { token, new_password } = req.body;
  if (!token || !new_password) {
    return res.status(400).json({ error: 'token and new_password are required' });
  }
  if (new_password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  const tokenHash = hashToken(token);
  const result = await query(
    `SELECT id FROM users
     WHERE reset_token_hash = $1 AND reset_token_expires_at > now()`,
    [tokenHash]
  );
  const user = result.rows[0];
  if (!user) {
    return res.status(400).json({ error: 'Reset link is invalid or has expired' });
  }

  const password_hash = await bcrypt.hash(new_password, SALT_ROUNDS);
  await query(
    'UPDATE users SET password_hash = $1, reset_token_hash = NULL, reset_token_expires_at = NULL WHERE id = $2',
    [password_hash, user.id]
  );

  res.json({ message: 'Password updated — you can now log in with your new password.' });
}

// Registers this device's Expo push token so the backend can send notifications.
export async function registerPushToken(req, res) {
  const { push_token } = req.body;
  if (!push_token) return res.status(400).json({ error: 'push_token is required' });

  await query('UPDATE users SET push_token = $1 WHERE id = $2', [push_token, req.user.id]);
  res.json({ message: 'Push token registered' });
}
