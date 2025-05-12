const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

// Report routes
router.get('/', reportController.showReportsDashboard);
router.get('/asset-utilization', reportController.getAssetUtilizationReport);
router.get('/employee-assets', reportController.getEmployeeAssetsReport);
router.get('/asset-value', reportController.getAssetValueReport);

module.exports = router;