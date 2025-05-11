import { ArgumentMetadata, PipeTransform } from '@nestjs/common';
export declare class ParseJSONPipe implements PipeTransform {
    transform(value: any, metadata: ArgumentMetadata): any;
}
