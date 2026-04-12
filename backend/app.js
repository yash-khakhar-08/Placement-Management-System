const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB, sequelize } = require('./config/db');
require('./models'); // Imports and initializes models + associations

// Routes imports
const authRoutes = require('./routes/authRoutes');
const placementRoutes = require('./routes/placementRoutes');
const candidateRoutes = require('./routes/candidateRoutes');
const roundRoutes = require('./routes/roundRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads')); // serve static resume uploads

// Connect to Database
connectDB();

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/placements', placementRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/rounds', roundRoutes);
app.use('/api/feedback', feedbackRoutes);

// Database Sync and Server start
const PORT = process.env.PORT || 5000;

const bcrypt = require('bcrypt');
const { User } = require('./models');

const seedAdmin = async () => {
  const adminExists = await User.findOne({ where: { role: 'admin' } });
  if (!adminExists) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await User.create({
      name: 'Super Admin',
      email: 'admin@pims.com',
      password: hashedPassword,
      role: 'admin',
    });
    console.log('Admin user seeded (admin@pims.com / admin123)');
  }
};

sequelize.sync({ alter: true }) // Use { force: true } explicitly to drop and recreate, { alter: true } to modify conditionally
  .then(async () => {
    console.log('Database Synced Successfully');
    await seedAdmin();
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('Failed to sync db:', err);
  });
