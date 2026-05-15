const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const categoryController = require('../controllers/category.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', categoryController.getCategories);
router.get('/:id', categoryController.getCategoryById);
router.post('/', authorize('Admin'), [body('category_name').trim().notEmpty()], categoryController.createCategory);
router.put('/:id', authorize('Admin'), categoryController.updateCategory);
router.delete('/:id', authorize('Admin'), categoryController.deleteCategory);

module.exports = router;
