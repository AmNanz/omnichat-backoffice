import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, AuthUser } from '../../../common/decorators/current-user.decorator';
import { Public } from '../../../common/decorators/public.decorator';
import { LoginDto } from '../dto/login.dto';
import { AuthService } from '../services/auth.service';

@ApiTags('Auth')
@Controller('backoffice/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Current user' })
  me(@CurrentUser() user: AuthUser) {
    return this.authService.me(user);
  }

  @Post('logout')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout (client should discard token)' })
  logout(@CurrentUser() user: AuthUser) {
    return this.authService.logout(user);
  }
}
