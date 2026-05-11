import bcrypt from 'bcrypt';
import Restaurant from '../modules/restaurant/restaurantModel.js';
import { AppError } from '../middlewares/errorHandler.js';
import { CATEGORY_MAP } from '../modules/restaurant/restaurantRepo.js';
import { authRepository } from '../repositories/authRepository.js';

class AuthService {
    async registerMerchant(payload) {
        const { email, password, username, name, type, phone, address, openTime, closeTime } = payload;

        if (!email || !password || !username || !name || !type) {
            throw new AppError('Vui lòng cung cấp đầy đủ thông tin yêu cầu', 400);
        }

        const existingAccounts = await authRepository.findAccountByUsernameOrEmail(username, email);
        if (existingAccounts.length > 0) {
            throw new AppError('Username hoặc Email đã được sử dụng', 400);
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        let accountId = null;

        try {
            const account = await authRepository.createMerchantAccount({
                username,
                email,
                password: hashedPassword
            });
            
            accountId = account.id;

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
                closeTime
            });

            await newRestaurant.save();

            await authRepository.updateAccountRestaurantPublicId(accountId, publicId);

            return accountId;

        } catch (error) {
            if (accountId) {
                await authRepository.deleteAccountById(accountId);
            }
            throw new AppError(`Đăng ký nhà hàng thất bại: ${error.message}`, 500);
        }
    }

    async loginMerchant(username, password) {
        if (!username || !password) {
            throw new AppError('Vui lòng cung cấp username và password', 400);
        }

        const user = await authRepository.findAccountByUsernameAndRole(username, 'merchant');

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

        const user = await authRepository.findAccountByIdAndRole(accountId, 'merchant');

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
