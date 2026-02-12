const neo4j = require('neo4j-driver');
const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic('neo4j', process.env.NEO4J_PASSWORD)
);
module.exports = driver;