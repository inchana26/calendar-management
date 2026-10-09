import {
  IsIn,
  IsOptional,
  IsString,
} from 'class-validator';

export class DiscussionReactionDto {
  @IsString()
  @IsIn([
    '👍',
    '❤️',
    '👏',
    '💡',
    '🎉',
    '😂',
  ])
  reaction!: string;

  @IsOptional()
  @IsString()
  replyId?: string;
}
