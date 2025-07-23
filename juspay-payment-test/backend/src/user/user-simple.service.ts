import { Injectable } from '@nestjs/common';

@Injectable()
export class UserService {
  private users = [
    { id: 1, username: 'admin', password: 'admin123', role: 'admin' },
    { id: 2, username: 'user1', password: 'password123', role: 'user' },
  ];

  async findAll() {
    return this.users.map(user => ({ id: user.id, username: user.username, role: user.role }));
  }

  async findOne(id: number) {
    const user = this.users.find(u => u.id === id);
    if (user) {
      return { id: user.id, username: user.username, role: user.role };
    }
    return null;
  }

  async findByUsername(username: string) {
    return this.users.find(u => u.username === username) || null;
  }

  async create(userData: any) {
    const newUser = {
      id: this.users.length + 1,
      username: userData.username,
      password: userData.password,
      role: userData.role || 'user',
    };
    this.users.push(newUser);
    return { id: newUser.id, username: newUser.username, role: newUser.role };
  }
}
