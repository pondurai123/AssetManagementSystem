require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const sequelize = require('./config/database');

const employeeRoutes = require('./routes/employeeRoutes');
const assetRoutes = require('./routes/assetRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Global error catchers
process.on('uncaughtException', (err) => {
  console.error('🔥 Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🔥 Unhandled Rejection:', reason);
});

// Middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// View engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// Routes
app.get('/', (req, res) => {

      try {
    res.render('index', { title: 'Asset Management System' });
  } catch (err) {
    console.error('🔥 Error rendering Jade:', err);
    res.send('Error rendering view');
  }
});

app.use('/employees', employeeRoutes);
app.use('/assets', assetRoutes);
app.use('/categories', categoryRoutes);
app.use('/reports', reportRoutes);

// 404 handler
app.use((req, res, next) => {
  res.status(404).send('404 Not Found');
});

// Error middleware (must be at the end)
app.use((err, req, res, next) => {
  console.error('🔥 Express error middleware caught this:', err.stack);
  res.status(500).send('Something went wrong!');
});

console.log('Password type:', typeof process.env.DB_PASSWORD);

// Start server
async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');

    await sequelize.sync();
    console.log('Models synchronized with database.');

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

startServer();
