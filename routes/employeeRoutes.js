const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');

// Employee routes
router.get('/', employeeController.getAllEmployees);
router.get('/add', employeeController.showAddEmployeeForm);
router.post('/add', employeeController.addEmployee);
router.get('/edit/:id', employeeController.showEditEmployeeForm);
router.post('/edit/:id', employeeController.updateEmployee);

module.exports = router;