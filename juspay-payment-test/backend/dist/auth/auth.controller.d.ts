import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    login(loginDto: LoginDto): Promise<{
        success: boolean;
        access_token: string;
        user: {
            id: any;
            username: any;
            role: any;
            wallet_balance: any;
            glo_coin_balance: any;
        };
    }>;
    register(registerDto: any): Promise<{
        success: boolean;
        error: string;
        message?: undefined;
    } | {
        success: boolean;
        message: string;
        error?: undefined;
    }>;
}
