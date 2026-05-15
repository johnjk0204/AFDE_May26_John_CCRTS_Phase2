const { v4: uuidv4 } = require('uuid');
const { validationResult } = require('express-validator');
const { query } = require('../config/db');

exports.getAllFeedback = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const result = await query(
      `SELECT f.*, c.complaint_number, u.name as customer_name
       FROM feedback f JOIN complaints c ON f.complaint_id = c.complaint_id
       JOIN users u ON f.customer_id = u.user_id
       ORDER BY f.created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    const count = await query('SELECT COUNT(*) FROM feedback', []);
    res.json({ feedback: result.rows, total: parseInt(count.rows[0].count) });
  } catch (err) {
    next(err);
  }
};

exports.getFeedbackByComplaint = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT f.*, u.name as customer_name FROM feedback f
       JOIN users u ON f.customer_id = u.user_id WHERE f.complaint_id = $1`,
      [req.params.complaintId]
    );
    res.json(result.rows[0] || null);
  } catch (err) {
    next(err);
  }
};

exports.submitFeedback = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { rating, comments } = req.body;
    const { complaintId } = req.params;

    const complaint = await query('SELECT status, customer_id FROM complaints WHERE complaint_id=$1', [complaintId]);
    if (!complaint.rows.length) return res.status(404).json({ message: 'Complaint not found.' });
    if (complaint.rows[0].customer_id !== req.user.user_id) return res.status(403).json({ message: 'Not your complaint.' });
    if (!['Resolved', 'Closed'].includes(complaint.rows[0].status)) return res.status(400).json({ message: 'Can only provide feedback for resolved/closed complaints.' });

    const existing = await query('SELECT feedback_id FROM feedback WHERE complaint_id=$1', [complaintId]);
    if (existing.rows.length) return res.status(409).json({ message: 'Feedback already submitted.' });

    await query(
      'INSERT INTO feedback (feedback_id, complaint_id, customer_id, rating, comments) VALUES ($1,$2,$3,$4,$5)',
      [uuidv4(), complaintId, req.user.user_id, rating, comments || null]
    );
    await query('UPDATE complaints SET status=$1, updated_at=NOW() WHERE complaint_id=$2', ['Closed', complaintId]);
    res.status(201).json({ message: 'Feedback submitted. Thank you!' });
  } catch (err) {
    next(err);
  }
};

exports.getFeedbackAnalytics = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT ROUND(AVG(rating)::numeric,2) as avg_rating,
       COUNT(*) as total_feedback,
       COUNT(CASE WHEN rating >= 4 THEN 1 END) as satisfied,
       COUNT(CASE WHEN rating <= 2 THEN 1 END) as dissatisfied,
       COUNT(CASE WHEN rating = 3 THEN 1 END) as neutral
       FROM feedback`,
      []
    );
    const distribution = await query(
      'SELECT rating, COUNT(*) as count FROM feedback GROUP BY rating ORDER BY rating DESC',
      []
    );
    res.json({ summary: result.rows[0], distribution: distribution.rows });
  } catch (err) {
    next(err);
  }
};
