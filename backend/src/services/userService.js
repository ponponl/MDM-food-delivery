import { UserRepository } from "../repositories/userRepository.js";
import { AppError } from "../middlewares/errorHandler.js";
import bcrypt from "bcrypt";

class UserService {
    constructor() {
        this.userRepository = new UserRepository();
    }

    async getUserByUsername(username) {
        const user = await this.userRepository.findAccountByUsername(username);

        if (!user) {
            throw new AppError(`User with username ${username} not found`, 404);
        }

        return user;
    }

    async loginUser(username, password) {
        const user = await this.userRepository.findAccountByUsername(username);

        if (!user) {
            throw new AppError("Tên đăng nhập hoặc mật khẩu không đúng", 401);
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (!isPasswordCorrect) {
            throw new AppError("Tên đăng nhập hoặc mật khẩu không đúng", 401);
        }

        delete user.password;
        return user;
    }

    async registerUser(userData) {
        const { username, email, password, name, phone, addresses } = userData;

        const existingUser = await this.userRepository.findAccountByUsername(username);
        if (existingUser) throw new AppError("Tên đăng nhập đã tồn tại", 400);

        const existingEmail = await this.userRepository.findAccountByEmail(email);
        if (existingEmail) throw new AppError("Email đã được sử dụng", 400);

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        return await this.userRepository.createUser({
            username,
            email,
            password: hashedPassword,
            name,
            phone,
            addresses
        });
    }
}

export { UserService };