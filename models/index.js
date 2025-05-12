const sequelize = require('../config/database');
const Employee = require('./Employee');
const Asset = require('./Asset');
const AssetCategory = require('./AssetCategory');
const AssetHistory = require('./AssetHistory');

AssetCategory.hasMany(Asset, { foreignKey: 'categoryId' });
Asset.belongsTo(AssetCategory, { foreignKey: 'categoryId' });

Asset.hasMany(AssetHistory, { foreignKey: 'assetId' });
AssetHistory.belongsTo(Asset, { foreignKey: 'assetId' });

Employee.hasMany(AssetHistory, { foreignKey: 'employeeId' });
AssetHistory.belongsTo(Employee, { foreignKey: 'employeeId' });

module.exports = {
  sequelize,
  Employee,
  Asset,
  AssetCategory,
  AssetHistory
};