const mysql = require('mysql2/promise');

async function createDatabase() {
  try {
    const connection = await mysql.createConnection({
      host: '127.0.0.1',
      user: 'root',
      password: 'ProminentPixel123@',
    });
    await connection.query('CREATE DATABASE IF NOT EXISTS pims_db;');
    console.log('Database pims_db created or already exists.');
    await connection.end();
  } catch (err) {
    console.error('Error creating database:', err);
  }
}

createDatabase();
