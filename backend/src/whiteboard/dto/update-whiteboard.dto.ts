import { PartialType } from '@nestjs/mapped-types';
import { CreateWhiteboardDto } from './create-whiteboard.dto';

export class UpdateWhiteboardDto extends PartialType(CreateWhiteboardDto) {}
