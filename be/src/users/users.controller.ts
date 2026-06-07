import {
  Controller, Get, Post, Body, Patch, Param, Delete,
  UseGuards, UseInterceptors, UploadedFile, Res
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import type { Response } from 'express';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PermissionGuard } from '../auth/permission.guard';
import { RequirePermission } from '../auth/permission.decorator';
import { Permission } from '../auth/permission.enum';
import { CurrentUser } from '../auth/current-user.decorator';
import { DocumentType } from './entities/user-document.entity';

@Controller('users')
@UseGuards(PermissionGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  // ─────────────────────────────────────────
  //  EXPORT EXCEL
  // ─────────────────────────────────────────

  @Get('export/excel')
  @RequirePermission(Permission.Manager)
  async exportExcel(@Res() res: Response) {
    const buffer = await this.usersService.exportToExcel();
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="ds_nhan_su.xlsx"',
      'Content-Length': buffer.byteLength,
    });
    return res.end(Buffer.from(buffer));
  }

  // ─────────────────────────────────────────
  //  SELF – any authenticated user
  // ─────────────────────────────────────────

  @Get('me')
  getMe(@CurrentUser() user: any) {
    return this.usersService.findOne(user.userId);
  }

  @Patch('me')
  updateMe(@CurrentUser() user: any, @Body() updateUserDto: UpdateUserDto) {
    const { phone, email, address, gender, birth_date } = updateUserDto;
    return this.usersService.update(user.userId, { phone, email, address, gender, birth_date }, user); // pass currentUser for history? Self edits might not need history, or they could if we pass `user` object. Wait, `update()` expects currentUser for permissions. Passing `user` makes sense!
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

  @Get('me/documents')
  getMyDocuments(@CurrentUser() user: any) {
    return this.usersService.getMyDocuments(user.userId);
  }

  @Post('me/documents')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads/documents',
      filename: (req, file, callback) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        callback(null, `doc-${uniqueSuffix}${ext}`);
      },
    }),
  }))
  async uploadDocument(
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
    @Body('type') type: DocumentType,
  ) {
    return this.usersService.addDocument(user.userId, file, type);
  }

  @Delete('me/documents/:id')
  deleteMyDocument(@CurrentUser() user: any, @Param('id') id: string) {
    return this.usersService.deleteMyDocument(user.userId, +id);
  }

  @Get('me/contract')
  getMyContract(@CurrentUser() user: any) {
    return this.usersService.getMyContract(user.userId);
  }

  // ─────────────────────────────────────────
  //  ADMIN / MANAGER – restricted operations
  // ─────────────────────────────────────────

  @Post()
  @RequirePermission(Permission.Manager)
  create(@CurrentUser() currentUser: any, @Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto, currentUser);
  }

  @Get()
  @RequirePermission(Permission.Manager)
  findAll(@CurrentUser() currentUser: any) {
    return this.usersService.findAll(currentUser);
  }


  @Get(':id')
  @RequirePermission(Permission.Manager)
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Patch(':id')
  @RequirePermission(Permission.Manager)
  update(@CurrentUser() currentUser: any, @Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto, currentUser);
  }

  @Delete(':id')
  @RequirePermission(Permission.Manager)
  remove(@CurrentUser() currentUser: any, @Param('id') id: string) {
    return this.usersService.remove(+id, currentUser);
  }

  // --- Admin Document Management ---
  @Get(':id/documents')
  @RequirePermission(Permission.Manager)
  getDocumentsAdmin(@Param('id') id: string) {
    return this.usersService.getMyDocuments(+id);
  }

  @Post(':id/documents')
  @RequirePermission(Permission.Manager)
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads/documents',
      filename: (req, file, callback) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        callback(null, `doc-${uniqueSuffix}${ext}`);
      },
    }),
  }))
  async uploadDocumentAdmin(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('type') type: DocumentType,
  ) {
    return this.usersService.addDocument(+id, file, type);
  }

  @Post(':id/documents/text')
  @RequirePermission(Permission.Manager)
  async addTextDocumentAdmin(
    @Param('id') id: string,
    @Body('document_name') name: string,
    @Body('document_content') content: string,
    @Body('type') type: DocumentType,
  ) {
    return this.usersService.addTextDocument(+id, name, content, type);
  }

  @Delete(':id/documents/:docId')
  @RequirePermission(Permission.Manager)
  deleteDocumentAdmin(@Param('id') id: string, @Param('docId') docId: string) {
    return this.usersService.deleteMyDocument(+id, +docId);
  }

  // --- Admin History ---
  @Get('histories/all')
  @RequirePermission(Permission.Manager)
  getAllHistoryAdmin() {
    return this.usersService.getAllProfileHistory();
  }

  @Get(':id/history')
  @RequirePermission(Permission.Manager)
  getHistoryAdmin(@Param('id') id: string) {
    return this.usersService.getProfileHistory(+id);
  }
}
