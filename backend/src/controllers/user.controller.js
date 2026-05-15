const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { validationResult } = require('express-validator');
const { query } = require('../config/db');

exports.getAllUsers = async (req, res, next) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    let sql = `SELECT u.user_id, u.name, u.email, u.phone, u.is_active, u.created_at, r.role_name
               FROM users u JOIN roles r ON u.role_id = r.role_id WHERE 1=1`;
    const params = [];
    if (role) { params.push(role); sql += ` AND r.role_name = $${params.length}`; }
    if (search) { params.push(`%${search}%`); sql += ` AND (u.name ILIKE $${params.length} OR u.email ILIKE $${params.length})`; }
    sql += ` ORDER BY u.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await query(sql, params);
    const countResult = await query('SELECT COUNT(*) FROM users u JOIN roles r ON u.role_id = r.role_id', []);
    res.json({ users: result.rows, total: parseInt(countResult.rows[0].count) });
  } catch (err) {
    next(err);
  }
};

exports.getAgents = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT u.user_id, u.name, u.email FROM users u JOIN roles r ON u.role_id = r.role_id
       WHERE r.role_name = 'Support Agent' AND u.is_active = true ORDER BY u.name`,
      []
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

exports.getUserById = async (req, res, next) => {
  try {
    const result = await query(
      'SELECT u.user_id, u.name, u.email, u.phone, u.is_active, u.created_at, r.role_name FROM users u JOIN roles r ON u.role_id = r.role_id WHERE u.user_id = $1',
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'User not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

exports.createUser = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, email, password, phone, role_id } = req.body;
    const existing = await query('SELECT user_id FROM users WHERE email = $1', [email]);
    if (existing.rows.length) return res.status(409).json({ message: 'Email already exists.' });

    const hashed = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    await query(
      'INSERT INTO users (user_id, name, email, password, phone, role_id) VALUES ($1,$2,$3,$4,$5,$6)',
      [userId, name, email, hashed, phone || null, role_id]
    );
    res.status(201).json({ message: 'User created.', userId });
  } catch (err) {
    next(err);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const { name, phone, role_id } = req.body;
    await query(
      'UPDATE users SET name=$1, phone=$2, role_id=$3, updated_at=NOW() WHERE user_id=$4',
      [name, phone, role_id, req.params.id]
    );
    res.json({ message: 'User updated.' });
  } catch (err) {
    next(err);
  }
};

exports.toggleUserStatus = async (req, res, next) => {
  try {
    await query('UPDATE users SET is_active = NOT is_active, updated_at=NOW() WHERE user_id=$1', [req.params.id]);
    res.json({ message: 'User status toggled.' });
  } catch (err) {
    next(err);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    await query('DELETE FROM users WHERE user_id = $1', [req.params.id]);
    res.json({ message: 'User deleted.' });
  } catch (err) {
    next(err);
  }
};
