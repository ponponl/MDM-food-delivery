require('dotenv').config();
const express = require('express');
const connectMongo = require('./configs/mongodb');
const redisClient = require('./configs/redis');
const neo4jDriver = require('./configs/neo4j');
const pgPool = require('./configs/postgres');
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
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});