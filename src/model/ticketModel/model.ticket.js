import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid"; // For unique ticket IDs

const ticketSchema = new mongoose.Schema(
  {
    ticketId: {
      type: String,
      unique: true,
      required: true,
      default: () => `TKT-${uuidv4().slice(0, 8).toUpperCase()}`
    },
    title: {
      type: String,
      required: [true, "Ticket title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"]
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"]
    },
    pc: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ItInventory"
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: [
        "Hardware Issue",
        "Software Issue",
        "Network Issue",
        "Printer Issue",
        "Email Issue",
        "Password Reset",
        "New Equipment Request",
        "Software Installation",
        "Other"
      ]
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Urgent"],
      default: "Medium"
    },
    status: {
      type: String,
      enum: ["open", "in-progress", "resolved", "closed"],
      default: "open"
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Requested by user is required"]
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    location: {
      type: String,
      trim: true,
      maxlength: [100, "Location cannot exceed 100 characters"]
    },
    sublocation: {
      type: String,
      trim: true,
      maxlength: [100, "Location cannot exceed 100 characters"]
    },
    dueDate: Date,
    resolvedDate: Date,
    closedDate: Date,
    estimatedHours: {
      type: Number,
      min: [0, "Estimated hours cannot be negative"]
    },
    actualHours: {
      type: Number,
      min: [0, "Actual hours cannot be negative"]
    },
    resolution: {
      type: String,
      trim: true,
      maxlength: [1000, "Resolution cannot exceed 1000 characters"]
    },
    attachments: [{ url: String }],
    comments: [
      {
        author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        content: { type: String, required: true, trim: true, maxlength: 1000 },
        isInternal: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now }
      }
    ],
    relatedInventory: [{ type: mongoose.Schema.Types.ObjectId, ref: "Inventory" }],
    tags: [{ type: String, trim: true }],
    satisfaction: {
      rating: { type: Number, min: 1, max: 5 },
      feedback: { type: String, trim: true },
      submittedAt: Date
    },
    isActive: { type: Boolean, default: true }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

/* ---------- VIRTUALS ---------- */
ticketSchema.virtual("responseTime").get(function () {
  if (!this.assignedTo || this.status === "open") return null;
  const firstResponse = this.comments.length > 0 ? this.comments[0].createdAt : this.updatedAt;
  return Math.floor((firstResponse - this.createdAt) / (1000 * 60 * 60));
});

ticketSchema.virtual("resolutionTime").get(function () {
  if (!this.resolvedDate) return null;
  return Math.floor((this.resolvedDate - this.createdAt) / (1000 * 60 * 60));
});

ticketSchema.virtual("isOverdue").get(function () {
  if (!this.dueDate || ["closed", "resolved"].includes(this.status)) return false;
  return new Date() > this.dueDate;
});

ticketSchema.virtual("priorityScore").get(function () {
  const scores = { low: 1, medium: 2, high: 3, urgent: 4 };
  return scores[this.priority] || 1;
});

/* ---------- INDEXES ---------- */
// ticketSchema.index({ ticketId: 1 });
ticketSchema.index({ status: 1, priority: 1 });
ticketSchema.index({ requestedBy: 1 });
ticketSchema.index({ assignedTo: 1 });
ticketSchema.index({ category: 1 });
ticketSchema.index({ createdAt: -1 });
ticketSchema.index({ dueDate: 1 });
ticketSchema.index({ title: "text", description: "text" });

/* ---------- MIDDLEWARE ---------- */
ticketSchema.pre("save", function (next) {
  if (this.isModified("status")) {
    if (this.status === "resolved" && !this.resolvedDate) {
      this.resolvedDate = new Date();
    }
    if (this.status === "closed" && !this.closedDate) {
      this.closedDate = new Date();
    }
  }

  // Auto set dueDate based on priority
  if (!this.dueDate && this.isNew) {
    const now = new Date();
    const daysToAdd = { urgent: 1, high: 3, medium: 7, low: 14 };
    this.dueDate = new Date(now.setDate(now.getDate() + daysToAdd[this.priority]));
  }
  next();
});

/* ---------- STATICS ---------- */
ticketSchema.statics.getByStatus = function (status) {
  return this.find({ status, isActive: true }).populate("requestedBy assignedTo");
};

ticketSchema.statics.getByPriority = function (priority) {
  return this.find({ priority, isActive: true }).populate("requestedBy assignedTo");
};

ticketSchema.statics.getOverdueTickets = function () {
  return this.find({
    dueDate: { $lt: new Date() },
    status: { $nin: ["resolved", "closed"] },
    isActive: true
  }).populate("requestedBy assignedTo");
};

ticketSchema.statics.getTicketStats = function () {
  return this.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: "$status", count: { $sum: 1 } } }
  ]);
};

ticketSchema.statics.getTicketTrends = function (days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.aggregate([
    { $match: { createdAt: { $gte: startDate }, isActive: true } },
    {
      $group: {
        _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" }, day: { $dayOfMonth: "$createdAt" } },
        count: { $sum: 1 }
      }
    },
    { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
  ]);
};

/* ---------- METHODS ---------- */
ticketSchema.methods.addComment = function (authorId, content, isInternal = false) {
  this.comments.push({ author: authorId, content, isInternal });
  return this.save();
};

ticketSchema.methods.assignTo = function (userId) {
  this.assignedTo = userId;
  if (this.status === "open") this.status = "in-progress";
  return this.save();
};

ticketSchema.methods.resolve = function (resolution) {
  this.status = "resolved";
  this.resolution = resolution;
  this.resolvedDate = new Date();
  return this.save();
};

ticketSchema.methods.close = function () {
  this.status = "closed";
  this.closedDate = new Date();
  return this.save();
};

const Ticket = mongoose.model("Ticket", ticketSchema);
export default Ticket;
