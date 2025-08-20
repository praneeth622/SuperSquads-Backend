import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { ZodSchema, ZodError } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown, metadata: ArgumentMetadata) {
    try {
      const parsedValue = this.schema.parse(value);
      return parsedValue;
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
          code: issue.code,
        }));

        throw new BadRequestException({
          message: 'Validation failed',
          errors: errorMessages,
          statusCode: 422,
        });
      }

      throw new BadRequestException('Validation failed');
    }
  }
}

export const UsePipes = (schema: ZodSchema) => {
  return (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor,
  ) => {
    // This decorator will be used in controllers
    const originalMethod = descriptor.value;
    descriptor.value = function (...args: any[]) {
      // Validation logic here
      return originalMethod.apply(this, args);
    };
  };
};
