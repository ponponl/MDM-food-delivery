import pool from '../config/postgres.js';

class AuthRepository {
    async findAccountByUsernameOrEmail(username, email) {
        const result = await pool.query(
            'SELECT id FROM accounts WHERE username = $1 OR email = $2',
            [username, email]
        );
        return result.rows;
    }

    async createMerchantAccount({ username, email, password }) {
        const result = await pool.query(
            `INSERT INTO accounts (username, email, password, role) 
             VALUES ($1, $2, $3, $4) RETURNING id`,
            [username, email, password, 'merchant']
        );
        return result.rows[0];
    }

    async updateAccountRestaurantPublicId(accountId, publicId) {
        await pool.query(
            `UPDATE accounts SET restaurant_public_id = $1 WHERE id = $2`,
            [publicId, accountId]
        );
    }

    async deleteAccountById(accountId) {
        await pool.query('DELETE FROM accounts WHERE id = $1', [accountId]);
    }

    async findAccountByUsernameAndRole(username, role) {
        const result = await pool.query(
            "SELECT * FROM accounts WHERE username = $1 AND role = $2",
            [username, role]
        );
        return result.rows[0] || null;
    }

    async findAccountByIdAndRole(accountId, role) {
        const result = await pool.query(
            "SELECT * FROM accounts WHERE id = $1 AND role = $2",
            [accountId, role]
        );
        return result.rows[0] || null;
    }
}

export const authRepository = new AuthRepository();
