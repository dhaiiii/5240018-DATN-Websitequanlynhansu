// import { PartialType } from '@nestjs/mapped-types'; // Note: Usually mapped-types is installed, or we can use local extension if not. Since it's standard NestJS, I'll assume mapped-types is available or use manual partial.
// Actually, let's check checking if mapped-types is common, if not I'll just extend manually or import from swagger if present.
// Safest bet without checking package.json again for mapped-types (which often comes with nestjs/cli schematics but maybe not in runtime):
// I will just redefine for now to be safe, or use class-validator partial. 
// Wait, @nestjs/mapped-types is a separate package. I'll invoke npm install for it just in case or just code it out.
// Let's implement manually to avoid extra installs if not needed, but PartialType is best practice.
// Let's verify package.json content from memory... I didn't see mapped-types in the cached file view. I'll just write it as a class using standard validation.

import { IsString, IsOptional } from 'class-validator';

export class UpdateRoleDto {
    @IsOptional()
    @IsString()
    role_name?: string;

    @IsOptional()
    @IsString()
    description?: string;
}
