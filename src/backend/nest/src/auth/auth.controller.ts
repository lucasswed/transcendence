import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserDto } from 'src/user/dto';

@Controller('auth')
export class AuthController {
  constructor(private AuthService: AuthService) {}

  @Post('signup')
  signup(@Body() dto: UserDto) {
    return this.AuthService.signup(dto);
  }

  @Post('login')
  login(@Body() dto: UserDto) {
    return this.AuthService.login(dto);
  }
}
