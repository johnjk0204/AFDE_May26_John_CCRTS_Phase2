const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { validationResult } = require('express-validator');
const { query } = require('../config/db');
const emailService = require('../services/email.service');

const generateToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, email, password, phone } = req.body;
    const existing = await query('SELECT user_id FROM users WHERE email = $1', [email]);
    if (existing.rows.length) return res.status(409).json({ message: 'Email already registered.' });

    const roleResult = await query("SELECT role_id FROM roles WHERE role_name = 'Customer'");
    const roleId = roleResult.rows[0].role_id;
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    await query(
      'INSERT INTO users (user_id, name, email, password, phone, role_id) VALUES ($1, $2, $3, $4, $5, $6)',
      [userId, name, email, hashedPassword, phone || null, roleId]
    );

    const token = generateToken(userId);
    res.status(201).json({ message: 'Registration successful.', token, userId });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    const result = await query(
      'SELECT u.*, r.role_name FROM users u JOIN roles r ON u.role_id = r.role_id WHERE u.email = $1',
      [email]
    );
    const user = result.rows[0];
    if (!user) return res.status(401).json({ message: 'Invalid credentials.' });
    if (!user.is_active) return res.status(403).json({ message: 'Account is deactivated.' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials.' });

    const token = generateToken(user.user_id);
    const { password: _, ...safeUser } = user;
    res.json({ message: 'Login successful.', token, user: safeUser });
  } catch (err) {
    next(err);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await query('SELECT user_id, name FROM users WHERE email = $1', [email]);
    if (!result.rows.length) return res.json({ message: 'If this email exists, a reset link has been sent.' });

    const user = result.rows[0];
    const resetToken = uuidv4();
    const expires = new Date(Date.now() + 3600000);

    await query(
      'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE user_id = $3',
      [resetToken, expires, user.user_id]
    );

    await emailService.sendPasswordResetEmail(email, user.name, resetToken);
    res.json({ message: 'If this email exists, a reset link has been sent.' });
  } catch (err) {
    next(err);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const result = await query(
      'SELECT user_id FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()',
      [token]
    );
    if (!result.rows.length) return res.status(400).json({ message: 'Invalid or expired reset token.' });

    const hashedPassword = await bcrypt.hash(password, 10);
    await query(
      'UPDATE users SET password = $1, reset_token = NULL, reset_token_expires = NULL WHERE user_id = $2',
      [hashedPassword, result.rows[0].user_id]
    );
    res.json({ message: 'Password reset successful.' });
  } catch (err) {
    next(err);
  }
};

exports.getMe = async (req, res) => {
  const { password, ...safeUser } = req.user;
  res.json(safeUser);
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await query('SELECT password FROM users WHERE user_id = $1', [req.user.user_id]);
    const valid = await bcrypt.compare(currentPassword, result.rows[0].password);
    if (!valid) return res.status(400).json({ message: 'Current password is incorrect.' });

    const hashed = await bcrypt.hash(newPassword, 10);
    await query('UPDATE users SET password = $1 WHERE user_id = $2', [hashed, req.user.user_id]);
    res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    next(err);
  }
};
