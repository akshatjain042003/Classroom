import { Injectable } from '@nestjs/common';
import { CreateWhiteboardDto } from './dto/create-whiteboard.dto';
import { UpdateWhiteboardDto } from './dto/update-whiteboard.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Whiteboard } from './entities/whiteboard.entity';
import { Repository } from 'typeorm';
import { CreateStroke } from './dto/createstroke.dto';
import { Stroke } from './entities/stroke.entity';

@Injectable()
export class WhiteboardService {
  constructor(
    @InjectRepository(Whiteboard)
    private boardModel: Repository<Whiteboard>,

    @InjectRepository(Stroke)
    private stroke: Repository<Stroke>,
  ) { }
  async create(dto: CreateWhiteboardDto) {
    console.log(dto);
    const result = this.boardModel.create(dto);

    return await this.boardModel.save(result);
  }

  async createStroke(dto: CreateStroke) {
    console.log(dto);
    const data = this.stroke.create({
      ...dto,
      userid: { id: dto.userid },
      boardid: { boardid: dto.boardid },
    });
    return await this.stroke.save(data);
  }

  async createBulkStrokes(
    boardid: number,
    userid: number,
    strokes: CreateStroke[],
  ) {
    const strokeEntities = strokes.map((stroke) =>
      this.stroke.create({
        ...stroke,
        userid: { id: userid },
        boardid: { boardid: boardid },
      }),
    );
    await this.stroke.save(strokeEntities)
  }
  async findOne(id: number) {
    const boardsdata = await this.boardModel
      .createQueryBuilder('boards')
      .select([
        'boards.title',
        'boards.backgroundcolor',
        'boards.createdat',
        'user.firstname',
        'stroke.points',
        'stroke.color',
        'stroke.thickness',
      ])
      .leftJoin('boards.userid', 'user')
      .leftJoin('boards.stroke', 'stroke')
      // .where('users.id=:id', { id: userid })
      .where('boards.boardid=:boardid', { boardid: id })
      .getOne();
    return boardsdata;
  }

  update(id: number, updateWhiteboardDto: UpdateWhiteboardDto) {
    return `This action updates a #${id} whiteboard`;
  }

  remove(id: number) {
    return `This action removes a #${id} whiteboard`;
  }
}
