const { Employee } = require('../models');
const { Op } = require('sequelize');

// Get all employees with filtering
exports.getAllEmployees = async (req, res) => {

  console.log("working");
  try {
    const { status, search } = req.query;
    
    let whereClause = {};
    
    // Filter by active status
    if (status === 'active') {
      whereClause.isActive = true;
    } else if (status === 'inactive') {
      whereClause.isActive = false;
    }
    
    // Search functionality
    if (search) {
      whereClause[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { employeeId: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { department: { [Op.iLike]: `%${search}%` } }
      ];
    }
    const employees = await Employee.findAll({
        where: whereClause,
        order: [['lastName', 'ASC']]
      });
      
      res.render('employees/index', {
        title: 'Employee Management',
        employees,
        status: status || 'all',
        search: search || ''
      });
    } catch (error) {
      console.error('Error fetching employees:', error);
      res.status(500).render('error', { message: 'Error fetching employees' });
    }
  };

  // Show form to add employee
exports.showAddEmployeeForm = (req, res) => {
    res.render('employees/add', { title: 'Add New Employee' });
  };
  
  // Add new employee
  exports.addEmployee = async (req, res) => {
    try {
      const {
        employeeId,
        firstName,
        lastName,
        email,
        department,
        branch,
        joiningDate
      } = req.body;
      
      await Employee.create({
        employeeId,
        firstName,
        lastName,
        email,
        department,
        branch,
        joiningDate,
        isActive: true
      });
      
      res.redirect('/employees');
    } catch (error) {
        console.error('Error adding employee:', error);
        res.status(500).render('error', { message: 'Error adding employee' });
      }
    };

    exports.showEditEmployeeForm = async (req, res) => {
        try {
          const employee = await Employee.findByPk(req.params.id);
          
          if (!employee) {
            return res.status(404).render('error', { message: 'Employee not found' });
          }
          
          res.render('employees/edit', {
            title: 'Edit Employee',
            employee
          });
        } catch (error) {
          console.error('Error fetching employee:', error);
          res.status(500).render('error', { message: 'Error fetching employee' });
        }
      };

      // Update employee
exports.updateEmployee = async (req, res) => {
    try {
      const {
        employeeId,
        firstName,
        lastName,
        email,
        department,
        branch,
        joiningDate,
        isActive
      } = req.body;
      
      const employee = await Employee.findByPk(req.params.id);
      
      if (!employee) {
        return res.status(404).render('error', { message: 'Employee not found' });
      }
      
      await employee.update({
        employeeId,
        firstName,
        lastName,
        email,
        department,
        branch,
        joiningDate,
        isActive: isActive === 'on'
      });

          
    res.redirect('/employees');
} catch (error) {
  console.error('Error updating employee:', error);
  res.status(500).render('error', { message: 'Error updating employee' });
}
};