import mongoose from "mongoose";
const InventoryItemKeySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
 
}, {
  timestamps: true
});

export const ItInventoryItemKey = mongoose.model("InventoryItemKey", InventoryItemKeySchema);

const InventoryItemsSchema = new mongoose.Schema({
  itemKey : {
    type : mongoose.Schema.Types.ObjectId,
    ref : 'InventoryItemKey',
    required : true
  },
  price : { type : Number, required: true }, 
  quantity : { type : Number, required: true }, 
  addedBy : { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt : { type: Date, default: Date.now },
   usageHistory : [
    {
      inventoryId: { type: mongoose.Schema.Types.ObjectId, ref: "ItInventory" },
      qty: { type: Number, required: true },
      usedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      date: { type: Date, default: Date.now },
    }
  ]
}, { timestamps: true });

InventoryItemsSchema.virtual('totalAmount').get(function () {
  return this.price * this.quantity;
});


InventoryItemsSchema.methods.addUsageHistory = async function ({
  inventoryId,
  qty,
  usedBy,
}) {
  if (!qty || qty <= 0) {
    throw new Error("Quantity must be greater than 0");
  }

  if (this.quantity < qty) {
    throw new Error("Not enough stock available");
  }

  // decrease stock
  this.quantity -= qty;

  // add entry
  this.usageHistory.push({
    inventoryId,
    qty,
    usedBy,
    date: new Date(),
  });

  return await this.save();
};

// Include virtuals in JSON output
InventoryItemsSchema.set('toJSON', { virtuals: true });

const InventoryItem = mongoose.model('InventoryItem', InventoryItemsSchema);
export default InventoryItem;
