import { IsEnum, IsOptional } from 'class-validator';
import { DocumentType } from '../entities/user-document.entity';

export class UploadDocumentDto {
    @IsEnum(DocumentType)
    @IsOptional()
    type?: DocumentType;
}
