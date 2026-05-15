const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/db');

exports.createNotification = async (userId, title, message, complaintId = null) => {
  try {
    await query(
      'INSERT INTO notifications (notification_id, user_id, title, message, complaint_id) VALUES ($1,$2,$3,$4,$5)',
      [uuidv4(), userId, title, message, complaintId]
    );
  } catch (err) {
    console.error('Notification creation error:', err.message);
  }
};

exports.notifyAdminsAndSupervisors = async (title, message, complaintId = null) => {
  try {
    const result = await query(
      `SELECT u.user_id FROM users u JOIN roles r ON u.role_id = r.role_id
       WHERE r.role_name IN ('Admin', 'Supervisor') AND u.is_active = true`,
      []
    );
    for (const row of result.rows) {
      await exports.createNotification(row.user_id, title, message, complaintId);
    }
  } catch (err) {
    console.error('Bulk notification error:', err.message);
  }
};
