import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Department } from '../departments/entities/department.entity';
import { Role } from '../roles/entities/role.entity';
import { UserDocument, DocumentType } from './entities/user-document.entity';
import { SalaryConfig } from '../payrolls/entities/salary-config.entity';
import { ProfileHistory } from './entities/profile-history.entity';
import * as bcrypt from 'bcrypt';
import * as ExcelJS from 'exceljs';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Department)
    private departmentRepository: Repository<Department>,
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
    @InjectRepository(UserDocument)
    private documentRepository: Repository<UserDocument>,
    @InjectRepository(SalaryConfig)
    private salaryConfigRepository: Repository<SalaryConfig>,
    @InjectRepository(ProfileHistory)
    private historyRepository: Repository<ProfileHistory>,
  ) { }

  async create(createUserDto: CreateUserDto, currentUser?: any) {
    const { email, departmentId, roleId, ...userData } = createUserDto;

    // Check if manager is trying to create an admin
    if (currentUser && currentUser.permission_level === 'manager') {
      if (userData.role === 'admin') {
        throw new ForbiddenException('Quản lý không được phép tạo tài khoản Quản trị viên');
      }
      if (roleId) {
        const role = await this.rolesRepository.findOneBy({ id: roleId });
        if (role && role.permission_level === 'admin') {
          throw new ForbiddenException('Quản lý không được phép tạo tài khoản có quyền Quản trị viên');
        }
      }
    }

    // Check if email already exists
    const existingUser = await this.usersRepository.findOneBy({ email });
    if (existingUser) {
      throw new ConflictException('Đã tồn tại Email');
    }

    // Set default password if not provided
    if (!userData.password) {
      userData.password = '123456';
    }

    // Hash password before saving
    const salt = await bcrypt.genSalt(10);
    userData.password = await bcrypt.hash(userData.password, salt);

    const user = this.usersRepository.create({
      ...userData,
      email
    });

    if (departmentId) {
      const department = await this.departmentRepository.findOneBy({ id: departmentId });
      if (department) {
        user.department = department;
      }
    }

    if (roleId) {
      const role = await this.rolesRepository.findOneBy({ id: roleId });
      if (role) {
        user.role_item = role;
      }
    }

    const savedUser = await this.usersRepository.save(user);

    if (currentUser && currentUser.userId) {
      const admin = await this.usersRepository.findOneBy({ id: currentUser.userId });
      if (admin) {
        await this.historyRepository.save({
          user: savedUser,
          admin: admin,
          action: 'Tạo tài khoản mới',
          changes: { email, first_name: userData.first_name, last_name: userData.last_name }
        });
      }
    }

    return savedUser;
  }

  async findAll(currentUser?: any) {
    let whereCondition: any = {};
    if (currentUser && currentUser.permission_level === 'manager') {
      const managerUser = await this.findOne(currentUser.userId);
      if (managerUser?.department?.id) {
        whereCondition = { department: { id: managerUser.department.id } };
      } else {
        whereCondition = { id: currentUser.userId };
      }
    }

    return this.usersRepository.find({
      where: whereCondition,
      relations: ['department', 'role_item'],
    });
  }

  findOne(id: number) {
    return this.usersRepository.findOne({
      where: { id },
      relations: ['department', 'role_item'],
    });
  }

  findByEmail(email: string) {
    return this.usersRepository.findOne({
      where: { email },
      relations: ['department', 'role_item'],
    });
  }

  async update(id: number, updateUserDto: UpdateUserDto, currentUser?: any) {
    const { departmentId, roleId, ...userData } = updateUserDto;
    const user = await this.findOne(id);

    if (!user) return null;

    // Check permissions for manager
    if (currentUser && currentUser.permission_level === 'manager') {
      if (user.role === 'admin' || (user.role_item && user.role_item.permission_level === 'admin')) {
        throw new ForbiddenException('Quản lý không được phép sửa thông tin của Quản trị viên');
      }
      if (userData.role === 'admin') {
        throw new ForbiddenException('Quản lý không được phép cấp quyền Quản trị viên');
      }
      if (roleId) {
        const role = await this.rolesRepository.findOneBy({ id: roleId });
        if (role && role.permission_level === 'admin') {
          throw new ForbiddenException('Quản lý không được phép cấp quyền Quản trị viên');
        }
      }
      const managerUser = await this.findOne(currentUser.userId);
      if (user.id !== currentUser.userId &&
        (!managerUser?.department?.id || user.department?.id !== managerUser.department.id)) {
        throw new ForbiddenException('Quản lý chỉ được phép cập nhật thông tin nhân viên trong bộ phận của mình');
      }
    }

    if (userData.email && userData.email !== user.email) {
      const existing = await this.usersRepository.findOneBy({ email: userData.email });
      if (existing) {
        throw new ConflictException('Email này đã được sử dụng bởi tài khoản khác');
      }
    }

    if (userData.password) {
      const salt = await bcrypt.genSalt(10);
      userData.password = await bcrypt.hash(userData.password, salt);
    }

    const changedFields: any = {};
    if (currentUser && currentUser.permission_level === 'manager') {
      delete (userData as any).roleId;
      delete userData.role;
      delete (userData as any).departmentId;
    } else {
      if (departmentId !== undefined) {
        if (departmentId === null) {
          if (user.department !== null) changedFields.departmentId = { old: user.department?.id, new: null };
          user.department = null;
        } else {
          const department = await this.departmentRepository.findOneBy({ id: departmentId });
          if (department) {
            if (user.department?.id !== departmentId) changedFields.departmentId = { old: user.department?.id, new: departmentId };
            user.department = department;
          }
        }
      }

      if (roleId !== undefined) {
        if (roleId === null) {
          if (user.role_item !== null) changedFields.roleId = { old: user.role_item?.id, new: null };
          user.role_item = null;
        } else {
          const role = await this.rolesRepository.findOneBy({ id: roleId });
          if (role) {
            if (user.role_item?.id !== roleId) changedFields.roleId = { old: user.role_item?.id, new: roleId };
            user.role_item = role;
          }
        }
      }
    }

    // Tracking plain fields
    for (const key of Object.keys(userData)) {
      const value = (userData as any)[key];
      if (value !== undefined && key !== 'password' && (user as any)[key] !== value) {
        changedFields[key] = { old: (user as any)[key], new: value };
      }
    }

    Object.assign(user, userData);
    const savedUser = await this.usersRepository.save(user);

    if (currentUser && currentUser.userId && Object.keys(changedFields).length > 0) {
      const admin = await this.usersRepository.findOneBy({ id: currentUser.userId });
      if (admin) {
        await this.historyRepository.save({
          user: savedUser,
          admin: admin,
          action: 'Cập nhật thông tin',
          changes: changedFields
        });
      }
    }

    return savedUser;
  }

  async updateAvatar(id: number, avatarPath: string) {
    const user = await this.findOne(id);
    if (!user) return null;
    user.avatar = avatarPath;
    return this.usersRepository.save(user);
  }

  async remove(id: number, currentUser?: any) {
    const user = await this.findOne(id);
    if (!user) return null;

    if (currentUser && currentUser.permission_level === 'manager') {
      if (user.role === 'admin' || (user.role_item && user.role_item.permission_level === 'admin')) {
        throw new ForbiddenException('Quản lý không được phép xóa tài khoản Quản trị viên');
      }
    }

    return this.usersRepository.delete(id);
  }

  // ---------- Document Methods ----------

  async getMyDocuments(userId: number) {
    return this.documentRepository.find({
      where: { user: { id: userId } },
      order: { uploaded_at: 'DESC' },
    });
  }

  async addDocument(userId: number, file: Express.Multer.File, type: DocumentType) {
    const user = await this.findOne(userId);
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');

    const doc = this.documentRepository.create({
      user,
      filename: file.filename,
      original_name: file.originalname,
      type: type || DocumentType.KHAC,
    });
    return this.documentRepository.save(doc);
  }

  async addTextDocument(userId: number, name: string, content: string, type: DocumentType) {
    const user = await this.findOne(userId);
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');

    const doc = this.documentRepository.create({
      user,
      filename: content,
      original_name: name,
      type: type || DocumentType.KHAC,
    });
    return this.documentRepository.save(doc);
  }

  async deleteMyDocument(userId: number, docId: number) {
    const doc = await this.documentRepository.findOne({
      where: { id: docId, user: { id: userId } },
    });
    if (!doc) throw new NotFoundException('Tài liệu không tồn tại hoặc không thuộc về người dùng này');
    await this.documentRepository.delete(docId);
    return { message: 'Xóa tài liệu thành công', filename: doc.filename };
  }

  // ---------- Contract / Salary Config ----------

  async getMyContract(userId: number) {
    const config = await this.salaryConfigRepository.findOne({
      where: { user_id: userId },
    });
    return config || null;
  }

  // ---------- History Methods ----------

  async getProfileHistory(userId: number) {
    return this.historyRepository.find({
      where: { user: { id: userId } },
      relations: ['admin'],
      order: { created_at: 'DESC' },
    });
  }

  async getAllProfileHistory() {
    return this.historyRepository.find({
      relations: ['admin', 'user'],
      order: { created_at: 'DESC' },
    });
  }

  // ---------- Export Excel ----------
  async exportToExcel() {
    const users = await this.usersRepository.find({ relations: ['department', 'role_item'] });
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Danh sách nhân sự');

    worksheet.columns = [
      { header: 'Mã NV', key: 'code', width: 10 },
      { header: 'Họ và tên', key: 'fullName', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'SĐT', key: 'phone', width: 15 },
      { header: 'Giới tính', key: 'gender', width: 10 },
      { header: 'Ngày sinh', key: 'birth_date', width: 15 },
      { header: 'Phòng ban', key: 'department', width: 25 },
      { header: 'Chức vụ', key: 'role', width: 25 },
      { header: 'Ngày vào làm', key: 'join_date', width: 15 },
      { header: 'Loại HĐ', key: 'contract_type', width: 15 },
      { header: 'CCCD', key: 'citizen_id', width: 20 },
      { header: 'Địa chỉ', key: 'address', width: 30 },
      { header: 'Trạng thái', key: 'status', width: 15 },
    ];

    // Styling headers
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '003087' } };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    users.forEach(u => {
      worksheet.addRow({
        code: `NV${u.id.toString().padStart(3, '0')}`,
        fullName: `${u.first_name} ${u.last_name}`,
        email: u.email,
        phone: u.phone || '',
        gender: u.gender || '',
        birth_date: u.birth_date ? new Date(u.birth_date).toLocaleDateString() : '',
        department: u.department?.name || '',
        role: u.role_item?.role_name || 'Nhân viên',
        join_date: u.join_date ? new Date(u.join_date).toLocaleDateString() : '',
        contract_type: u.contract_type || '',
        citizen_id: u.citizen_id || '',
        address: u.address || '',
        status: u.is_active ? 'Đang làm việc' : 'Đã nghỉ việc',
      });
    });

    return await workbook.xlsx.writeBuffer();
  }
}
