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

module.exports = router;
