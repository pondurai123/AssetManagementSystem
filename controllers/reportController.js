const { Asset, AssetCategory, Employee, AssetHistory, sequelize } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');

// Show reports dashboard
exports.showReportsDashboard = (req, res) => {
  res.render('reports/index', {
    title: 'Reports Dashboard'
  });
};

exports.getAssetUtilizationReport = async (req, res) => {
  try {
    const { categoryId, startDate, endDate } = req.query;
    
    // Set default dates if not provided
    const effectiveStartDate = startDate ? new Date(startDate) : moment().subtract(30, 'days').toDate();
    const effectiveEndDate = endDate ? new Date(endDate) : new Date();
    
    let whereClause = {};
    
    // Filter by category
    if (categoryId) {
      whereClause.categoryId = categoryId;
    }
    
    // Get all assets
    const assets = await Asset.findAll({
      where: whereClause,
      include: [
        { model: AssetCategory }
      ],
      order: [['uniqueId', 'ASC']]
    });
    
    // For each asset, calculate utilization
    const processedAssets = [];
    let totalUtilizationDays = 0;
    let totalTransactions = 0;
    
    for (const asset of assets) {
      // Get all history records for this asset
      let historyWhereClause = {
        assetId: asset.id
      };

      if (startDate && endDate) {
        historyWhereClause.actionDate = {
          [Op.between]: [new Date(effectiveStartDate), new Date(effectiveEndDate)]
        };
      }
      
      const history = await AssetHistory.findAll({
        where: historyWhereClause,
        order: [['actionDate', 'ASC']]
      });
      
      // Calculate utilization time
      let totalDays = 0;
      let utilizationDays = 0;
      let currentlyAssigned = false;
      let lastIssueDate = null;
      let assignmentCount = 0;

      for (const record of history) {
        if (record.actionType === 'issue') {
          lastIssueDate = new Date(record.actionDate);
          currentlyAssigned = true;
          assignmentCount++;
        } else if (record.actionType === 'return' && lastIssueDate) {
          const returnDate = new Date(record.actionDate);
          const daysDiff = Math.ceil((returnDate - lastIssueDate) / (1000 * 60 * 60 * 24));
          utilizationDays += daysDiff;
          lastIssueDate = null;
          currentlyAssigned = false;
        }
      }
      
      // If asset is still assigned, calculate days until today
      if (currentlyAssigned && lastIssueDate) {
        const today = new Date();
        const daysDiff = Math.ceil((today - lastIssueDate) / (1000 * 60 * 60 * 24));
        utilizationDays += daysDiff;
      }
      
      // Calculate total days in period
      totalDays = moment(effectiveEndDate).diff(moment(effectiveStartDate), 'days');
      if (totalDays <= 0) totalDays = 1;  // Avoid division by zero
      
      // Calculate utilization percentage
      const utilizationRate = Math.round((utilizationDays / totalDays) * 100);
      
      totalUtilizationDays += utilizationDays;
      totalTransactions += assignmentCount;
      
      processedAssets.push({
        uniqueId: asset.uniqueId,
        category: asset.AssetCategory ? asset.AssetCategory.name : 'Uncategorized',
        makeModel: `${asset.make} ${asset.model}`,
        daysInUse: utilizationDays,
        assignmentCount: assignmentCount,
        utilizationRate: utilizationRate
      });
    }
    
    // Calculate overall metrics
    const overallUtilizationRate = assets.length > 0 ? 
      Math.round((totalUtilizationDays / (assets.length * moment(effectiveEndDate).diff(moment(effectiveStartDate), 'days'))) * 100) : 0;
    
    const avgAssignmentDays = assets.length > 0 ? 
      Math.round(totalUtilizationDays / assets.length) : 0;
    
    // Get categories for filter
    const categories = await AssetCategory.findAll({
      order: [['name', 'ASC']]
    });
    
    // Prepare data for category chart
    const categoryData = [];
    const categoryLabels = [];
    
    // Group assets by category and calculate average utilization
    const categoryUtilization = {};
    
    processedAssets.forEach(asset => {
      if (!categoryUtilization[asset.category]) {
        categoryUtilization[asset.category] = {
          totalRate: 0,
          count: 0
        };
      }
      
      categoryUtilization[asset.category].totalRate += asset.utilizationRate;
      categoryUtilization[asset.category].count++;
    });
    
    for (const category in categoryUtilization) {
      categoryLabels.push(category);
      const avgRate = Math.round(categoryUtilization[category].totalRate / categoryUtilization[category].count);
      categoryData.push(avgRate);
    }
    
    // Prepare timeline data
    const timelineLabels = [];
    const timelineData = [];
    
    // Create monthly timeline data
    let currentDate = moment(effectiveStartDate).startOf('month');
    const endMonth = moment(effectiveEndDate).endOf('month');
    
    while (currentDate.isSameOrBefore(endMonth)) {
      timelineLabels.push(currentDate.format('MMM YYYY'));
      
      // Calculate utilization for this month
      const monthStart = moment(currentDate).startOf('month').toDate();
      const monthEnd = moment(currentDate).endOf('month').toDate();
      
      // Simplified calculation for demo
      // In a real app, you would query the database for each month
      const utilizationForMonth = Math.round(Math.random() * 50) + 40; // Mock data
      timelineData.push(utilizationForMonth);
      
      currentDate.add(1, 'month');
    }
    
    res.render('reports/asset-utilization', {
      title: 'Asset Utilization Report',
      assets: processedAssets,
      categories,
      selectedCategory: categoryId || '',
      startDate: moment(effectiveStartDate).format('YYYY-MM-DD'),
      endDate: moment(effectiveEndDate).format('YYYY-MM-DD'),
      utilizationRate: overallUtilizationRate,
      avgAssignmentDays,
      totalTransactions,
      categoryLabels,
      categoryData,
      timelineLabels,
      timelineData
    });
  } catch (error) {
    console.error('Error generating asset utilization report:', error);
    res.status(500).render('error', { message: 'Error generating report' });
  }
};

// Employee assets report
// Employee assets report
// Employee assets report
exports.getEmployeeAssetsReport = async (req, res) => {
  try {
    const { employeeId, departmentId, branchId, status } = req.query;
    
    let whereClause = { isActive: true };
    
    // Filter by specific employee
    if (employeeId) {
      whereClause.id = employeeId;
    }
    
    // Filter by department
    if (departmentId) {
      whereClause.department = departmentId;
    }
    
    // Filter by branch
    if (branchId) {
      whereClause.branch = branchId;
    }
    
    // Get employees
    const employees = await Employee.findAll({
      where: whereClause,
      order: [['lastName', 'ASC'], ['firstName', 'ASC']]
    });
    
    // Get all departments for filter
    const departments = await Employee.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('department')), 'department']],
      where: {
        department: {
          [Op.not]: null,
          [Op.ne]: ''
        }
      },
      raw: true
    }).then(results => results.map(result => result.department).sort());
    
    // Get all branches for filter
    const branches = await Employee.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('branch')), 'branch']],
      where: {
        branch: {
          [Op.not]: null,
          [Op.ne]: ''
        }
      },
      raw: true
    }).then(results => results.map(result => result.branch).sort());
    
    // For each employee, get their assigned assets
    const employeeAssets = [];
    
    for (const employee of employees) {
      // Get latest issue history entries that don't have a corresponding return
      let assetWhereClause = { status: 'assigned' };
      
      if (status) {
        assetWhereClause.status = status;
      }
      
      const assignedAssets = await Asset.findAll({
        where: {
          ...assetWhereClause,
          '$AssetHistories.employeeId$': employee.id,
          '$AssetHistories.actionType$': 'issue'
        },
        include: [
          { model: AssetCategory },
          {
            model: AssetHistory,
            where: {
              employeeId: employee.id,
              actionType: 'issue'
            },
            required: true
          }
        ]
      });
      
      // Convert sequelize instances to plain objects and add assets directly
      const employeeData = employee.get({ plain: true });
      employeeData.assets = assignedAssets;
      employeeData.totalCount = assignedAssets.length;
      employeeData.totalValue = assignedAssets.reduce((sum, asset) => sum + parseFloat(asset.purchasePrice || 0), 0);
      
      employeeAssets.push(employeeData);
    }
    
    // Get all employees for filter
    const allEmployees = await Employee.findAll({
      where: { isActive: true },
      order: [['lastName', 'ASC'], ['firstName', 'ASC']]
    });

    function formatPrice(value) {
      if (!value) return '0.00';
      return parseFloat(value).toFixed(2);
    }

    
    res.render('reports/employee-assets', {
      title: 'Employee Assets Report',
      employeeAssets,
      allEmployees: allEmployees,
      employees: employees, // Pass the filtered employees to the template
      departments,
      branches,
      selectedEmployee: employeeId || '',
      selectedDepartment: departmentId || '',
      selectedBranch: branchId || '',
      selectedStatus: status || '',
      formatPrice
    });
  } catch (error) {
    console.error('Error generating employee assets report:', error);
    res.status(500).render('error', { message: 'Error generating report' });
  }
};

// Asset value report
exports.getAssetValueReport = async (req, res) => {
  try {
    // Get aggregated asset value by category
    const assetsByCategory = await Asset.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('Asset.id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('purchasePrice')), 'totalValue']
      ],
      include: [{ model: AssetCategory, attributes: ['id', 'name'] }],
      group: ['AssetCategory.id', 'AssetCategory.name'],
      raw: true,
      nest: true
    });
    
    // Get aggregated asset value by status
    const assetsByStatus = await Asset.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('purchasePrice')), 'totalValue']
      ],
      group: ['status'],
      raw: true
    });
    
    // Get aggregated asset value by branch
    const assetsByBranch = await Asset.findAll({
      attributes: [
        'branch',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('purchasePrice')), 'totalValue']
      ],
      group: ['branch'],
      raw: true
    });
    
    // Calculate total asset value
    const totalAssetValue = assetsByCategory.reduce(
      (sum, category) => sum + parseFloat(category.totalValue || 0),
      0
    );
    
    res.render('reports/asset-value', {
      title: 'Asset Value Report',
      assetsByCategory,
      assetsByStatus,
      assetsByBranch,
      totalAssetValue
    });
  } catch (error) {
    console.error('Error generating asset value report:', error);
    res.status(500).render('error', { message: 'Error generating report' });
  }
};