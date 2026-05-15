import mongoose from 'mongoose';

const customizationGroupSchema = new mongoose.Schema(
  {
    restaurantPublicId: { type: String, required: true },
    groupName: { type: String, required: true },
    isRequired: { type: Boolean, default: false },
    options: [
      {
        label: { type: String, required: true },
        extraPrice: { type: Number, default: 0 },
        available: { type: Boolean, default: true }
      }
    ],
  },
  {
    timestamps: true,
    toJSON: { versionKey: false },
    toObject: { versionKey: false }
  }
);

customizationGroupSchema.index({ restaurantPublicId: 1 });
customizationGroupSchema.index({ restaurantPublicId: 1, groupName: 1 });

export default mongoose.model('CustomizationGroup', customizationGroupSchema, 'customization_groups');