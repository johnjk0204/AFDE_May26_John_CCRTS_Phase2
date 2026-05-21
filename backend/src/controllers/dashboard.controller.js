const { query } = require('../config/db');

exports.getStats = async (req, res, next) => {
  try {
    const role = req.user.role_name;
    const userId = req.user.user_id;
    let baseFilter = '';
    const params = [];
    if (role === 'Customer') { params.push(userId); baseFilter = `WHERE c.customer_id = $1`; }
    else if (role === 'Support Agent') { params.push(userId); baseFilter = `WHERE c.assigned_agent_id = $1`; }

    const total = await query(`SELECT COUNT(*) FROM complaints c ${baseFilter}`, params);
    const open = await query(`SELECT COUNT(*) FROM complaints c ${baseFilter} ${baseFilter ? 'AND' : 'WHERE'} c.status = 'Open'`, params);
    const inProgress = await query(`SELECT COUNT(*) FROM complaints c ${baseFilter} ${baseFilter ? 'AND' : 'WHERE'} c.status = 'In Progress'`, params);
    const resolved = await query(`SELECT COUNT(*) FROM complaints c ${baseFilter} ${baseFilter ? 'AND' : 'WHERE'} c.status = 'Resolved'`, params);
    const closed = await query(`SELECT COUNT(*) FROM complaints c ${baseFilter} ${baseFilter ? 'AND' : 'WHERE'} c.status = 'Closed'`, params);
    const escalated = await query(`SELECT COUNT(*) FROM complaints c ${baseFilter} ${baseFilter ? 'AND' : 'WHERE'} c.status = 'Escalated'`, params);
    const slaBreached = await query(
      `SELECT COUNT(*) FROM complaints c ${baseFilter} ${baseFilter ? 'AND' : 'WHERE'} c.sla_deadline < NOW() AND c.status NOT IN ('Resolved','Closed')`,
      params
    );
    const avgResolution = await query(
      `SELECT ROUND(AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/3600)::numeric, 2) as avg_hours
       FROM complaints c ${baseFilter} ${baseFilter ? 'AND' : 'WHERE'} resolved_at IS NOT NULL`,
      params
    );

    res.json({
      total: parseInt(total.rows[0].count),
      open: parseInt(open.rows[0].count),
      inProgress: parseInt(inProgress.rows[0].count),
      resolved: parseInt(resolved.rows[0].count),
      closed: parseInt(closed.rows[0].count),
      escalated: parseInt(escalated.rows[0].count),
      slaBreached: parseInt(slaBreached.rows[0].count),
      avgResolutionHours: parseFloat(avgResolution.rows[0].avg_hours) || 0,
    });
  } catch (err) {
    next(err);
  }
};

exports.getSLABreaches = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT c.complaint_number, c.priority, c.status, c.sla_deadline, c.created_at,
       u.name as customer_name, a.name as agent_name, cat.category_name
       FROM complaints c
       JOIN users u ON c.customer_id = u.user_id
       LEFT JOIN users a ON c.assigned_agent_id = a.user_id
       JOIN categories cat ON c.category_id = cat.category_id
       WHERE c.sla_deadline < NOW() AND c.status NOT IN ('Resolved','Closed')
       ORDER BY c.sla_deadline ASC LIMIT 50`,
      []
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

exports.getAgentPerformance = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT a.user_id, a.name as agent_name,
       COUNT(c.complaint_id) as total_assigned,
       COUNT(CASE WHEN c.status = 'Resolved' OR c.status = 'Closed' THEN 1 END) as resolved,
       COUNT(CASE WHEN c.status NOT IN ('Resolved','Closed') AND c.sla_deadline < NOW() THEN 1 END) as sla_breached,
       ROUND(AVG(CASE WHEN c.resolved_at IS NOT NULL THEN EXTRACT(EPOCH FROM (c.resolved_at - c.created_at))/3600 END)::numeric,2) as avg_resolution_hours
       FROM users a
       JOIN roles r ON a.role_id = r.role_id
       LEFT JOIN complaints c ON a.user_id = c.assigned_agent_id
       WHERE r.role_name = 'Support Agent'
       GROUP BY a.user_id, a.name
       ORDER BY resolved DESC`,
      []
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

exports.getCategoryAnalysis = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT cat.category_name,
       COUNT(c.complaint_id) as total,
       COUNT(CASE WHEN c.status IN ('Resolved','Closed') THEN 1 END) as resolved,
       COUNT(CASE WHEN c.status NOT IN ('Resolved','Closed') THEN 1 END) as open
       FROM categories cat
       LEFT JOIN complaints c ON cat.category_id = c.category_id
       WHERE cat.is_active = true
       GROUP BY cat.category_id, cat.category_name
       ORDER BY total DESC`,
      []
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

exports.getMonthlyTrends = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT TO_CHAR(created_at, 'YYYY-MM') as month,
       COUNT(*) as total,
       COUNT(CASE WHEN status IN ('Resolved','Closed') THEN 1 END) as resolved
       FROM complaints
       WHERE created_at >= NOW() - INTERVAL '12 months'
       GROUP BY TO_CHAR(created_at, 'YYYY-MM')
       ORDER BY month ASC`,
      []
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

exports.getPriorityDistribution = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT priority, COUNT(*) as count FROM complaints GROUP BY priority ORDER BY
       CASE priority WHEN 'Critical' THEN 1 WHEN 'High' THEN 2 WHEN 'Medium' THEN 3 WHEN 'Low' THEN 4 END`,
      []
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

exports.getResolutionTime = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT priority,
       ROUND(AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/3600)::numeric, 2) as avg_hours,
       COUNT(*) as count
       FROM complaints
       WHERE resolved_at IS NOT NULL
       GROUP BY priority`,
      []
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

// ── ETL Analytics endpoints (read from Python ETL output tables) ──────────────

exports.getEtlSummary = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT * FROM etl_complaint_summary ORDER BY etl_run_at DESC LIMIT 1`,
      []
    );
    res.json(result.rows[0] || null);
  } catch (err) {
    next(err);
  }
};

exports.getEtlAgentPerformance = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT * FROM etl_agent_performance ORDER BY total_resolved DESC`,
      []
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

exports.getEtlCategoryTrends = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT * FROM etl_category_trends ORDER BY total_complaints DESC`,
      []
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

exports.getEtlMonthlyTrends = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT * FROM etl_monthly_trends ORDER BY report_month ASC`,
      []
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

exports.getEtlPriorityAnalysis = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT * FROM etl_priority_analysis
       ORDER BY CASE priority WHEN 'Critical' THEN 1 WHEN 'High' THEN 2 WHEN 'Medium' THEN 3 WHEN 'Low' THEN 4 END`,
      []
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};
