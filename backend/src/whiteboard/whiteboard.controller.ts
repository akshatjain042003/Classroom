import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { WhiteboardService } from './whiteboard.service';
import { CreateWhiteboardDto } from './dto/create-whiteboard.dto';
import { UpdateWhiteboardDto } from './dto/update-whiteboard.dto';
import { JwtAuthGaurd } from 'src/gaurds/auth.gaurd';
import { CreateStroke } from './dto/createstroke.dto';

@Controller('whiteboard')
export class WhiteboardController {
  constructor(private readonly whiteboardService: WhiteboardService) {}

  @Post()
  @UseGuards(JwtAuthGaurd)
  create(@Req() req, @Body() dto: CreateWhiteboardDto) {
    const { id } = req.user;
    const data = { ...dto, userid: id };
    console.log(data);
    return this.whiteboardService.create(data);
  }

  @Post(':boardid/stroke')
  @UseGuards(JwtAuthGaurd)
  createStroke(
    @Param('boardid') boardid: number,
    @Req() req,
    @Body() dto: CreateStroke,
  ) {
    const { id } = req.user;
    const data = { ...dto, boardid, userid: id };
    return this.whiteboardService.createStroke(data);
  }
  @Post(':boardid/stroke/bulk')
  @UseGuards(JwtAuthGaurd)
  createbulkstrokes(
    @Param('boardid') boardid:number,
    @Req() req,
    @Body() dto:{strokes:CreateStroke[]}
  ){
    console.log("=======",dto)
    const {id}=req.user;
    return this.whiteboardService.createBulkStrokes(boardid,id,dto.strokes);
  }



  @Get(':id')
  @UseGuards(JwtAuthGaurd)
  findOne(@Param('id') id: string) {
    return this.whiteboardService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateWhiteboardDto: UpdateWhiteboardDto,
  ) {
    return this.whiteboardService.update(+id, updateWhiteboardDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.whiteboardService.remove(+id);
  }
}
