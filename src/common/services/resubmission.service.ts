import { Injectable, Logger } from '@nestjs/common';
import { Model, Document } from 'mongoose';
import { ResubmittableDocument } from 'src/idcard/dto/update-idcard.dto';

@Injectable()
export class ResubmissionService {
  private readonly logger = new Logger(ResubmissionService.name);
  private readonly MAX_RESUBMISSIONS = 3;

  /**
   * Generic method to handle resubmission for any document type
   * @param model The Mongoose model to query
   * @param id The document ID
   * @param updatedData The updated data to apply
   * @param documentType Type of document (for logging)
   * @returns The updated document
   */
  async resubmitRequest<T extends Document & ResubmittableDocument>(
    model: Model<T>,
    id: string,
    updatedData: any,
    documentType: string,
  ): Promise<T> {
    try {
      // Find the request
      const request = await model.findById(id);

      if (!request) {
        throw new Error(`${documentType} request with ID ${id} not found.`);
      }

      // Validate request status
      if (request.status !== 'Rejected') {
        throw new Error(
          `Only rejected ${documentType} requests can be resubmitted.`,
        );
      }

      // Check if resubmission is allowed
      if (!request.resubmissionAllowed) {
        throw new Error(
          `This ${documentType} request is not eligible for resubmission.`,
        );
      }

      // Check resubmission attempts
      const currentAttempts = request.resubmissionAttempts || 0;
      if (currentAttempts >= this.MAX_RESUBMISSIONS) {
        throw new Error(
          `Maximum resubmission attempts (${this.MAX_RESUBMISSIONS}) reached for this ${documentType} request.`,
        );
      }

      // Log the resubmission attempt
      this.logger.log(
        `Resubmitting ${documentType} request ${id}. Attempt ${currentAttempts + 1}/${this.MAX_RESUBMISSIONS}`,
      );

      // Update the request
      const updatedRequest = await model.findByIdAndUpdate(
        id,
        {
          ...updatedData,
          status: 'Pending',
          rejectionReason: null,
          resubmissionAllowed: false, // Will be set to true again if rejected
          $inc: { resubmissionAttempts: 1 },
          lastResubmittedAt: new Date(),
        },
        { new: true, runValidators: true },
      );

      this.logger.log(`Successfully resubmitted ${documentType} request ${id}`);
      return updatedRequest;
    } catch (error) {
      this.logger.error(
        `Failed to resubmit ${documentType} request ${id}: ${error.message}`,
      );
      throw error;
    }
  }
}
