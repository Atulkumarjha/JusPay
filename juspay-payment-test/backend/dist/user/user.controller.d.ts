import { UserService } from './user.service';
export declare class UserController {
    private readonly userService;
    constructor(userService: UserService);
    findAll(): Promise<import("../entities/user.entity").User[]>;
    getProfile(user: any): Promise<import("../entities/user.entity").User | null>;
}
