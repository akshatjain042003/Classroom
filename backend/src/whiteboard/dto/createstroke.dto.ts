import {
  IsDecimal,
  IsJSON,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { User } from 'src/users/entities/user.entity';

export class CreateStroke {
  @IsJSON()
  points: object;

  @IsString()
  color: string;

  @IsDecimal()
  opacity: number;

  @IsNumber()
  thickness: number;

  @IsOptional()
  @IsNumber()
  userid: number;

  @IsOptional()
  @IsNumber()
  boardid: number;
}
