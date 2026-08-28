const pool = require('./config/db');

async function testConnection() {
  try {
    console.log('Testing MySQL database connection...');
    const connection = await pool.getConnection();
    
    const [rows] = await connection.query('SELECT VERSION() AS version, DATABASE() AS db_name');
    console.log('Successfully connected to MySQL database!');
    console.log(`Connected Database: ${rows[0].db_name}`);
    console.log(`MySQL Server Version: ${rows[0].version}`);
    
    connection.release();
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Database connection test failed!');
    console.error(`Error Code: ${error.code}`);
    console.error(`Error Message: ${error.message}`);
    process.exit(1);
  }
}

testConnection();
