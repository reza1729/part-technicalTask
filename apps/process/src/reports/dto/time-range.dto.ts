import {
  IsDateString,
  IsNotEmpty,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'MaxOneDayRange', async: false })
export class MaxOneDayRangeConstraint implements ValidatorConstraintInterface {
  validate(_: unknown, args: ValidationArguments): boolean {
    const obj = args.object as TimeRangeQueryDto;
    if (!obj.from || !obj.to) {
      return false;
    }
    const from = new Date(obj.from).getTime();
    const to = new Date(obj.to).getTime();
    if (Number.isNaN(from) || Number.isNaN(to) || to < from) {
      return false;
    }
    const maxMs = 24 * 60 * 60 * 1000;
    return to - from <= maxMs;
  }

  defaultMessage(): string {
    return 'Time range must be valid and at most 24 hours (from <= to)';
  }
}

export class TimeRangeQueryDto {
  @IsDateString()
  @IsNotEmpty()
  from!: string;

  @IsDateString()
  @IsNotEmpty()
  @Validate(MaxOneDayRangeConstraint)
  to!: string;
}
