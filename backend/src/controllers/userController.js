import { AppError, catchAsync } from "../middlewares/errorHandler.js";
import { UserService } from "../services/userService.js";
import { generateTokens, refreshTokenStore } from "../middlewares/auth.js";
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
            username: newUser.username 
        });

        res.status(201).json({
            status: 'success',
            data: {
                user: {
                    id: newUser.user_id,
                    username: newUser.username,
                    name: newUser.name
                },
                ...tokens
            }
        });
    });

    login = catchAsync(async (req, res, next) => {
        const { username, password } = req.body;

        if (!username || !password) {
            throw new AppError('Please provide username and password', 400);
        }

        const user = await this.userService.loginUser(username, password);

        const tokens = generateTokens({ 
            id: user.user_id, 
            username: user.username 
        });

        res.status(200).json({
            status: 'success',
            ...tokens,
            data: { user }
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
        const { refreshToken } = req.body;
        if (refreshToken) {
            refreshTokenStore.delete(refreshToken);
        }
        res.status(200).json({
            status: 'success',
            message: 'Logged out successfully'
        });
    });

    getMe = catchAsync(async (req, res, next) => {
        const user = await this.userService.getUserByUsername(req.user.username);
        
        res.status(200).json({
            status: 'success',
            data: { user }
        });
    });
}

const userController = new UserController();
export { userController };