import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddGenderToUsers1738611600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'gender',
        type: 'enum',
        enum: ['Nam', 'Nữ', 'Khác'],
        default: "'Nam'",
        isNullable: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('users', 'gender');
  }
}
