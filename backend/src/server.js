require('dotenv').config();
const express = require('express');
const connectMongo = require('./config/mongodb');
const redisClient = require('./config/redis');
const neo4jDriver = require('./config/neo4j');
const pgPool = require('./config/postgres');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

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
  console.log(`Server is running on port ${PORT}`);
});