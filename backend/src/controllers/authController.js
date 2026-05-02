import { authService } from '../services/authService.js';
import { AppError, catchAsync } from '../middlewares/errorHandler.js';
import { generateTokens } from '../middlewares/auth.js';

class AuthController {
    registerMerchant = catchAsync(async (req, res, next) => {
        const payload = req.body;

        await authService.registerMerchant(payload);

        res.status(201).json({
            status: 'success',
            message: 'Đăng ký tài khoản nhà hàng thành công'
        });
    });

    loginMerchant = catchAsync(async (req, res, next) => {
        const { username, password } = req.body;

        const user = await authService.loginMerchant(username, password);

        const tokens = generateTokens({ 
            id: user.id,
            username: user.username,
            role: user.role
        });

        const isProd = process.env.NODE_ENV === 'production';
        const cookieOptions = (maxAgeMs) => ({
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? 'none' : 'lax',
            maxAge: maxAgeMs,
            path: '/'
        });

        const sanitizedUser = { ...user };
        delete sanitizedUser.id;
        delete sanitizedUser.user_id;

        res
            .cookie('accessToken', tokens.accessToken, cookieOptions(12 * 60 * 60 * 1000))
            .cookie('refreshToken', tokens.refreshToken, cookieOptions(7 * 24 * 60 * 60 * 1000))
            .status(200).json({
                status: 'success',
                data: { user: sanitizedUser }
            });
    });

    getMerchantMe = catchAsync(async (req, res, next) => {
        if (req.user?.role !== 'merchant') {
            return next(new AppError('Insufficient permissions for this action', 403));
        }

        const user = await authService.getMerchantById(req.user.id);

        res.status(200).json({
            status: 'success',
            data: { user }
        });
    });
}

export const authController = new AuthController();
