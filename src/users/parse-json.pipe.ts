import {
  ArgumentMetadata,
  Injectable,
  PipeTransform,
  BadRequestException,
} from '@nestjs/common';

@Injectable()
export class ParseJSONPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (!value || typeof value !== 'object') return value;

    const parsedValue = { ...value };
    const jsonFields = [
      'nextOfKin',
      'education',
      'occupation',
      'healthInfo',
      'business',
      'neighbor',
      'family',
    ];

    for (const field of jsonFields) {
      if (typeof parsedValue[field] === 'string') {
        try {
          parsedValue[field] = JSON.parse(parsedValue[field]);
        } catch (e) {
          throw new BadRequestException(
            `Invalid JSON format for field "${field}"`,
          );
        }
      }
    }

    return parsedValue;
  }
}
