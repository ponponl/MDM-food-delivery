import jwt from "jsonwebtoken";
import config from "../config/config.js";
import { AppError, catchAsync } from "./errorHandler.js";

export const refreshTokenStore = new Set();

export const generateTokens = (payload) => {
    const accessToken = jwt.sign(payload, config.jwt.secret, {
        expiresIn: config.jwt.expires || '15m'
    });

    const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
        expiresIn: '7d'
    });

    refreshTokenStore.add(refreshToken);

    return {
        accessToken,
        refreshToken,
        expiresIn: config.jwt.expires || '15m'
    };
};

export const cleanExpiredTokens = () => {
    refreshTokenStore.forEach(token => {
        try {
            jwt.verify(token, config.jwt.refreshSecret);
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                refreshTokenStore.delete(token);
            }
        }
    });
};

class AuthMiddleware {

    verifyToken = catchAsync(async (req, res, next) => {
        const header = req.headers.authorization;

        if (!header || !header.startsWith('Bearer ')) {
            return next(new AppError('No token provided', 401));
        }

        const token = header.split(' ')[1];
        
        try {
            const decoded = jwt.verify(token, config.jwt.secret);
            req.user = decoded;
            next();
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return next(new AppError('Access token expired', 401));
            }
            if (error.name === 'JsonWebTokenError') {
                return next(new AppError('Invalid access token', 401));
            }
            return next(new AppError('Token verification failed', 401));
        }
    });

    authorizeRole(...allowedRoles) {
        return catchAsync(async (req, res, next) => {
            const header = req.headers.authorization;

            if (!header || !header.startsWith('Bearer ')) {
                return next(new AppError('No token provided', 401));
            }

            const token = header.split(' ')[1];

            try {
                const decoded = jwt.verify(token, config.jwt.secret);
                req.user = decoded;

                if (allowedRoles.length && !allowedRoles.includes(decoded.userType)) {
                    return next(new AppError('Insufficient permissions for this action', 403));
                }
                next();
            } catch (error) {
                if (error.name === 'TokenExpiredError') {
                    return next(new AppError('Access token expired', 401));
                }
                return next(new AppError('Invalid token', 401));
            }
        });
    }
}

const authMiddleware = new AuthMiddleware();
export default authMiddleware;

export { AuthMiddleware };