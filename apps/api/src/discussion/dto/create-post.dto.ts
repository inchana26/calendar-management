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
  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => DiscussionPollOptionDto)
  options!: DiscussionPollOptionDto[];

  @IsBoolean()
  multiple!: boolean;

  @IsBoolean()
  showResultsAfterVote!: boolean;

  @IsBoolean()
  allowComments!: boolean;
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

  @IsString()
  @IsNotEmpty()
  communityId!: string;

  @IsString()
  @IsNotEmpty()
  communityName!: string;

  @IsString()
  @IsNotEmpty()
  scopeId!: string;

  @IsString()
  @IsNotEmpty()
  scopeLabel!: string;

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

  @IsOptional()
  @ValidateNested()
  @Type(() => DiscussionPollDto)
  poll?: DiscussionPollDto;
}
