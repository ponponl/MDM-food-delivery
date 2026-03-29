import pool from "../config/postgres.js";
class UserRepository {
    async findAccountByUsername(username) {
        const result = await pool.query(
            `SELECT u.name, u.phone, u.externalId, u.addresses, a.*
             FROM accounts a 
             JOIN users u ON a.user_id = u.id 
             WHERE a.username = $1`,
            [username]
        );
        
        const row = result.rows[0];
        if (!row) return null;
        return {
            ...row,
            externalId: row.externalid
        };
    }

    async findAccountByEmail(email) {
        const result = await pool.query(
            'SELECT * FROM accounts WHERE email = $1',
            [email]
        );
        return result.rows[0] || null;
    }

    async createUser({ name, phone, addresses, username, email, password }) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const userResult = await client.query(
                `INSERT INTO users (name, phone, addresses) 
                 VALUES ($1, $2, $3) RETURNING id, externalId`,
                [name, phone, JSON.stringify(addresses || [])]
            );

            const userId = userResult.rows[0].id;
            const externalId = userResult.rows[0].externalid;

            const accountResult = await client.query(
                `INSERT INTO accounts (user_id, username, email, password) 
                 VALUES ($1, $2, $3, $4) RETURNING *`,
                [userId, username, email, password]
            );

            await client.query('COMMIT');
            return {
                ...accountResult.rows[0],
                name,
                phone,
                externalId
            };
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
    async updateProfileInfo(userId, { name, phone }) {
        const result = await pool.query(
            `UPDATE users 
             SET name = $1, phone = $2
             WHERE id = $3
             RETURNING *`,
            [name, phone, userId]
        );
        return result.rows[0] || null;
    }

    async updateAddresses(userId, addresses) {
        const result = await pool.query(
            `UPDATE users 
             SET addresses = $1
             WHERE id = $2
             RETURNING *`,
            [JSON.stringify(addresses || []), userId]
        );
        return result.rows[0] || null;
    }
}

export { UserRepository };