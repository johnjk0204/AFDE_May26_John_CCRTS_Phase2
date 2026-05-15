const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const complaintController = require('../controllers/complaint.controller');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(authenticate);

router.get('/', complaintController.getComplaints);
router.get('/my', complaintController.getMyComplaints);
router.get('/:id', complaintController.getComplaintById);
router.get('/:id/history', complaintController.getComplaintHistory);

router.post('/', upload.array('attachments', 5), [
  body('category_id').notEmpty().withMessage('Category is required'),
  body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('priority').isIn(['Low', 'Medium', 'High', 'Critical']).withMessage('Invalid priority'),
], complaintController.createComplaint);

router.put('/:id/assign', authorize('Admin', 'Supervisor'), [
  body('agent_id').notEmpty(),
], complaintController.assignComplaint);

router.put('/:id/status', [
  body('status').isIn(['Open', 'Assigned', 'In Progress', 'Pending Customer Response', 'Escalated', 'Resolved', 'Closed']),
], complaintController.updateStatus);

router.put('/:id/resolve', authorize('Admin', 'Support Agent', 'Supervisor'), [
  body('resolution_notes').trim().notEmpty().withMessage('Resolution notes required'),
], complaintController.resolveComplaint);

router.put('/:id/escalate', authorize('Admin', 'Supervisor', 'Support Agent'), complaintController.escalateComplaint);
router.put('/:id/reopen', complaintController.reopenComplaint);
router.put('/:id/close', complaintController.closeComplaint);

router.post('/:id/comments', [
  body('comment').trim().notEmpty(),
], complaintController.addComment);

module.exports = router;
