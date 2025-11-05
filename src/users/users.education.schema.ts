import { Schema, Document } from 'mongoose';
import { Prop, SchemaFactory, Schema as NestSchema } from '@nestjs/mongoose';

@NestSchema()
export class SchoolInfo extends Document {
  @Prop({ required: false })
  name: string;

  @Prop({ required: false })
  address: string;

  @Prop({ required: false })
  yearOfAttendance: string;
}

export const SchoolInfoSchema = SchemaFactory.createForClass(SchoolInfo);

@NestSchema()
export class TertiaryInfo extends Document {
  @Prop({ required: false })
  name: string;

  @Prop({ required: false })
  address: string;

  @Prop({ required: false })
  certificateObtained: string;

  @Prop({ required: false })
  matricNo: string;

  @Prop({ required: false })
  yearOfAttendance: string;
}

export const TertiaryInfoSchema = SchemaFactory.createForClass(TertiaryInfo);

@NestSchema()
// export class EducationalHistory extends Document {
//   @Prop({ type: SchoolInfoSchema, required: false })
//   primarySchool: SchoolInfo;

//   @Prop({ type: SchoolInfoSchema, required: false })
//   secondarySchool: SchoolInfo;

//   @Prop({ type: [TertiaryInfoSchema], required: false })
//   tertiaryInstitutions: TertiaryInfo[];
// }
export class EducationalHistory extends Document {
  @Prop({ type: String, required: false })
  institution: string;

  @Prop({ type: String, required: false })
  qualification: string;

  @Prop({ type: Date, required: false })
  startDate: Date;

  @Prop({ type: Date, required: false })
  endDate: Date;
}

export const EducationalHistorySchema =
  SchemaFactory.createForClass(EducationalHistory);
