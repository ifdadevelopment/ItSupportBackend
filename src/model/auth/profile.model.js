import mongoose from "mongoose";

const ProfileSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      trim: true,
      match: [/^\d{10}$/, "Please enter a valid 10-digit phone number"],
    },
    department: {
      type: String,
      required: true,
      enum: [
        "IT",
        "HR",
        "Finance",
        "Marketing",
        "Sales",
        "Operations",
        "Customer Service",
        "Research & Development",
        "Other"
      ],
    },
    avatar: {
      type: String,
    },
    address: {
      type: String,
      trim: true,
    },
    preferences: {
      language: { type: String, enum: ["en", "hi"], default: "en" },
      theme: { type: String, enum: ["light", "dark", "auto"], default: "light" },
      notifications: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
      },
    },
  },
  { timestamps: true }
);

const ProfileModel = mongoose.model("Profile", ProfileSchema);

export default ProfileModel;
