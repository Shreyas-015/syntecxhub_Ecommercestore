import mongoose, { Schema, Document } from "mongoose";

export interface IProcessedEvent extends Document {
  eventId: string;
  provider: string;
  processedAt: Date;
}

const ProcessedEventSchema = new Schema<IProcessedEvent>(
  {
    eventId: { type: String, required: true, unique: true, index: true },
    provider: { type: String, required: true },
    processedAt: { type: Date, default: Date.now, expires: 604800 } // Auto-expire after 7 days
  },
  {
    timestamps: true
  }
);

export const ProcessedEvent = mongoose.model<IProcessedEvent>("ProcessedEvent", ProcessedEventSchema);
