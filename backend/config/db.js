const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'pims_db',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || 'ProminentPixel123@',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: false, // Set to console.log to see SQL queries
  }
);

// Test connection function
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('MySQL Database Connected (Sequelize)');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
