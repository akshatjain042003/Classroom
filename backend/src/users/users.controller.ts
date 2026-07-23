import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './users.service';
// import { CreateUserDto } from '../auth/auth.dto';
// import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGaurd } from 'src/gaurds/auth.gaurd';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('/profile')
  @UseGuards(JwtAuthGaurd)
  getProfile(@Req() req) {
    const { id } = req.user;
    console.log(id)
    return this.usersService.getprofile(+id);
  }
}
