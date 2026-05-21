const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/stats', dashboardController.getStats);
router.get('/sla-breaches', authorize('Admin', 'Supervisor'), dashboardController.getSLABreaches);
router.get('/agent-performance', authorize('Admin', 'Supervisor'), dashboardController.getAgentPerformance);
router.get('/category-analysis', dashboardController.getCategoryAnalysis);
router.get('/monthly-trends', dashboardController.getMonthlyTrends);
router.get('/priority-distribution', dashboardController.getPriorityDistribution);
router.get('/resolution-time', authorize('Admin', 'Supervisor'), dashboardController.getResolutionTime);

// ETL analytics routes (data populated by Python ETL pipeline)
router.get('/etl-summary',          authorize('Admin', 'Supervisor', 'Quality Team'), dashboardController.getEtlSummary);
router.get('/etl-agent-performance',authorize('Admin', 'Supervisor', 'Quality Team'), dashboardController.getEtlAgentPerformance);
router.get('/etl-category-trends',  authorize('Admin', 'Supervisor', 'Quality Team'), dashboardController.getEtlCategoryTrends);
router.get('/etl-monthly-trends',   authorize('Admin', 'Supervisor', 'Quality Team'), dashboardController.getEtlMonthlyTrends);
router.get('/etl-priority-analysis',authorize('Admin', 'Supervisor', 'Quality Team'), dashboardController.getEtlPriorityAnalysis);

module.exports = router;
