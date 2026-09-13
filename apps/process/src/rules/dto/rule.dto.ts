import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { RuleOperator } from '../../common/types';

export class CreateRuleDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  eventName!: string;

  @IsEnum(RuleOperator)
  operator!: RuleOperator;

  @IsNumber()
  threshold!: number;
}

export class UpdateRuleDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  eventName?: string;

  @IsOptional()
  @IsEnum(RuleOperator)
  operator?: RuleOperator;

  @IsOptional()
  @IsNumber()
  threshold?: number;
}
