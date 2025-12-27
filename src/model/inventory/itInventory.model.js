import mongoose from "mongoose";

const itInventorySchema = new mongoose.Schema(
  {
    // Basic Info
    serialNo: { type: Number, index: true },
    manufactureBy: { type: String, required: true, trim: true },
    tagNoCpu: { type: String, uppercase: true },
    operatingSystem: { type: String, trim: true },
    ram: { type: String }, // "4GB", "6GB"
    storage: { type: String }, // "128SSD", "250HDD"
    processor: { type: String, trim: true },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      enum: [
        'Computers',
        'Display'
      ]
    },
    subCategoery: {
      type: String
    },
    brand: { type: String },
    model: { type: String },
    price: { type: Number },
    keyboard: { type: String },
    mouse: { type: String },
    displayTag: { type: String },
    keyboardTag: { type: String },
    mouseTag: { type: String },
    // Network & Location
    macAddress: { type: String, unique: true, sparse: true },
    mainLocation: {
      type: String,
      required: true,
      enum: ["Kalkaji G33", "Kalkaji H18", "Badarpur"]
    },
    location: { type: String, default: "Kalkaji G33" },
    department: { type: String },
    domain: { type: String },
    // Condition & Notes
    statusExplain: { type: String },
    condition: {
      type: String,
      enum: ["Good", "Fair", "Poor", "Damaged"],
      default: "Good",
    },
    software: [{ type: String }], // ["Microsoft Office", "VS Code"]
    description: {
      type: String,

    },
    // Extra Fields
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    purchaseDate: { type: Date },
    warrantyExpiry: { type: Date },
    status: {
      type: String,
      enum: ["available", "in-use", "repair", "retired"],
      default: "available",
    },
  },
  { timestamps: true }
);

//
//VIRTUALS
//
itInventorySchema.virtual("fullTag").get(function () {
  return `${this.tagNoCpu} (${this.macAddress || "No MAC"})`;
});

itInventorySchema.virtual("isUnderWarranty").get(function () {
  if (!this.warrantyExpiry) return false;
  return new Date() <= this.warrantyExpiry;
});

//
// PRE HOOKS
//
itInventorySchema.pre("save", function (next) {
  if (this.macAddress) {
    this.macAddress = this.macAddress.toUpperCase().trim();
  }
  if (this.tagNoCpu) {
    this.tagNoCpu = this.tagNoCpu.toUpperCase().trim();
  }
  next();
});

//
// INSTANCE METHODS
//
itInventorySchema.methods.isAvailable = function () {
  return this.status === "available" && !this.assignedTo;
};

itInventorySchema.methods.assignTo = function (userId) {
  this.assignedTo = userId;
  this.status = "in-use";
  return this.save();
};

itInventorySchema.methods.addTicketHistory = function (ticketId) {
  this.ticketHistory.push({ ticketId });
  return this.save();
};

itInventorySchema.methods.markForRepair = function () {
  this.status = "repair";
  return this.save();
};

//
// 🔹 STATIC METHODS
//
itInventorySchema.statics.findByTag = function (tagNoCpu) {
  return this.findOne({ tagNoCpu: tagNoCpu.toUpperCase().trim() });
};

itInventorySchema.statics.findByMac = function (mac) {
  return this.findOne({ macAddress: mac.toUpperCase().trim() });
};

const ItInventoryModel = mongoose.model("ItInventory", itInventorySchema);

export default ItInventoryModel;
