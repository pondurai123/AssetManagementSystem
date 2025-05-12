// ----- ROUTES/CATEGORYROUTES.JS -----
const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

// Category routes
router.get('/', categoryController.getAllCategories);
router.get('/add', categoryController.showAddCategoryForm);
router.post('/add', categoryController.addCategory);
router.get('/edit/:id', categoryController.showEditCategoryForm);
router.post('/edit/:id', categoryController.updateCategory);

module.exports = router;