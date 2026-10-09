import {
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateDiscussionReplyDto {
  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsOptional()
  @IsString()
  parentReplyId?: string;
}
