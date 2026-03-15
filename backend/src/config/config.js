import 'dotenv/config';

const config = {
    jwt: {
        secret: process.env.JWT_SECRET || 'your_access_token_secret_123',
        refreshSecret: process.env.JWT_REFRESH_SECRET || 'your_refresh_token_secret_456',
        expires: '15m'
    }
};

export default config;