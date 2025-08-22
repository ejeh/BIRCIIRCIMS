import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Lga } from './lga.schema';
import { CreateLgaDto } from './dto/create-lga.dto';
import { UpdateLgaDto } from './dto/update-lga.dto';

@Injectable()
export class LgaService {
  constructor(@InjectModel('Lga') private readonly lgaModel: Model<Lga>) {}

  // ✅ CREATE
  async create(createLgaDto: CreateLgaDto, userId: string): Promise<Lga> {
    // check if name already exists
    const existingByName = await this.lgaModel.findOne({
      name: new RegExp(`^${createLgaDto.name}$`, 'i'), // case-insensitive match
    });
    if (existingByName) {
      throw new BadRequestException(
        `LGA with name '${createLgaDto.name}' already exists`,
      );
    }

    // check if code already exists
    const existingByHqters = await this.lgaModel.findOne({
      headquaters: new RegExp(`^${createLgaDto.headquaters}$`, 'i'),
    });
    if (existingByHqters) {
      throw new BadRequestException(
        `LGA with headquaters '${createLgaDto.headquaters}' already exists`,
      );
    }

    // create new LGA if no conflicts
    const lga = new this.lgaModel({
      ...createLgaDto,
      createdBy: new Types.ObjectId(userId),
      createdAt: new Date(),
    });

    return lga.save();
  }

  // ✅ UPDATE
  async update(
    id: string,
    updateLgaDto: UpdateLgaDto,
    userId: string,
  ): Promise<Lga> {
    const lga = await this.lgaModel.findByIdAndUpdate(
      id,
      {
        ...updateLgaDto,
        updatedBy: new Types.ObjectId(userId),
        updatedAt: new Date(),
      },
      { new: true }, // return updated doc
    );

    if (!lga) {
      throw new NotFoundException(`LGA with ID ${id} not found`);
    }

    return lga;
  }

  // ✅ DELETE
  async remove(id: string, userId: string): Promise<{ message: string }> {
    const lga = await this.lgaModel.findByIdAndDelete(id);

    if (!lga) {
      throw new NotFoundException(`LGA with ID ${id} not found`);
    }

    return { message: `LGA '${lga.name}' deleted by user ${userId}` };
  }

  // ✅ GET ALL
  async getPaginatedData(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const data = await this.lgaModel.find().skip(skip).limit(limit).exec();
    const totalCount = await this.lgaModel.countDocuments().exec();
    return {
      data,
      hasNextPage: skip + limit < totalCount,
    };
  }
}
