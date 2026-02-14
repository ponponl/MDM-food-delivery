import 'dotenv/config';
import express from 'express';
import morgan from 'morgan';
import logger from './configs/logger.js';
import cors from 'cors';
import connectMongo from './configs/mongodb.js';
import redisClient from './configs/redis.js';
import neo4jDriver from './configs/neo4j.js';
import pgPool from './configs/postgres.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

connectMongo();
redisClient.connect().then(() => console.log('✅ Redis Connected'));

// Import các Module chức năng 
// app.use('/api/orders', require('./modules/orders/routes'));
// app.use('/api/cart', require('./modules/cart/routes'));

const PORT = process.env.PORT || 3000;

// Route kiểm tra hệ thống
app.get('/api/test', async (req, res) => {
  const testStatus = {
    server: 'Running',
    databases: {
      mongodb: 'Checking...',
      postgres: 'Checking...',
      redis: 'Checking...',
      neo4j: 'Checking...'
    }
  };

  try {
    // 1. Kiểm tra MongoDB (Mongoose)
    const mongoose = require('mongoose');
    testStatus.databases.mongodb = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';

    // 2. Kiểm tra PostgreSQL
    await pgPool.query('SELECT 1');
    testStatus.databases.postgres = 'Connected';

    // 3. Kiểm tra Redis
    const pingResponse = await redisClient.ping();
    testStatus.databases.redis = pingResponse === 'PONG' ? 'Connected' : 'Error';

    // 4. Kiểm tra Neo4j
    await neo4jDriver.verifyConnectivity();
    testStatus.databases.neo4j = 'Connected';

    logger.info("Kiểm tra hệ thống thành công");
    res.json(testStatus);
  } catch (error) {
    res.status(500).json({
      status: 'Incomplete ⚠️',
      testStatus,
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});