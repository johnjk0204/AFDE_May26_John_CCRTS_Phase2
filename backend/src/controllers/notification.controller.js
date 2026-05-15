const { query } = require('../config/db');

exports.getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const result = await query(
      'SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [req.user.user_id, limit, offset]
    );
    const count = await query('SELECT COUNT(*) FROM notifications WHERE user_id=$1', [req.user.user_id]);
    res.json({ notifications: result.rows, total: parseInt(count.rows[0].count) });
  } catch (err) {
    next(err);
  }
};

exports.getUnreadCount = async (req, res, next) => {
  try {
    const result = await query('SELECT COUNT(*) FROM notifications WHERE user_id=$1 AND is_read=false', [req.user.user_id]);
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (err) {
    next(err);
  }
};

exports.markAsRead = async (req, res, next) => {
  try {
    await query('UPDATE notifications SET is_read=true WHERE notification_id=$1 AND user_id=$2', [req.params.id, req.user.user_id]);
    res.json({ message: 'Marked as read.' });
  } catch (err) {
    next(err);
  }
};

exports.markAllAsRead = async (req, res, next) => {
  try {
    await query('UPDATE notifications SET is_read=true WHERE user_id=$1', [req.user.user_id]);
    res.json({ message: 'All notifications marked as read.' });
  } catch (err) {
    next(err);
  }
};

exports.deleteNotification = async (req, res, next) => {
  try {
    await query('DELETE FROM notifications WHERE notification_id=$1 AND user_id=$2', [req.params.id, req.user.user_id]);
    res.json({ message: 'Notification deleted.' });
  } catch (err) {
    next(err);
  }
};
