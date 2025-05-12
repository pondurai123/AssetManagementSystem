const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AssetHistory = sequelize.define('AssetHistory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  assetId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Assets',
      key: 'id'
    }
  },
  employeeId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Employees',
      key: 'id'
    }
  },
  actionType: {
    type: DataTypes.ENUM('purchase', 'issue', 'return', 'repair', 'scrap'),
    allowNull: false
  },
  actionDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  reason: {
    type: DataTypes.TEXT
  },
  notes: {
    type: DataTypes.TEXT
  }
}, {
  timestamps: true
});

module.exports = AssetHistory;
