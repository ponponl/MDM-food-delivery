import 'dotenv/config';
import express from 'express';
import morgan from 'morgan';
import mongoose from 'mongoose';
import logger from './config/logger.js';
import cors from 'cors';
import connectMongo from './config/mongodb.js';
import redisClient from './config/redis.js';
import neo4jDriver from './config/neo4j.js';
import pgPool from './config/postgres.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

connectMongo();
redisClient.connect().then(() => console.log('\nRedis Connected'));
pgPool.connect().then(() => console.log('PostgreSQL Connected'));

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
      redis: 'Checking...'
      // neo4j: 'Checking...'
    }
  };

  try {
    // 1. Kiểm tra MongoDB (Mongoose)
    try {
      testStatus.databases.mongodb = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
    } catch (err) {
      testStatus.databases.mongodb = `Error: ${err.message}`;
    }

    // 2. Kiểm tra PostgreSQL
    try {
      await pgPool.query('SELECT 1');
      testStatus.databases.postgres = 'Connected';
    } catch (err) {
      testStatus.databases.postgres = `Error: ${err.message}`;
    }

    // 3. Kiểm tra Redis
    try {
      const pingResponse = await redisClient.ping();
      testStatus.databases.redis = pingResponse === 'PONG' ? 'Connected' : 'Error';
    } catch (err) {
      testStatus.databases.redis = `Error: ${err.message}`;
    }

    // 4. Kiểm tra Neo4j
    // try {
    //   await neo4jDriver.verifyConnectivity();
    //   testStatus.databases.neo4j = 'Connected';
    // } catch (err) {
    //   testStatus.databases.neo4j = `Error: ${err.message}`;
    // }

    logger.info("Kiểm tra hệ thống hoàn tất");
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