const { v4: uuidv4 } = require('uuid');
const { validationResult } = require('express-validator');
const { query, getClient } = require('../config/db');
const notificationService = require('../services/notification.service');

const generateComplaintNumber = () => {
  const prefix = 'CMP';
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${date}-${rand}`;
};

const getSLADeadline = (priority) => {
  const hours = { Low: 72, Medium: 48, High: 24, Critical: 4 };
  const deadline = new Date();
  deadline.setHours(deadline.getHours() + (hours[priority] || 48));
  return deadline;
};

exports.getComplaints = async (req, res, next) => {
  try {
    const { status, priority, category_id, agent_id, search, page = 1, limit = 20, sort = 'created_at', order = 'DESC' } = req.query;
    const offset = (page - 1) * limit;
    const role = req.user.role_name;

    let sql = `SELECT c.*, cat.category_name, u.name as customer_name, u.email as customer_email,
               a.name as agent_name, c.sla_deadline
               FROM complaints c
               JOIN categories cat ON c.category_id = cat.category_id
               JOIN users u ON c.customer_id = u.user_id
               LEFT JOIN users a ON c.assigned_agent_id = a.user_id
               WHERE 1=1`;
    const params = [];

    if (role === 'Support Agent') {
      params.push(req.user.user_id);
      sql += ` AND c.assigned_agent_id = $${params.length}`;
    }
    if (status) { params.push(status); sql += ` AND c.status = $${params.length}`; }
    if (priority) { params.push(priority); sql += ` AND c.priority = $${params.length}`; }
    if (category_id) { params.push(category_id); sql += ` AND c.category_id = $${params.length}`; }
    if (agent_id) { params.push(agent_id); sql += ` AND c.assigned_agent_id = $${params.length}`; }
    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (c.complaint_number ILIKE $${params.length} OR c.description ILIKE $${params.length} OR u.name ILIKE $${params.length})`;
    }

    const countSql = sql.replace(/SELECT c\.\*.*?FROM/, 'SELECT COUNT(*) FROM');
    const countResult = await query(countSql, params);

    const allowedSorts = ['created_at', 'priority', 'status', 'sla_deadline'];
    const safeSortCol = allowedSorts.includes(sort) ? `c.${sort}` : 'c.created_at';
    sql += ` ORDER BY ${safeSortCol} ${order === 'ASC' ? 'ASC' : 'DESC'} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await query(sql, params);
    res.json({ complaints: result.rows, total: parseInt(countResult.rows[0].count), page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    next(err);
  }
};

exports.getMyComplaints = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    const params = [req.user.user_id];
    let sql = `SELECT c.*, cat.category_name, a.name as agent_name
               FROM complaints c JOIN categories cat ON c.category_id = cat.category_id
               LEFT JOIN users a ON c.assigned_agent_id = a.user_id
               WHERE c.customer_id = $1`;
    if (status) { params.push(status); sql += ` AND c.status = $${params.length}`; }
    sql += ` ORDER BY c.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    const result = await query(sql, params);
    const countResult = await query('SELECT COUNT(*) FROM complaints WHERE customer_id = $1', [req.user.user_id]);
    res.json({ complaints: result.rows, total: parseInt(countResult.rows[0].count) });
  } catch (err) {
    next(err);
  }
};

exports.getComplaintById = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT c.*, cat.category_name, u.name as customer_name, u.email as customer_email,
       u.phone as customer_phone, a.name as agent_name, a.email as agent_email
       FROM complaints c JOIN categories cat ON c.category_id = cat.category_id
       JOIN users u ON c.customer_id = u.user_id
       LEFT JOIN users a ON c.assigned_agent_id = a.user_id
       WHERE c.complaint_id = $1`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Complaint not found.' });

    const attachments = await query('SELECT * FROM attachments WHERE complaint_id = $1', [req.params.id]);
    const comments = await query(
      `SELECT ch.*, u.name as updated_by_name FROM complaint_history ch
       JOIN users u ON ch.updated_by = u.user_id WHERE ch.complaint_id = $1 ORDER BY ch.updated_date DESC`,
      [req.params.id]
    );

    res.json({ ...result.rows[0], attachments: attachments.rows, history: comments.rows });
  } catch (err) {
    next(err);
  }
};

exports.getComplaintHistory = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT ch.*, u.name as updated_by_name FROM complaint_history ch
       JOIN users u ON ch.updated_by = u.user_id
       WHERE ch.complaint_id = $1 ORDER BY ch.updated_date DESC`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

exports.createComplaint = async (req, res, next) => {
  const client = await getClient();
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    await client.query('BEGIN');
    const { category_id, description, priority, subject } = req.body;
    const complaintId = uuidv4();
    const complaintNumber = generateComplaintNumber();
    const slaDeadline = getSLADeadline(priority);

    await client.query(
      `INSERT INTO complaints (complaint_id, complaint_number, customer_id, category_id, description, priority, subject, sla_deadline)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [complaintId, complaintNumber, req.user.user_id, category_id, description, priority, subject || description.substring(0, 100), slaDeadline]
    );

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        await client.query(
          'INSERT INTO attachments (attachment_id, complaint_id, file_name, file_path, file_size, file_type) VALUES ($1,$2,$3,$4,$5,$6)',
          [uuidv4(), complaintId, file.originalname, file.filename, file.size, file.mimetype]
        );
      }
    }

    await client.query(
      `INSERT INTO complaint_history (history_id, complaint_id, updated_by, old_status, new_status, comment)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [uuidv4(), complaintId, req.user.user_id, null, 'Open', 'Complaint registered.']
    );

    await client.query('COMMIT');
    await notificationService.createNotification(req.user.user_id, 'Complaint Registered', `Your complaint ${complaintNumber} has been registered.`, complaintId);
    res.status(201).json({ message: 'Complaint registered successfully.', complaintId, complaintNumber });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

exports.assignComplaint = async (req, res, next) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const { agent_id, notes } = req.body;
    const oldResult = await client.query('SELECT status, assigned_agent_id FROM complaints WHERE complaint_id = $1', [req.params.id]);
    if (!oldResult.rows.length) return res.status(404).json({ message: 'Complaint not found.' });

    const oldStatus = oldResult.rows[0].status;
    await client.query(
      'UPDATE complaints SET assigned_agent_id=$1, status=$2, updated_at=NOW() WHERE complaint_id=$3',
      [agent_id, 'Assigned', req.params.id]
    );
    await client.query(
      'INSERT INTO complaint_history (history_id, complaint_id, updated_by, old_status, new_status, comment) VALUES ($1,$2,$3,$4,$5,$6)',
      [uuidv4(), req.params.id, req.user.user_id, oldStatus, 'Assigned', notes || 'Complaint assigned to agent.']
    );
    await client.query('COMMIT');
    await notificationService.createNotification(agent_id, 'Complaint Assigned', `A new complaint has been assigned to you.`, req.params.id);
    res.json({ message: 'Complaint assigned successfully.' });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

exports.updateStatus = async (req, res, next) => {
  const client = await getClient();
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    await client.query('BEGIN');
    const { status, comment } = req.body;
    const oldResult = await client.query('SELECT status, customer_id FROM complaints WHERE complaint_id = $1', [req.params.id]);
    if (!oldResult.rows.length) return res.status(404).json({ message: 'Complaint not found.' });

    const oldStatus = oldResult.rows[0].status;
    await client.query('UPDATE complaints SET status=$1, updated_at=NOW() WHERE complaint_id=$2', [status, req.params.id]);
    await client.query(
      'INSERT INTO complaint_history (history_id, complaint_id, updated_by, old_status, new_status, comment) VALUES ($1,$2,$3,$4,$5,$6)',
      [uuidv4(), req.params.id, req.user.user_id, oldStatus, status, comment || `Status updated to ${status}.`]
    );
    await client.query('COMMIT');
    await notificationService.createNotification(oldResult.rows[0].customer_id, 'Complaint Update', `Your complaint status has been updated to: ${status}.`, req.params.id);
    res.json({ message: 'Status updated.' });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

exports.resolveComplaint = async (req, res, next) => {
  const client = await getClient();
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    await client.query('BEGIN');
    const { resolution_notes } = req.body;
    const oldResult = await client.query('SELECT status, customer_id, complaint_number FROM complaints WHERE complaint_id=$1', [req.params.id]);
    if (!oldResult.rows.length) return res.status(404).json({ message: 'Complaint not found.' });

    const { status: oldStatus, customer_id, complaint_number } = oldResult.rows[0];
    await client.query(
      'UPDATE complaints SET status=$1, resolution_notes=$2, resolved_at=NOW(), updated_at=NOW() WHERE complaint_id=$3',
      ['Resolved', resolution_notes, req.params.id]
    );
    await client.query(
      'INSERT INTO complaint_history (history_id, complaint_id, updated_by, old_status, new_status, comment) VALUES ($1,$2,$3,$4,$5,$6)',
      [uuidv4(), req.params.id, req.user.user_id, oldStatus, 'Resolved', resolution_notes]
    );
    await client.query('COMMIT');
    await notificationService.createNotification(customer_id, 'Complaint Resolved', `Your complaint ${complaint_number} has been resolved. Please provide feedback.`, req.params.id);
    res.json({ message: 'Complaint resolved.' });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

exports.escalateComplaint = async (req, res, next) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const { reason } = req.body;
    const oldResult = await client.query('SELECT status, customer_id FROM complaints WHERE complaint_id=$1', [req.params.id]);
    if (!oldResult.rows.length) return res.status(404).json({ message: 'Complaint not found.' });

    await client.query('UPDATE complaints SET status=$1, is_escalated=true, updated_at=NOW() WHERE complaint_id=$2', ['Escalated', req.params.id]);
    await client.query(
      'INSERT INTO complaint_history (history_id, complaint_id, updated_by, old_status, new_status, comment) VALUES ($1,$2,$3,$4,$5,$6)',
      [uuidv4(), req.params.id, req.user.user_id, oldResult.rows[0].status, 'Escalated', reason || 'Complaint escalated.']
    );
    await client.query('COMMIT');
    res.json({ message: 'Complaint escalated.' });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

exports.reopenComplaint = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const oldResult = await query('SELECT status FROM complaints WHERE complaint_id=$1', [req.params.id]);
    if (!oldResult.rows.length) return res.status(404).json({ message: 'Complaint not found.' });

    await query('UPDATE complaints SET status=$1, resolved_at=NULL, updated_at=NOW() WHERE complaint_id=$2', ['In Progress', req.params.id]);
    await query(
      'INSERT INTO complaint_history (history_id, complaint_id, updated_by, old_status, new_status, comment) VALUES ($1,$2,$3,$4,$5,$6)',
      [uuidv4(), req.params.id, req.user.user_id, oldResult.rows[0].status, 'In Progress', reason || 'Complaint reopened.']
    );
    res.json({ message: 'Complaint reopened.' });
  } catch (err) {
    next(err);
  }
};

exports.closeComplaint = async (req, res, next) => {
  try {
    const oldResult = await query('SELECT status, customer_id FROM complaints WHERE complaint_id=$1', [req.params.id]);
    if (!oldResult.rows.length) return res.status(404).json({ message: 'Complaint not found.' });

    await query('UPDATE complaints SET status=$1, closed_at=NOW(), updated_at=NOW() WHERE complaint_id=$2', ['Closed', req.params.id]);
    await query(
      'INSERT INTO complaint_history (history_id, complaint_id, updated_by, old_status, new_status, comment) VALUES ($1,$2,$3,$4,$5,$6)',
      [uuidv4(), req.params.id, req.user.user_id, oldResult.rows[0].status, 'Closed', 'Complaint closed.']
    );
    res.json({ message: 'Complaint closed.' });
  } catch (err) {
    next(err);
  }
};

exports.addComment = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { comment } = req.body;
    const oldResult = await query('SELECT status FROM complaints WHERE complaint_id=$1', [req.params.id]);
    if (!oldResult.rows.length) return res.status(404).json({ message: 'Complaint not found.' });

    await query(
      'INSERT INTO complaint_history (history_id, complaint_id, updated_by, old_status, new_status, comment) VALUES ($1,$2,$3,$4,$5,$6)',
      [uuidv4(), req.params.id, req.user.user_id, oldResult.rows[0].status, oldResult.rows[0].status, comment]
    );
    res.status(201).json({ message: 'Comment added.' });
  } catch (err) {
    next(err);
  }
};
