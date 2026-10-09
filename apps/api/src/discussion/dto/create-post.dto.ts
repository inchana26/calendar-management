import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class DiscussionPollOptionDto {
  @IsString()
  @IsNotEmpty()
  text!: string;
}

export class DiscussionPollDto {
  @IsBoolean()
  multiple!: boolean;

  @IsBoolean()
  showResultsAfterVote!: boolean;

  @IsBoolean()
  allowComments!: boolean;

  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => DiscussionPollOptionDto)
  options!: DiscussionPollOptionDto[];
}

export class CreateDiscussionPostDto {
  @IsString()
  @IsIn([
    'QUESTION',
    'DISCUSSION',
    'POLL',
    'RESOURCE',
  ])
  type!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  content!: string;

  // Stored directly in DiscussionPost.
  // There is no DiscussionCommunity table lookup anymore.
  @IsString()
  @IsNotEmpty()
  communityId!: string;

  @IsString()
  @IsNotEmpty()
  communityName!: string;

  // Stored directly in DiscussionPost.
  // There is no DiscussionScope table lookup anymore.
  @IsString()
  @IsNotEmpty()
  scopeId!: string;

  @IsString()
  @IsNotEmpty()
  scopeLabel!: string;

  // Stored directly as PostgreSQL String[] in DiscussionPost.
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  attachment?: string;

  @IsOptional()
  @IsString()
  resourceUrl?: string;

  // Poll options/config are stored directly in DiscussionPost.
  @IsOptional()
  @ValidateNested()
  @Type(() => DiscussionPollDto)
  poll?: DiscussionPollDto;
}
