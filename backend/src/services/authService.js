import bcrypt from 'bcrypt';
import pool from '../config/postgres.js';
import Restaurant from '../modules/restaurant/restaurantModel.js';
import { AppError } from '../middlewares/errorHandler.js';
import { CATEGORY_MAP } from '../modules/restaurant/restaurantRepo.js';

class AuthService {
    async registerMerchant(payload) {
        const { email, password, username, name, type, phone, address, openTime, closeTime } = payload;

        if (!email || !password || !username || !name || !type) {
            throw new AppError('Vui lòng cung cấp đầy đủ thông tin yêu cầu', 400);
        }

        const existingAccount = await pool.query(
            'SELECT id FROM accounts WHERE username = $1 OR email = $2',
            [username, email]
        );
        if (existingAccount.rows.length > 0) {
            throw new AppError('Username hoặc Email đã được sử dụng', 400);
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        let accountId = null;

        try {
            const accountResult = await pool.query(
                `INSERT INTO accounts (username, email, password, role) 
                 VALUES ($1, $2, $3, $4) RETURNING id`,
                [username, email, hashedPassword, 'merchant']
            );
            
            accountId = accountResult.rows[0].id;

            const mappedType = CATEGORY_MAP[type.toLowerCase()] || type;
            const publicId = Math.random().toString(36).substring(2, 10); 

            const newRestaurant = new Restaurant({
                publicId,
                accountId,
                name,
                type: mappedType,
                phone,
                address: {
                    street: address.street,
                    ward: address.ward,
                    city: address.city,
                    full: address.full,
                    location: address.location
                },
                openTime,
                closeTime,
                totalReview: 0,
                avgRating: 0.0
            });

            await newRestaurant.save();

            await pool.query(
                `UPDATE accounts SET restaurant_public_id = $1 WHERE id = $2`,
                [publicId, accountId]
            );

            return accountId;

        } catch (error) {
            if (accountId) {
                await pool.query('DELETE FROM accounts WHERE id = $1', [accountId]);
            }
            throw new AppError(`Đăng ký nhà hàng thất bại: ${error.message}`, 500);
        }
    }

    async loginMerchant(username, password) {
        if (!username || !password) {
            throw new AppError('Vui lòng cung cấp username và password', 400);
        }

        const result = await pool.query(
            "SELECT * FROM accounts WHERE username = $1 AND role = 'merchant'",
            [username]
        );

        const user = result.rows[0];
        if (!user) {
            throw new AppError("Tên đăng nhập hoặc mật khẩu không đúng", 401);
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            throw new AppError("Tên đăng nhập hoặc mật khẩu không đúng", 401);
        }

        const restaurant = await Restaurant.findOne({ accountId: user.id });

        delete user.password;
        
        return {
            ...user,
            restaurantInfo: restaurant || null
        };
    }

    async getMerchantById(accountId) {
        if (!accountId) {
            throw new AppError('Merchant account id is required', 400);
        }

        const result = await pool.query(
            "SELECT * FROM accounts WHERE id = $1 AND role = 'merchant'",
            [accountId]
        );

        const user = result.rows[0];
        if (!user) {
            throw new AppError('Merchant account not found', 404);
        }

        const restaurant = await Restaurant.findOne({ accountId: user.id });
        delete user.password;
        delete user.id;
        delete user.user_id;

        return {
            ...user,
            restaurantInfo: restaurant || null
        };
    }
}

export const authService = new AuthService();
