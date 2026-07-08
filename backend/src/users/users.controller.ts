import { Controller, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch('push-token')
  @UseGuards(JwtAuthGuard)
  async updatePushToken(
    @Request() req: any, 
    @Body('pushToken') pushToken: string,
  ) {

    return this.usersService.updatePushToken(req.user.id, pushToken);
  }
}