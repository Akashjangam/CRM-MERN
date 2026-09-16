import mongoose from "mongoose";

const caseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Case title is required"],
      trim: true,
      minlength: [2, "Case title must be at least 2 characters"],
      maxlength: [200, "Case title cannot exceed 200 characters"],
    },

    description: {
      type: String,
      required: [true, "Case description is required"],
      trim: true,
      minlength: [2, "Case description must be at least 2 characters"],
      maxlength: [5000, "Case description cannot exceed 5000 characters"],
    },

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: [true, "Customer is required"],
      index: true,
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    priority: {
      type: String,
      enum: {
        values: ["Low", "Medium", "High", "Urgent"],
        message: "Priority must be Low, Medium, High, or Urgent",
      },
      default: "Medium",
      index: true,
    },

    status: {
      type: String,
      enum: {
        values: ["Open", "In Progress", "Resolved", "Closed"],
        message: "Status must be Open, In Progress, Resolved, or Closed",
      },
      default: "Open",
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Case creator is required"],
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

caseSchema.index({
  title: "text",
  description: "text",
});

const Case = mongoose.model("Case", caseSchema);

export default Case;
