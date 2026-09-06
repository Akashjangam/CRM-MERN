import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: [true, "Customer is required"],
    },
    case: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Case",
      default: null,
    },
    type: {
      type: String,
      enum: ["call", "email", "meeting", "note", "follow-up"],
      required: [true, "Activity type is required"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const Activity = mongoose.model("Activity", activitySchema);
export default Activity;
