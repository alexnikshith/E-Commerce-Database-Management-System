const pool = require('../config/db');

/**
 * Health Check Controller
 * GET /api/health
 */
const getHealth = async (req, res, next) => {
  try {
    let dbStatus = 'DOWN';
    let dbError = null;

    try {
      const [rows] = await pool.query('SELECT 1 AS alive');
      if (rows && rows[0] && rows[0].alive === 1) {
        dbStatus = 'UP';
      }
    } catch (err) {
      dbError = err.message;
    }

    const healthInfo = {
      status: dbStatus === 'UP' ? 'UP' : 'DEGRADED',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        status: dbStatus,
        ...(dbError && { error: dbError })
      }
    };

    const statusCode = dbStatus === 'UP' ? 200 : 503;
    res.status(statusCode).json(healthInfo);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHealth
};
