const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const feedbackController = require('../controllers/feedback.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', authorize('Admin', 'Supervisor', 'Quality Team'), feedbackController.getAllFeedback);
router.get('/complaint/:complaintId', feedbackController.getFeedbackByComplaint);
router.post('/complaint/:complaintId', authorize('Customer'), [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comments').optional().trim(),
], feedbackController.submitFeedback);
router.get('/analytics', authorize('Admin', 'Supervisor', 'Quality Team'), feedbackController.getFeedbackAnalytics);

module.exports = router;
