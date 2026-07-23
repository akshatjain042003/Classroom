import { ConsoleLogger, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { log } from 'console';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usermodel: Repository<User>,
  ) {}
  async findOne(username: string): Promise<User | undefined> {
    const user =
      (await this.usermodel.findOne({
        where: [{ email: username }, { username: username }],
      })) ?? undefined;
    return user;
  }

  async findById(id: number): Promise<User | null> {
    return this.usermodel.findOne({
      where: { id: id },
    });
  }

  async updateRefreshToken(
    userid: number | any,
    refreshToken: string | null,
  ) {
    console.log('userid', userid, refreshToken);
    const update = await this.usermodel.update(
      { id: userid },
      { accesstoken: refreshToken },
    );
    console.log(update);
  }

  async findOrCreateOAuthUser(data: {
    googleid: string;
    email: string;
    firstname: string;
    picture?: string;
  }): Promise<User> {
    let user = await this.usermodel.findOne({
      where: { googleid: data.googleid },
    });

    if (user) {
      return user;
    }

    user = await this.usermodel.findOne({
      where: { email: data.email },
    });

    if (user) {
      user.googleid = data.googleid;
      user.picture = data?.picture;
      return this.usermodel.save(user);
    }
    const firstname = data?.firstname.split(' ')[0];
    const lastname = data?.firstname.split(' ')[1];
    const newuser = this.usermodel.create({
      googleid: data.googleid,
      email: data.email,
      firstname: firstname,
      lastname: lastname,
      picture: data.picture,
      password: null,
    });

    return await this.usermodel.save(newuser);
  }

  async getprofile(userid: number) {
    console.log('=====', userid);
    const userdata = await this.usermodel
      .createQueryBuilder('users')
      .select([
        'users.firstname',
        'users.lastname',
        'users.email',
        'users.picture',
        'users.username',
        'boards.boardid',
        'boards.title',
        'boards.createdat',
      ])
      .leftJoin('users.boards', 'boards')
      .where('users.id=:id', { id: userid })
      .getOne();
    console.log('=====', userdata);
    return userdata;
  }

  async createuser(data: Partial<User>): Promise<User> {
    const user = this.usermodel.create(data);
    return this.usermodel.save(user);
  }
}
