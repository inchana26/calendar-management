import {
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateDiscussionPostDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  communityId?: string;

  @IsOptional()
  @IsString()
  scopeId?: string;

  @IsOptional()
  @IsString()
  scopeLabel?: string;

  @IsOptional()
  @IsString()
  attachment?: string;

  @IsOptional()
  @IsString()
  resourceUrl?: string;
}
