import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
export declare class UserService {
    private userRepository;
    constructor(userRepository: Repository<User>);
    findAll(): Promise<User[]>;
    findOne(id: number): Promise<User | null>;
    findByUsername(username: string): Promise<User | null>;
    create(userData: Partial<User>): Promise<User>;
}
