import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PermissionGuard } from '../auth/permission.guard';
import { RequirePermission } from '../auth/permission.decorator';
import { Permission } from '../auth/permission.enum';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('users')
@UseGuards(PermissionGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get('me')
  getMe(@CurrentUser() user: any) {
    return this.usersService.findOne(user.userId);
  }

  @Patch('me')
  updateMe(@CurrentUser() user: any, @Body() updateUserDto: UpdateUserDto) {
    // Only allow updating certain fields for security
    const { first_name, last_name, phone, address, gender, birth_date, password } = updateUserDto;
    return this.usersService.update(user.userId, { first_name, last_name, phone, address, gender, birth_date, password });
  }

  @Patch('me/change-password')
  changeMyPassword(@CurrentUser() user: any, @Body() body: { password: string }) {
    return this.usersService.update(user.userId, { password: body.password });
  }

  @Post('avatar')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, callback) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        callback(null, `avatar-${uniqueSuffix}${ext}`);
      },
    }),
  }))
  async uploadAvatar(@CurrentUser() user: any, @UploadedFile() file: Express.Multer.File) {
    return this.usersService.updateAvatar(user.userId, file.filename);
  }


  @Post()
  @RequirePermission(Permission.Manager) // Cho phép cả Manager và Admin
  create(@CurrentUser() currentUser: any, @Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto, currentUser);
  }

  @Get()
  @RequirePermission(Permission.Manager) // Managers and admins can view
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @RequirePermission(Permission.Manager) // Managers and admins can view
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Patch(':id')
  @RequirePermission(Permission.Manager) // Cho phép cả Manager và Admin
  update(@CurrentUser() currentUser: any, @Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto, currentUser);
  }

  @Delete(':id')
  @RequirePermission(Permission.Manager) // Cho phép cả Manager và Admin
  remove(@CurrentUser() currentUser: any, @Param('id') id: string) {
    return this.usersService.remove(+id, currentUser);
  }
}
