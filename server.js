const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Try to use MongoDB routes first, fallback to file-based storage
let employeeRoutes;
try {
  // Try MongoDB first
  const mongoose = require('mongoose');
  if (process.env.MONGODB_URI && process.env.MONGODB_URI.startsWith('mongodb://') || process.env.MONGODB_URI.startsWith('mongodb+srv://')) {
    employeeRoutes = require('./routes/employees');
    console.log('Using MongoDB for data storage');
  } else {
    throw new Error('No MongoDB URI provided');
  }
} catch (error) {
  // Fallback to file-based storage
  employeeRoutes = require('./routes/employeesFile');
  console.log('Using file-based storage for data persistence');
}

// Routes
app.use('/api/employees', employeeRoutes);

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log('Employee Management System is ready!');
});

module.exports = app;