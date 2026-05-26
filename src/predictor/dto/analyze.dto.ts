import { IsString, IsNumber, IsOptional, Min, IsIn } from 'class-validator';

export class AnalyzeDto {
  @IsIn(['JEE Main', 'JEE Advanced'])
  examType: string;

  @IsNumber()
  @Min(1)
  rank: number;

  @IsString()
  category: string;

  @IsString()
  gender: string;

  @IsString()
  homeState: string;

  @IsString()
  target_branch: string;

  @IsString()
  target_college: string;
}