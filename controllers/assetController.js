  // ----- CONTROLLERS/ASSETCONTROLLER.JS -----
  const { Asset, AssetCategory, Employee, AssetHistory, sequelize } = require('../models');
  const { Op } = require('sequelize');
  
  // Get all assets with filtering
exports.getAllAssets = async (req, res) => {
  try {
    const { category, search, status } = req.query;
    
    let whereClause = {};
    
    // Filter by category
    if (category) {
      whereClause.categoryId = category;
    }
    
    // Filter by status
    if (status) {
      whereClause.status = status;
    }

    // Search functionality
    if (search) {
      whereClause[Op.or] = [
        { make: { [Op.iLike]: `%${search}%` } },
        { model: { [Op.iLike]: `%${search}%` } },
        { serialNumber: { [Op.iLike]: `%${search}%` } },
        { uniqueId: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    const assets = await Asset.findAll({
      where: whereClause,
      include: [{ model: AssetCategory }],
      order: [['createdAt', 'DESC']]
    });
    
    const categories = await AssetCategory.findAll({
      order: [['name', 'ASC']]
    });
    
    res.render('assets/index', {
      title: 'Asset Management',
      assets,
      categories,
      filters: {
        category,
        search,
        status
      }
    });
    
  } catch (error) {
    console.error('Error getting assets:', error);
    res.status(500).render('error', { message: 'Error fetching assets' });
  }
};
  
      // Asset history view
  exports.getAssetHistory = async (req, res) => {
      try {
        const assetId = req.params.id;
        
        // Get asset details
        const asset = await Asset.findByPk(assetId, {
          include: [{ model: AssetCategory }]
        });
        
        if (!asset) {
          return res.status(404).render('error', { message: 'Asset not found' });
        }
        
        // Get asset history
        const history = await AssetHistory.findAll({
          where: { assetId },
          include: [{ model: Employee }],
          order: [['actionDate', 'DESC']]
        });
  
        res.render('assets/history', {
          title: 'Asset History',
          asset,
          history
        });
      } catch (error) {
        console.error('Error fetching asset history:', error);
        res.status(500).render('error', { message: 'Error fetching asset history' });
      }
    };
    // Stock view
    exports.getStockView = async (req, res) => {
      try {
        // Get assets in stock (available) grouped by branch and category
        const stockByBranch = await Asset.findAll({
          where: { status: 'available' },
          include: [{ model: AssetCategory }],
          attributes: [
            'branch',
            [sequelize.fn('COUNT', sequelize.col('Asset.id')), 'count'],
            [sequelize.fn('SUM', sequelize.col('purchasePrice')), 'totalValue']
          ],
          group: ['branch', 'AssetCategory.id', 'AssetCategory.name'],
          raw: true,
          nest: true
        });
        
        // Process the data for rendering
        const branches = {};
        let totalCount = 0;
        let totalValue = 0;
        stockByBranch.forEach(item => {
          if (!branches[item.branch]) {
            branches[item.branch] = {
              categories: [],
              totalCount: 0,
              totalValue: 0
            };
          }
          
          branches[item.branch].categories.push({
            name: item.AssetCategory.name,
            count: parseInt(item.count),
            value: parseFloat(item.totalValue)
          });
          
          branches[item.branch].totalCount += parseInt(item.count);
          branches[item.branch].totalValue += parseFloat(item.totalValue);
          
          totalCount += parseInt(item.count);
          totalValue += parseFloat(item.totalValue);
        });
        
        res.render('assets/stock', {
          title: 'Stock View',
          branches,
          totalCount,
          totalValue
        });
      } catch (error) {
             console.error('Error fetching stock view:', error);
          res.status(500).render('error', { message: 'Error fetching stock view' });
        }
      }; 
      
      exports.showAddAssetForm = async (req, res) => {
          try {
            const categories = await AssetCategory.findAll({
              order: [['name', 'ASC']]
            });
            
            res.render('assets/add', {
              title: 'Add New Asset',
              categories
            });
          } catch (error) {
            console.error('Error loading add asset form:', error);
            res.status(500).render('error', { message: 'Error loading form' });
          }
        };
  
        exports.addAsset = async (req, res) => {
          const transaction = await sequelize.transaction();
          
          try {
            const {
              uniqueId,
              serialNumber,
              make,
              model,
              categoryId,
              purchaseDate,
              purchasePrice,
              branch,
              notes
            } = req.body;
            
            // Create asset
            const asset = await Asset.create({
              uniqueId,
              serialNumber,
              make,
              model,
              categoryId,
              purchaseDate,
              purchasePrice,
              status: 'available',
              branch,
              notes
            }, { transaction });
  
               // Create initial asset history entry
      await AssetHistory.create({
          assetId: asset.id,
          actionType: 'purchase',
          actionDate: purchaseDate,
          notes: `Asset purchased at ${purchasePrice}`
        }, { transaction });
        
        await transaction.commit();
        res.redirect('/assets');
      } catch (error) {
        await transaction.rollback();
        console.error('Error adding asset:', error);
        res.status(500).render('error', { message: 'Error adding asset' });
      }
    };
  
    // Show form to edit asset
  exports.showEditAssetForm = async (req, res) => {
      try {
        const asset = await Asset.findByPk(req.params.id);
        
        if (!asset) {
          return res.status(404).render('error', { message: 'Asset not found' });
        }
        
        const categories = await AssetCategory.findAll({
          order: [['name', 'ASC']]
        });
        
        res.render('assets/edit', {
          title: 'Edit Asset',
          asset,
          categories
        });
      } catch (error) {
        console.error('Error loading edit form:', error);
        res.status(500).render('error', { message: 'Error loading form' });
      }
    };
  
    exports.updateAsset = async (req, res) => {
      try {
        const {
          uniqueId,
          serialNumber,
          make,
          model,
          categoryId,
          purchaseDate,
          purchasePrice,
          branch,
          notes
        } = req.body;
        
        const asset = await Asset.findByPk(req.params.id);
        
        if (!asset) {
          return res.status(404).render('error', { message: 'Asset not found' });
        }
  
            
      await asset.update({
          uniqueId,
          serialNumber,
          make,
          model,
          categoryId,
          purchaseDate,
          purchasePrice,
          branch,
          notes
        });
        
        res.redirect('/assets');
      } catch (error) {
        console.error('Error updating asset:', error);
        res.status(500).render('error', { message: 'Error updating asset' });
      }
    };
  
  
  // Show form to issue asset
  exports.showIssueAssetForm = async (req, res) => {
      try {
        // Get available assets
        const assets = await Asset.findAll({
          where: { status: 'available' },
          include: [{ model: AssetCategory }],
          order: [['uniqueId', 'ASC']]
        });
        
        // Get active employees
        const employees = await Employee.findAll({
          where: { isActive: true },
          order: [['lastName', 'ASC'], ['firstName', 'ASC']]
        });
        
        res.render('assets/issue', {
          title: 'Issue Asset',
          assets,
          employees
        });
      } catch (error) {
        console.error('Error loading issue asset form:', error);
        res.status(500).render('error', { message: 'Error loading form' });
      }
    };
  
    exports.issueAsset = async (req, res) => {
      const transaction = await sequelize.transaction();
      
      try {
        const { assetId, employeeId, issueDate, notes } = req.body;
        
        // Update asset status
        const asset = await Asset.findByPk(assetId);
        
        if (!asset) {
          await transaction.rollback();
          return res.status(404).render('error', { message: 'Asset not found' });
        }
        
        if (asset.status !== 'available') {
          await transaction.rollback();
          return res.status(400).render('error', { message: 'Asset is not available for issue' });
        }
        
        await asset.update({ status: 'assigned' }, { transaction });
        
        // Create asset history entry
        await AssetHistory.create({
          assetId,
          employeeId,
          actionType: 'issue',
          actionDate: issueDate,
          notes
        }, { transaction });
  
        await transaction.commit();
        res.redirect('/assets');
      } catch (error) {
        await transaction.rollback();
        console.error('Error issuing asset:', error);
        res.status(500).render('error', { message: 'Error issuing asset' });
      }
    };
  
    exports.showReturnAssetForm = async (req, res) => {
      try {
        // Get issued assets with their assigned employees
        const issuedAssets = await Asset.findAll({
          where: { status: 'assigned' },
          include: [
            { model: AssetCategory },
            {
              model: AssetHistory,
              limit: 1,
              order: [['actionDate', 'DESC']],
              where: { actionType: 'issue' },
              include: [{ model: Employee }]
            }
          ],
          order: [['uniqueId', 'ASC']]
        });
        
        res.render('assets/return', {
          title: 'Return Asset',
          assets: issuedAssets
        });
      } catch (error) {
        console.error('Error loading return asset form:', error);
        res.status(500).render('error', { message: 'Error loading form' });
      }
    };
  
    exports.returnAsset = async (req, res) => {
      const transaction = await sequelize.transaction();
      
      try {
        const { assetId, returnDate, reason, notes } = req.body;
        
        // Update asset status
        const asset = await Asset.findByPk(assetId);
        
        if (!asset) {
          await transaction.rollback();
          return res.status(404).render('error', { message: 'Asset not found' });
        }
        
        if (asset.status !== 'assigned') {
          await transaction.rollback();
          return res.status(400).render('error', { message: 'Asset is not currently assigned' });
        }
        
        // Get the latest asset history to identify the current employee
        const latestHistory = await AssetHistory.findOne({
          where: { assetId, actionType: 'issue' },
          order: [['actionDate', 'DESC']]
        });
  
        if (!latestHistory) {
          await transaction.rollback();
          return res.status(404).render('error', { message: 'Asset issue history not found' });
        }
        
        // Update asset status based on reason
        let newStatus = 'available';
        if (reason === 'repair') {
          newStatus = 'repair';
        }
        
        await asset.update({ status: newStatus }, { transaction });
        
        // Create asset history entry
        await AssetHistory.create({
          assetId,
          employeeId: latestHistory.employeeId,
          actionType: 'return',
          actionDate: returnDate,
          reason,
          notes
        }, { transaction });
        
        await transaction.commit();
        res.redirect('/assets');
      } catch (error) {
          await transaction.rollback();
          console.error('Error returning asset:', error);
          res.status(500).render('error', { message: 'Error returning asset' });
        }
      };
  
      exports.showScrapAssetForm = async (req, res) => {
          try {
            // Get available and repair assets
            const scrappableAssets = await Asset.findAll({
              where: {
                status: {
                  [Op.in]: ['available', 'repair']
                }
              },
              include: [{ model: AssetCategory }],
              order: [['uniqueId', 'ASC']]
            });
            
            res.render('assets/scrap', {
              title: 'Scrap Asset',
              assets: scrappableAssets
            });
          } catch (error) {
            console.error('Error loading scrap asset form:', error);
            res.status(500).render('error', { message: 'Error loading form' });
          }
      };
  
      exports.scrapAsset = async (req, res) => {
        const transaction = await sequelize.transaction();
        
        try {
          const { assetId, scrapDate, reason, notes } = req.body;
          
          // Update asset status
          const asset = await Asset.findByPk(assetId);
          
          if (!asset) {
            await transaction.rollback();
            return res.status(404).render('error', { message: 'Asset not found' });
          }
          
          if (asset.status === 'assigned') {
            await transaction.rollback();
            return res.status(400).render('error', { message: 'Asset is currently assigned and must be returned first' });
          }
          
          if (asset.status === 'scrapped') {
            await transaction.rollback();
            return res.status(400).render('error', { message: 'Asset is already scrapped' });
          }
          
          await asset.update({ status: 'scrapped' }, { transaction });

             // Create asset history entry
    await AssetHistory.create({
        assetId,
        actionType: 'scrap',
        actionDate: scrapDate,
        reason,
        notes
      }, { transaction });
      
      await transaction.commit();
      res.redirect('/assets');
    } catch (error) {
      await transaction.rollback();
      console.error('Error scrapping asset:', error);
      res.status(500).render('error', { message: 'Error scrapping asset' });
    }
  };
 