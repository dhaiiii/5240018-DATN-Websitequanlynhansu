import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) { }

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordMatching = await bcrypt.compare(password, user.password);

    if (!isPasswordMatching) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.is_active) {
      throw new UnauthorizedException('Tài khoản đã bị khóa hoặc nhân viên đã nghỉ việc');
    }

    const { password: _, ...result } = user;
    return result;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    // Prioritize role_item.permission_level if available
    let permissionLevel = user.role_item?.permission_level;

    // Fallback to legacy role if no role_item permission
    if (!permissionLevel) {
      permissionLevel = user.role === 'admin' ? 'admin' : (user.role || 'user');
    }

    console.log('AuthService.login - user legacy role:', user.role);
    console.log('AuthService.login - role_item level:', user.role_item?.permission_level);
    console.log('AuthService.login - determined permissionLevel:', permissionLevel);

    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
      permission_level: permissionLevel,
    };

    const accessToken = this.jwtService.sign(payload);
    console.log('AuthService.login - token payload:', payload);

    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      avatar: user.avatar,
      role: user.role,
      permission_level: permissionLevel,
      access_token: accessToken,
      message: 'Login successful',
    };
  }
}
