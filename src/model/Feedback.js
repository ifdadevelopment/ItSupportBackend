import mongoose from "mongoose";

const FeedbackSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },

    email: { type: String, required: true },

    phone: {
      type: String,
      required: true,
      minlength: [10, "Phone number must be at least 10 digits"],
      maxlength: [10, "Phone number cannot exceed 10 digits"],
      validate: {
        validator: (v) => /^\d{10}$/.test(v),
        message: "Phone number must be exactly 10 digits",
      },
    },

    message: { type: String, required: true },

    rating: { type: Number, default: 0 },

    type: { type: String, default: "General" },

    attachments: [{ url: String }],

    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.model("Feedback", FeedbackSchema);
