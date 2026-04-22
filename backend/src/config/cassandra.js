import 'dotenv/config';
import cassandra from 'cassandra-driver';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const cassandraClient = new cassandra.Client({
    cloud: { 
        secureConnectBundle: path.join(__dirname, 'secure-connect-foodly.zip') 
    },
    credentials: { 
        username: process.env.ASTRA_DB_CLIENT_ID, 
        password: process.env.ASTRA_DB_CLIENT_SECRET 
    },
    keyspace: 'foodly_tracking'
});

// 3. Kết nối
cassandraClient.connect()
    .then(() => console.log('Cassandra Cloud connected!'))
    .catch(err => console.error('Lỗi kết nối:', err));