import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './entities/user.entity';
import { Role } from './enums/role.enum';

interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role?: Role;
}

@Injectable()
export class UsersService {
  private readonly SALT_ROUNDS = 10;

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async create(input: CreateUserInput): Promise<UserDocument> {
    const email = input.email.toLowerCase();

    const exists = await this.userModel.findOne({ email }).exec();
    if (exists) throw new ConflictException('Email already exists');

    const hashedPassword = await bcrypt.hash(input.password, this.SALT_ROUNDS);

    return this.userModel.create({
      ...input,
      email,
      password: hashedPassword,
    });
  }

  findByEmail(email: string) {
    return this.userModel
      .findOne({ email: email.toLowerCase() })
      .select('+password')
      .exec();
  }

  findById(id: string) {
    return this.userModel.findById(id).exec();
  }
}