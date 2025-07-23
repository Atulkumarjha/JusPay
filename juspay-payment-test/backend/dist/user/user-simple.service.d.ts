export declare class UserService {
    private users;
    findAll(): Promise<{
        id: number;
        username: string;
        role: string;
    }[]>;
    findOne(id: number): Promise<{
        id: number;
        username: string;
        role: string;
    } | null>;
    findByUsername(username: string): Promise<{
        id: number;
        username: string;
        password: string;
        role: string;
    } | null>;
    create(userData: any): Promise<{
        id: number;
        username: any;
        role: any;
    }>;
}
