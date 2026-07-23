import {
  Controller,
  Request,
  Post,
  UseGuards,
  Body,
  Get,
  Req,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterUser } from './dto/auth.dto';
import type { Response } from 'express'; // for redirect
import { GoogleAuthGuard } from '../gaurds/google_auth.gaurd';
import { User } from 'src/users/entities/user.entity';
import { AuthGuard } from '@nestjs/passport';
import { RefreshTokenGuard } from 'src/gaurds/refresh.gaurd';
import { JwtAuthGaurd } from 'src/gaurds/auth.gaurd';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('register')
  async register(@Body() dto: RegisterUser) {
    return this.authService.register(dto);
  }

  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  async refresh(@Req() req) {
    const userid = req.user['sub'];
    const refreshToken:string = req.user['refreshToken'];
    // console.log('$$$$$$$$$$', userid, refreshToken);
    return this.authService.refreshTokens(userid, refreshToken);
  }
  @UseGuards(JwtAuthGaurd)
  @Post('logout')
  async logout(@Req() req) {
    await this.authService.logout(req.user['id']);
    return {
      message: 'Logged out successfully',
    };
  }
  @UseGuards(GoogleAuthGuard)
  @Get('google')
  async googleAuth() {}

  @UseGuards(GoogleAuthGuard)
  @Get('google/callback')
  async googleCallback(@Req() req, @Res() res: Response) {
    const result = await this.authService.googleLogin(req.user);
    console.log('Google login result:', result);

    if (result && result.access_token && result.refresh_token) {
      res.redirect(
        `http://localhost:5173/auth/callback?token=${result.access_token}&refresh_token=${result.refresh_token}`,
      );
    } else {
      console.error('No tokens in result:', result);
      res.redirect('http://localhost:5173/login?error=authentication_failed');
    }
  }
}
