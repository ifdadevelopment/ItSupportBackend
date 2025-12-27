import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Item name is required'],
        trim: true,
        maxlength: [100, 'Item name cannot exceed 100 characters']
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        trim: true,
        enum: [
            'Computer',
            'Laptop',
            'Printer',
            'Monitor',
            'Networking Equipment',
            'Mobile',
            'Tablet',
            'Server',
            'Other'
        ]
    },
    brand: {
        type: String,
        trim: true,
        maxlength: [50, 'Brand name cannot exceed 50 characters']
    },
    model: {
        type: String,
        trim: true,
        maxlength: [50, 'Model name cannot exceed 50 characters']
    },
    serialNumber: {
        type: String,
        required: [true, 'Serial number is required'],
        unique: true,
        trim: true,
        maxlength: [50, 'Serial number cannot exceed 50 characters']
    },
    location: {
        type: String,
        required: [true, 'Location is required'],
        trim: true,
        maxlength: [100, 'Location cannot exceed 100 characters']
    },
    status: {
        type: String,
        required: true,
        enum: ['available', 'in-use', 'maintenance', 'retired'],
        default: 'available'
    },
    condition: {
        type: String,
        required: true,
        enum: ['Excellent', 'Good', 'Fair', 'Poor'],
        default: 'Good'
    },
    isAssignable: {
        type: Boolean,
        default: false   // By default, general assets are not assignable
    },
    purchaseDate: {
        type: Date
    },
    warrantyExpiry: {
        type: Date
    },
    price: {
        type: Number,
        min: [0, 'Price cannot be negative'],
        default: 0
    },
    description: {
        type: String,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    assignedDate: {
        type: Date
    },
    lastMaintenanceDate: {
        type: Date
    },
    nextMaintenanceDate: {
        type: Date
    },
    tags: [{
        type: String,
        trim: true
    }],
    images: [{
        url: String,
        description: String
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    assignmentHistory: [
        {
            user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            assignedDate: { type: Date, default: Date.now },
            returnedDate: { type: Date },
            action: { type: String, enum: ["assigned", "returned"] },
        }
    ],
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for warranty status
inventorySchema.virtual('warrantyStatus').get(function () {
    if (!this.warrantyExpiry) return 'unknown';

    const now = new Date();
    const warranty = new Date(this.warrantyExpiry);

    if (warranty < now) return 'expired';

    const daysLeft = Math.ceil((warranty - now) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 30) return 'expiring-soon';

    return 'active';
});

// Virtual for age in days
inventorySchema.virtual('ageInDays').get(function () {
    if (!this.purchaseDate) return null;

    const now = new Date();
    const purchase = new Date(this.purchaseDate);
    return Math.floor((now - purchase) / (1000 * 60 * 60 * 24));
});

// Index for better search performance
inventorySchema.index({ name: 'text', brand: 'text', model: 'text', serialNumber: 'text' });
inventorySchema.index({ category: 1, status: 1 });
inventorySchema.index({ location: 1 });
inventorySchema.index({ assignedTo: 1 });

// Pre-save middleware
// Pre-save middleware
inventorySchema.pre("save", function (next) {
    // Auto-assign next maintenance date if not set
    if (this.lastMaintenanceDate && !this.nextMaintenanceDate) {
        const nextMaintenance = new Date(this.lastMaintenanceDate);
        nextMaintenance.setMonth(nextMaintenance.getMonth() + 6); // 6 months later
        this.nextMaintenanceDate = nextMaintenance;
    }
    // Track assignment history
    // Track assignment history
    if (this.isModified("assignedTo")) {
        if (this.assignedTo) {
            // Item is being assigned → create new entry
            this.assignmentHistory.push({
                user: this.assignedTo,
                assignedDate: new Date(),
                action: "assigned",
            });
        } else {
            // Item is being returned (unassigned) → update last assignment
            const lastAssignment = this.assignmentHistory
                .slice()
                .reverse()
                .find((h) => h.action === "assigned" && !h.returnedDate);

            if (lastAssignment) {
                lastAssignment.returnedDate = new Date();
                lastAssignment.action = "returned"; // optional: update status
            }
        }
    }
    next();
});


// Static methods
inventorySchema.statics.getByCategory = function (category) {
    return this.find({ category, isActive: true });
};

inventorySchema.statics.getByStatus = function (status) {
    return this.find({ status, isActive: true });
};

inventorySchema.statics.getExpiringWarranties = function (days = 30) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return this.find({
        warrantyExpiry: { $lte: futureDate, $gte: new Date() },
        isActive: true
    });
};

// Instance methods
inventorySchema.methods.assignToUser = function (userId) {
    this.assignedTo = userId;
    this.assignedDate = new Date();
    this.status = 'in-use';
    return this.save();
};

inventorySchema.methods.unassign = function () {
    this.assignedTo = undefined;
    this.assignedDate = undefined;
    this.status = 'available';
    return this.save();
};

const InventoryModel = mongoose.model('Inventory', inventorySchema);

export default InventoryModel;
