const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const userController = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', authorize('Admin'), userController.getAllUsers);
router.get('/agents', authorize('Admin', 'Supervisor'), userController.getAgents);
router.get('/:id', authorize('Admin'), userController.getUserById);

router.post('/', authorize('Admin'), [
  body('name').trim().notEmpty(),
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('role_id').notEmpty(),
], userController.createUser);

router.put('/:id', authorize('Admin'), userController.updateUser);
router.put('/:id/toggle-status', authorize('Admin'), userController.toggleUserStatus);
router.delete('/:id', authorize('Admin'), userController.deleteUser);

module.exports = router;
