import { OpenAPIObject } from '@nestjs/swagger';
type SwaggerBaseConfig = Omit<OpenAPIObject, 'paths'>;
export declare const setupSwaggerDocument: (path: string, config: SwaggerBaseConfig) => (module: any) => number;
export declare const setupSwaggerDocuments: (app: any) => void;
export {};
