// const neo4j = require('neo4j-driver');
import neo4j from 'neo4j-driver';

const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic('neo4j', process.env.NEO4J_PASSWORD)
);

export const connectNeo4j = async () => {
  try {
    await driver.verifyConnectivity();
    console.log('Neo4j Connected');
  } catch (err) {
    console.error(`Neo4j connection error: ${err.message}`);
  }
};

export default driver;