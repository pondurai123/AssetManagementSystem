// ----- ROUTES/ASSETROUTES.JS -----
const express = require('express');
const router = express.Router();
const assetController = require('../controllers/assetController');

// Asset routes
router.get('/', assetController.getAllAssets);
router.get('/stock', assetController.getStockView);
router.get('/add', assetController.showAddAssetForm);
router.post('/add', assetController.addAsset);
router.get('/edit/:id', assetController.showEditAssetForm);
router.post('/edit/:id', assetController.updateAsset);
router.get('/issue', assetController.showIssueAssetForm);
router.post('/issue', assetController.issueAsset);
router.get('/return', assetController.showReturnAssetForm);
router.post('/return', assetController.returnAsset);
router.get('/scrap', assetController.showScrapAssetForm);
router.post('/scrap', assetController.scrapAsset);
router.get('/history/:id', assetController.getAssetHistory);

module.exports = router;