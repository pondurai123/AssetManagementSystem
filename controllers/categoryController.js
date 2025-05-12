const { AssetCategory } = require('../models');
const { Op } = require('sequelize');

// Get all categories
exports.getAllCategories = async (req, res) => {
  try {
    const { search } = req.query;
    
    let whereClause = {};
    
    // Search functionality
    if (search) {
      whereClause.name = { [Op.iLike]: `%${search}%` };
    }
    
    const categories = await AssetCategory.findAll({
      where: whereClause,
      order: [['name', 'ASC']]
    });
    
    res.render('categories/index', {
      title: 'Asset Categories',
      categories,
      search: search || ''
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).render('error', { message: 'Error fetching categories' });
  }
};

// Show form to add category
exports.showAddCategoryForm = (req, res) => {
  res.render('categories/add', { title: 'Add New Category' });
};

// Add new category
exports.addCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    
    await AssetCategory.create({
      name,
      description
    });
    
    res.redirect('/categories');
  } catch (error) {
    console.error('Error adding category:', error);
    res.status(500).render('error', { message: 'Error adding category' });
  }
};

// Show form to edit category
exports.showEditCategoryForm = async (req, res) => {
  try {
    const category = await AssetCategory.findByPk(req.params.id);
    
    if (!category) {
      return res.status(404).render('error', { message: 'Category not found' });
    }
    
    res.render('categories/edit', {
      title: 'Edit Category',
      category
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).render('error', { message: 'Error fetching category' });
  }
};

// Update category
exports.updateCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    
    const category = await AssetCategory.findByPk(req.params.id);
    
    if (!category) {
      return res.status(404).render('error', { message: 'Category not found' });
    }
    
    await category.update({
      name,
      description
    });
    
    res.redirect('/categories');
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).render('error', { message: 'Error updating category' });
  }
};