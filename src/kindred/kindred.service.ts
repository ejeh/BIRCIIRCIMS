import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Kindred } from './kindred.schema';
import { Model } from 'mongoose';
import { SigUpKindredDto } from './kindredDto';
import {
  EmailAlreadyUsedException,
  PhoneAlreadyUsedException,
} from 'src/common/exception';

@Injectable()
export class KindredService {
  constructor(
    @InjectModel('Kindred')
    private readonly kindredModel: Model<Kindred>,
  ) {}

  // async createKindred(data: SigUpKindredDto) {
  //   try {
  //     const kindred = await this.kindredModel.create(data);
  //     return kindred;
  //   } catch (error) {
  //     throw PhoneAlreadyUsedException();
  //   }
  // }

  createKindred = async (payload: {
    userId: string;
    firstname: string;
    lastname: string;
    phone: number;
    kindred: string;
    lga: string;
    stateOfOrigin: string;
    email: string;
    address: string;
  }): Promise<any> => {
    // check if email already exists
    const emailExists = await this.kindredModel.findOne({
      email: payload.email,
    });
    if (emailExists) {
      throw new HttpException('Email already exists', HttpStatus.BAD_REQUEST);
    }

    // check if phone already exists
    const phoneExists = await this.kindredModel.findOne({
      phone: payload.phone,
    });
    if (phoneExists) {
      throw new HttpException(
        'Phone number already exists',
        HttpStatus.BAD_REQUEST,
      );
    }

    // check if kindred already exists
    const kindredExists = await this.kindredModel.findOne({
      kindred: payload.kindred,
    });
    if (kindredExists) {
      throw new HttpException('Kindred already exists', HttpStatus.BAD_REQUEST);
    }

    return this.kindredModel.create({
      ...payload,
    });
  };

  async getPaginatedData(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const data = await this.kindredModel.find().skip(skip).limit(limit).exec();
    const totalCount = await this.kindredModel.countDocuments().exec();
    return {
      data,
      hasNextPage: skip + limit < totalCount,
    };
  }

  async getkindredHeads(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const data = await this.kindredModel
      .find({ userId })
      .skip(skip)
      .limit(limit)
      .exec();

    // Count total documents for this user
    const totalCount = await this.kindredModel
      .countDocuments({ userId })
      .exec();
    return {
      data,
      hasNextPage: skip + limit < totalCount,
    };
  }

  async updateKindred(id: string, updatedData: any): Promise<any> {
    const kindred = await this.kindredModel.findByIdAndUpdate(id, updatedData, {
      new: true,
    });

    try {
      if (!kindred) {
        throw new HttpException('Kindred not found', HttpStatus.NOT_FOUND);
      }
      return kindred;
    } catch (error) {
      throw new HttpException(
        error.message || 'An error occurred while updating the profile',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  // Delete Kindred
  deleteItem = async (item_id: string): Promise<any> => {
    return await this.kindredModel.deleteOne({ _id: item_id });
  };
}
