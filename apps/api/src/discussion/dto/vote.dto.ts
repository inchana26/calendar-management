import {
  ArrayMinSize,
  IsArray,
  IsString,
} from 'class-validator';

export class DiscussionVoteDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  optionIds!: string[];
}
