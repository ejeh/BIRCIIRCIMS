import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { Express } from 'express';

export interface FileSizeValidationOptions {
  [fieldName: string]: {
    maxSize: number; // in bytes
  };
}

@Injectable()
export class FileSizeValidationPipe implements PipeTransform {
  constructor(private readonly options: FileSizeValidationOptions) {}

  transform(
    value: Express.Multer.File | Express.Multer.File[],
    metadata: ArgumentMetadata,
  ) {
    // --- KEY FIX IS HERE ---
    // Normalize the input into an array, just like in the quality pipe.
    let filesToProcess: Express.Multer.File[] = [];

    if (Array.isArray(value)) {
      // Case 1: An array of files was received.
      filesToProcess = value;
    } else if (value && typeof value === 'object' && value.fieldname) {
      // Case 2: A single file object was received.
      filesToProcess = [value];
    }

    // If there are no files to process (e.g., empty request), just return.
    if (filesToProcess.length === 0) {
      return value;
    }

    // Now, iterate over the normalized array safely.
    for (const file of filesToProcess) {
      const fieldRule = this.options[file.fieldname];
      if (fieldRule && file.size > fieldRule.maxSize) {
        throw new BadRequestException(
          `File '${file.fieldname}' exceeds the maximum size of ${fieldRule.maxSize / (1024 * 1024)}MB.`,
        );
      }
    }

    // Return the original, unmodified value
    return value;
  }
}

// src/common/pipes/file-size-validation.pipe.ts

// import {
//   PipeTransform,
//   Injectable,
//   ArgumentMetadata,
//   BadRequestException,
// } from '@nestjs/common';
// import { Express } from 'express';

// export interface FileSizeValidationOptions {
//   // Separate rules map so non-rule properties don't need to match the index signature.
//   rules?: {
//     [fieldName: string]: {
//       maxSize: number; // in bytes
//     };
//   };
//   // This is a separate property, not part of the rules map.
//   documentTypeToUpdate?: 'idCard' | 'birthCertificate' | 'passportPhoto';
// }

// @Injectable()
// export class FileSizeValidationPipe implements PipeTransform {
// --- 3. UPDATE CONSTRUCTOR TO ACCEPT OPTIONS ---
//   constructor(private readonly options: FileSizeValidationOptions) {}

//   transform(
//     value: Express.Multer.File | Express.Multer.File[],
//     metadata: ArgumentMetadata,
//   ) {
//     // --- 4. UPDATE LOGIC TO USE THE NEW PROPERTY ---
//     let filesToProcess: Express.Multer.File[] = [];

//     if (Array.isArray(value)) {
//       filesToProcess = value;
//     } else if (typeof value === 'object' && value.fieldname) {
//       filesToProcess = [value];
//     }
//     // Get the field name we should validate from the options
//     const fieldNameToValidate = this.options.documentTypeToUpdate;

//     if (filesToProcess.length === 0) {
//       return value; // No files, nothing to validate
//     }

//     // If we don't have a field name to validate, just check all of them.
//     if (!fieldNameToValidate) {
//       for (const file of filesToProcess) {
//         const fieldRule = this.options.rules?.[file.fieldname];
//         if (fieldRule && file.size > fieldRule.maxSize) {
//           throw new BadRequestException(
//             `File '${file.fieldname}' exceeds the maximum size of ${fieldRule.maxSize / (1024 * 1024)}MB.`,
//           );
//         }
//       }
//     } else {
//       // If we DO have a field name, only validate that specific file.
//       const fileToValidate = filesToProcess.find(
//         (file) => file.fieldname === fieldNameToValidate,
//       );
//       const fieldRule = this.options.rules?.[fieldNameToValidate];

//       if (!fileToValidate || !fieldRule) {
//         // This case shouldn't happen if frontend is correct, but it's a good safeguard.
//         throw new BadRequestException(
//           `Could not validate file for field '${fieldNameToValidate}'.`,
//         );
//       }

//       if (fileToValidate.size > fieldRule.maxSize) {
//         throw new BadRequestException(
//           `File '${fieldNameToValidate}' exceeds the maximum size of ${fieldRule.maxSize / (1024 * 1024)}MB.`,
//         );
//       }
//     }

//     // Return the original value for the next pipe
//     return value;
//   }
// }
