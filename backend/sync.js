require('dotenv').config();
const { connectDB, sequelize } = require('./config/db');
require('./models'); // import models
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

const run = async () => {
  try {
    await connectDB();
    await sequelize.sync({ force: true });
    console.log('Database force synced.');
    await seedAdmin();
    console.log('Database migration complete.');
    process.exit(0);
  } catch (err) {
    console.error('Error syncing:', err);
    process.exit(1);
  }
};
run();
