"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const common_1 = require("@nestjs/common");
let UserService = class UserService {
    users = [
        { id: 1, username: 'admin', password: 'admin123', role: 'admin' },
        { id: 2, username: 'user1', password: 'password123', role: 'user' },
    ];
    async findAll() {
        return this.users.map(user => ({ id: user.id, username: user.username, role: user.role }));
    }
    async findOne(id) {
        const user = this.users.find(u => u.id === id);
        if (user) {
            return { id: user.id, username: user.username, role: user.role };
        }
        return null;
    }
    async findByUsername(username) {
        return this.users.find(u => u.username === username) || null;
    }
    async create(userData) {
        const newUser = {
            id: this.users.length + 1,
            username: userData.username,
            password: userData.password,
            role: userData.role || 'user',
        };
        this.users.push(newUser);
        return { id: newUser.id, username: newUser.username, role: newUser.role };
    }
};
exports.UserService = UserService;
exports.UserService = UserService = __decorate([
    (0, common_1.Injectable)()
], UserService);
//# sourceMappingURL=user-simple.service.js.map