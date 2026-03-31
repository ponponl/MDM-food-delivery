import { AppError, catchAsync } from "../middlewares/errorHandler.js";
import { UserService } from "../services/userService.js";
import { generateTokens, refreshTokenStore } from "../middlewares/auth.js";
import jwt from "jsonwebtoken";
import config from "../config/config.js";

const buildCookieOptions = (maxAgeMs) => {
    const isProd = process.env.NODE_ENV === 'production';
    return {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'none' : 'lax',
        maxAge: maxAgeMs,
        path: '/'
    };
};
class UserController {
    constructor() {
        this.userService = new UserService();
    }

    register = catchAsync(async (req, res, next) => {
        const { username, password, email, name, phone, addresses } = req.body;

        if (!username || !password || !email) {
            throw new AppError('Vui lòng nhập đầy đủ thông tin: tên đăng nhập, email và mật khẩu', 400);
        }

        const newUser = await this.userService.registerUser({
            username, password, email, name, phone, addresses
        });

        const tokens = generateTokens({ 
            id: newUser.user_id, 
            username: newUser.username,
            externalId: newUser.externalId
        });

        res
            .cookie('accessToken', tokens.accessToken, buildCookieOptions(15 * 60 * 1000))
            .cookie('refreshToken', tokens.refreshToken, buildCookieOptions(7 * 24 * 60 * 60 * 1000))
            .status(201).json({
            status: 'success',
            data: {
                user: {
                    id: newUser.user_id,
                    username: newUser.username,
                    name: newUser.name
                }
            }
        });
    });

    login = catchAsync(async (req, res, next) => {
        const { username, password } = req.body;

        if (!username || !password) {
            throw new AppError('Please provide username and password', 400);
        }

        const user = await this.userService.loginUser(username, password);

        const sanitized = { ...user };
        delete sanitized.user_id;
        delete sanitized.id;
        delete sanitized.externalid;

        const tokens = generateTokens({ 
            id: user.user_id, 
            username: user.username,
            externalId: user.externalId
        });

        res
            .cookie('accessToken', tokens.accessToken, buildCookieOptions(15 * 60 * 1000))
            .cookie('refreshToken', tokens.refreshToken, buildCookieOptions(7 * 24 * 60 * 60 * 1000))
            .status(200).json({
            status: 'success',
            data: { user: sanitized }
        });
    });

    getUserByUsername = catchAsync(async (req, res, next) => {
        const { username } = req.body;
        if (!username) throw new AppError('Username is required', 400);

        const user = await this.userService.getUserByUsername(username);
        
        delete user.password; 
        
        return res.status(200).json(user);
    });

    logout = catchAsync(async (req, res, next) => {
        const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
        if (refreshToken) {
            refreshTokenStore.delete(refreshToken);
        }
        res
            .clearCookie('accessToken', buildCookieOptions(0))
            .clearCookie('refreshToken', buildCookieOptions(0))
            .status(200).json({
                status: 'success',
                message: 'Logged out successfully'
            });
    });

    refresh = catchAsync(async (req, res, next) => {
        const refreshToken = req.cookies?.refreshToken;

        if (!refreshToken) {
            throw new AppError('No refresh token provided', 401);
        }

        if (!refreshTokenStore.has(refreshToken)) {
            throw new AppError('Invalid refresh token', 401);
        }

        let decoded;
        try {
            decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
        } catch (error) {
            refreshTokenStore.delete(refreshToken);
            throw new AppError('Refresh token expired', 401);
        }

        refreshTokenStore.delete(refreshToken);
        const tokens = generateTokens({
            id: decoded.id,
            username: decoded.username,
            externalId: decoded.externalId
        });

        const user = await this.userService.getUserByUsername(decoded.username);
        delete user.password;

        res
            .cookie('accessToken', tokens.accessToken, buildCookieOptions(15 * 60 * 1000))
            .cookie('refreshToken', tokens.refreshToken, buildCookieOptions(7 * 24 * 60 * 60 * 1000))
            .status(200).json({
                status: 'success',
                data: { user }
            });
    });

    getMe = catchAsync(async (req, res, next) => {
        const user = await this.userService.getUserByUsername(req.user.username);

        const sanitized = { ...user };
        delete sanitized.password;
        delete sanitized.user_id;
        delete sanitized.id;
        delete sanitized.externalid;

        res.status(200).json({
            status: 'success',
            data: { user: sanitized }
        });
    });

    updateProfile = catchAsync(async (req, res, next) => {
        const { name, phone } = req.body;
        
        await this.userService.updateProfileInfo(req.user.id, {
            name, phone
        });

        const user = await this.userService.getUserByUsername(req.user.username);
        
        const sanitized = { ...user };
        delete sanitized.password;
        delete sanitized.user_id;
        delete sanitized.id;
        delete sanitized.externalid;

        res.status(200).json({
            status: 'success',
            data: { user: sanitized }
        });
    });

    updateAddresses = catchAsync(async (req, res, next) => {
        const { addresses } = req.body;
        
        await this.userService.updateProfileAddresses(req.user.id, addresses);

        const user = await this.userService.getUserByUsername(req.user.username);
        
        const sanitized = { ...user };
        delete sanitized.password;
        delete sanitized.user_id;
        delete sanitized.id;
        delete sanitized.externalid;

        res.status(200).json({
            status: 'success',
            data: { user: sanitized }
        });
    });
}

const userController = new UserController();
export { userController };