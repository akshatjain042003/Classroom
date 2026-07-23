import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { LoginDto, RegisterUser } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';
import { access } from 'fs';

@Injectable()
export class AuthService {
  constructor(
    private userService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterUser) {
    const { password, email, username, firstname, lastname } = dto;
    const existing = await this.userService.findOne(email);
    if (existing) {
      throw new ConflictException('Email already in use Please login');
    }

    const hashed = password ? await bcrypt.hash(password, 10) : null;
    const user = await this.userService.createuser({
      ...dto,
      password: hashed,
    });
    return user;
  }

  async refreshTokens(user: any, refreshToken: string) {
    console.log('====', user, refreshToken);
    const userdata = await this.userService.findById(user);
    console.log('====', userdata);
    if (!userdata || !userdata.accesstoken) {
      throw new UnauthorizedException('Invalid credentials');
    }

    console.log(
      'refreshToken',
      refreshToken,
      '\n',
      'accesstoken',
      userdata.accesstoken,
    );
    
    if (refreshToken !== userdata.accesstoken) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const payload = {
      sub: userdata.id,
      username: userdata.username,
      email: userdata.email,
    };
    console.log(
      '======================tokensecrete',
      process.env.REFRESH_TOKEN,
    );
    console.log('======================payload', payload);

    const access_token = this.jwtService.sign(payload);
    const refresh_token = this.jwtService.sign(payload, {
      secret: process.env.REFRESH_TOKEN,
      expiresIn: '1d',
    });

    await this.userService.updateRefreshToken(userdata.id, refresh_token);

    return { access_token, refresh_token };
  }

  async logout(userId: number) {
    await this.userService.updateRefreshToken(userId, null);
  }

  async login(dto: LoginDto) {
    const user = await this.userService.findOne(dto.username);
    if (!user) {
      throw new UnauthorizedException('User does not exist');
    }

    if (user.password) {
      const passwordMatch = await bcrypt.compare(dto.password, user.password);
      if (!passwordMatch) {
        throw new UnauthorizedException('Invalid credentials');
      }
    }

    const payload = {
      sub: user.id,
      username: user.username,
      email: user.email,
    };
    console.log(
      '======================tokensecrete',
      process.env.REFRESH_TOKEN,
    );
    console.log('======================payload', payload);

    const access_token = this.jwtService.sign(payload);
    const refresh_token = this.jwtService.sign(payload, {
      secret: process.env.REFRESH_TOKEN,
      expiresIn: '1d',
    });

    
    await this.userService.updateRefreshToken(user.id, refresh_token);

    return { access_token, refresh_token };
  }

  async findOrCreateGoogleUser(googleUser: {
    googleid: string;
    email: string;
    firstname: string;
    picture?: string;
  }) {
    return this.userService.findOrCreateOAuthUser(googleUser);
  }

  async googleLogin(user: any) {
    if (!user) {
      throw new UnauthorizedException('Google auth failed');
    }

    const payload = {
      sub: user.id,
      username: user.firstname,
      email: user.email,
    };

    const access_token = this.jwtService.sign(payload);
    const refresh_token = this.jwtService.sign(payload, {
      secret: process.env.REFRESH_TOKEN,
      expiresIn: '1d',
    });

    await this.userService.updateRefreshToken(user.id, refresh_token);

    return {
      access_token,
      refresh_token,
      user: {
        id: user.id,
        firstname: user.firstname,
        email: user.email,
        picture: user.picture,
      },
    };
  }

  // async validateUser(username: string, pass: string): Promise<any> {
  //   const user = await this.userService.findOne(username);
  //   if (user && user.password === pass) {
  //     const { password, ...result } = user;
  //     return result;
  //   }
  //   return null;
  // }
}
