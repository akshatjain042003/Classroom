import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private userService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET ?? '',
      ignoreExpiration: false,
    });
  }
  async validate(payload: { sub: number; username: string; email: string }) {
    console.log('we are in jwt method', payload);
    const user = await this.userService.findById(payload.sub);
    return user;
  }
}
