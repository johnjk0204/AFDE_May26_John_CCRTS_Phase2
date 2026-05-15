const cron = require('node-cron');
const { query } = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const notificationService = require('./notification.service');

const checkSLABreaches = async () => {
  try {
    const breached = await query(
      `SELECT c.complaint_id, c.complaint_number, c.customer_id, c.assigned_agent_id, c.priority
       FROM complaints c
       WHERE c.sla_deadline < NOW()
         AND c.status NOT IN ('Resolved', 'Closed', 'Escalated')
         AND c.sla_notified = false`,
      []
    );

    for (const complaint of breached.rows) {
      await query(
        'UPDATE complaints SET sla_notified=true, is_escalated=true, status=$1, updated_at=NOW() WHERE complaint_id=$2',
        ['Escalated', complaint.complaint_id]
      );
      await query(
        `INSERT INTO complaint_history (history_id, complaint_id, updated_by, old_status, new_status, comment)
         SELECT $1, $2, u.user_id, 'In Progress', 'Escalated', 'Auto-escalated due to SLA breach.'
         FROM users u JOIN roles r ON u.role_id = r.role_id WHERE r.role_name = 'Admin' LIMIT 1`,
        [uuidv4(), complaint.complaint_id]
      );

      await notificationService.notifyAdminsAndSupervisors(
        'SLA Breach Alert',
        `Complaint ${complaint.complaint_number} (${complaint.priority}) has breached its SLA deadline and has been auto-escalated.`,
        complaint.complaint_id
      );

      if (complaint.assigned_agent_id) {
        await notificationService.createNotification(
          complaint.assigned_agent_id,
          'SLA Breach',
          `Complaint ${complaint.complaint_number} has breached its SLA and been escalated.`,
          complaint.complaint_id
        );
      }
      if (complaint.customer_id) {
        await notificationService.createNotification(
          complaint.customer_id,
          'Complaint Escalated',
          `Your complaint ${complaint.complaint_number} has been escalated due to SLA breach. We are working to resolve it urgently.`,
          complaint.complaint_id
        );
      }
    }

    if (breached.rows.length > 0) {
      console.log(`SLA check: ${breached.rows.length} complaint(s) auto-escalated.`);
    }
  } catch (err) {
    console.error('SLA check error:', err.message);
  }
};

exports.startSLACronJob = () => {
  cron.schedule('*/15 * * * *', checkSLABreaches);
  console.log('SLA monitoring cron job started (every 15 minutes).');
};
