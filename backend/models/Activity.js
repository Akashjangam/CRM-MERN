import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: {
        values: ["call", "email", "meeting", "note", "follow-up"],
        message: "Invalid activity type",
      },
      required: [true, "Activity type is required"],
    },

    description: {
      type: String,
      required: [true, "Activity description is required"],
      trim: true,
      minlength: [2, "Activity description must be at least 2 characters"],
      maxlength: [5000, "Activity description cannot exceed 5000 characters"],
    },

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: [true, "Customer is required"],
      index: true,
    },

    case: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Case",
      default: null,
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Activity creator is required"],
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

activitySchema.index({
  description: "text",
});

const Activity = mongoose.model("Activity", activitySchema);

export default Activity;
