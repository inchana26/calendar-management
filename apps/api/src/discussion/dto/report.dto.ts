import {
  IsIn,
  IsOptional,
  IsString,
} from 'class-validator';

export class DiscussionReportDto {
  @IsString()
  @IsIn([
    'Spam',
    'Harassment',
    'Inappropriate Content',
    'Misinformation',
    'Off Topic',
    'Copyright',
    'Other',
  ])
  reason!: string;

  @IsOptional()
  @IsString()
  details?: string;

  @IsOptional()
  @IsString()
  replyId?: string;
}
