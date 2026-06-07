import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { Department } from '../departments/entities/department.entity';
import { Role } from '../roles/entities/role.entity';
import { UserDocument } from './entities/user-document.entity';
import { SalaryConfig } from '../payrolls/entities/salary-config.entity';
import { ProfileHistory } from './entities/profile-history.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Department, Role, UserDocument, SalaryConfig, ProfileHistory])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule { }
