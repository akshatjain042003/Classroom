import { IsNumber, IsOptional, IsString } from 'class-validator';
import { User } from 'src/users/entities/user.entity';

export class CreateWhiteboardDto {
  @IsString()
  title: string;

  @IsString()
  backgroundcolor: string;

  @IsNumber()
  @IsOptional()
  userid: User;
}
