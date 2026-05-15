const { v4: uuidv4 } = require('uuid');
const { validationResult } = require('express-validator');
const { query } = require('../config/db');

exports.getCategories = async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM categories WHERE is_active = true ORDER BY category_name', []);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

exports.getCategoryById = async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM categories WHERE category_id = $1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ message: 'Category not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

exports.createCategory = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { category_name, description } = req.body;
    const id = uuidv4();
    await query('INSERT INTO categories (category_id, category_name, description) VALUES ($1,$2,$3)', [id, category_name, description || null]);
    res.status(201).json({ message: 'Category created.', categoryId: id });
  } catch (err) {
    next(err);
  }
};

exports.updateCategory = async (req, res, next) => {
  try {
    const { category_name, description, is_active } = req.body;
    await query('UPDATE categories SET category_name=$1, description=$2, is_active=$3 WHERE category_id=$4', [category_name, description, is_active, req.params.id]);
    res.json({ message: 'Category updated.' });
  } catch (err) {
    next(err);
  }
};

exports.deleteCategory = async (req, res, next) => {
  try {
    await query('UPDATE categories SET is_active=false WHERE category_id=$1', [req.params.id]);
    res.json({ message: 'Category deactivated.' });
  } catch (err) {
    next(err);
  }
};
