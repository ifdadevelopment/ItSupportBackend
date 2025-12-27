// services/itInventory.service.js
import ItInventoryModel from "../../model/inventory/itInventory.model.js";
import Ticket from "../../model/ticketModel/model.ticket.js";

/**
 * Create new inventory
 */
export async function createItInventory(data) {
  try {
    const inventory = await ItInventoryModel.create(data);
    return inventory;
  } catch (err) {
    throw new Error(err.message || "Error creating inventory");
  }
}

/**
 * Get all inventories with optional filters
 */
export async function getAllItInventories(filter = {}, options = {}) {
  try {
    const { limit = 50, skip = 0, sort = { createdAt: -1 } } = options;
     const inventories = await ItInventoryModel.find(filter)
      .sort(sort)
      .skip(Number(skip))
      .lean(); // plain JS objects for speed

    const inventoryIds = inventories.map(inv => inv._id);

    // 2. Aggregate ticket count per inventory (by pc field)
    const ticketCounts = await Ticket.aggregate([
      {
        $match: {
          pc: { $in: inventoryIds },
          isActive: true
        }
      },
      {
        $group: {
          _id: "$pc",
          count: { $sum: 1 }
        }
      }
    ]);

    // 3. Map ticket counts back to inventory by _id
    const ticketMap = {};
    ticketCounts.forEach(tc => {
      ticketMap[tc._id.toString()] = tc.count;
    });

    // 4. Merge ticket count into each inventory record
    const enrichedInventories = inventories.map(inv => ({
      ...inv,
      ticketCount: ticketMap[inv._id.toString()] || 0
    }));

    return enrichedInventories;
  } catch (err) {
    throw new Error(err.message || "Error fetching inventories");
  }
}

/**
 * Get single inventory by ID
 */
export async function getItInventoryById(id) {
  try {
    return await ItInventoryModel.findById(id);
  } catch (err) {
    throw new Error(err.message || "Error fetching inventory by ID");
  }
}

/**
 * Get inventory by Tag No
 */
export async function getItInventoryByTag(tag) {
  return await ItInventoryModel.findByTag(tag);
}

/**
 * Get inventory by Mac Address
 */
export async function getItInventoryByMac(mac) {
  return await ItInventoryModel.findByMac(mac);
}

/**
 * Update inventory
 */
export async function updateItInventoryService(id, data) {
  try {
    return await ItInventoryModel.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
  } catch (err) {
    throw new Error(err.message || "Error updating inventory");
  }
}


/**
 * Delete inventory (soft delete => mark as retired)
 */
export async function retireItInventory(id) {
  try {
    return await ItInventoryModel.findByIdAndUpdate(
      id,
      { status: "retired" },
      { new: true }
    );
  } catch (err) {
    throw new Error(err.message || "Error retiring inventory");
  }
}

/**
 * Assign inventory to a user
 */
export async function assignItInventory(id, userId) {
  try {
    const inventory = await ItInventoryModel.findById(id);
    if (!inventory) throw new Error("Inventory not found");
    if (!inventory.isAvailable()) throw new Error("Inventory not available");
    return await inventory.assignedTo(userId);
  } catch (err) {
    throw new Error(err.message || "Error assigning inventory");
  }
}

/**
 * Mark inventory for repair
 */
export async function markItInventoryForRepair(id) {
  try {
    const inventory = await ItInventoryModel.findById(id);
    if (!inventory) throw new Error("Inventory not found");
    return await inventory.markForRepair();
  } catch (err) {
    throw new Error(err.message || "Error marking inventory for repair");
  }
}

/**
 * Get inventory stats
 */
export async function getItInventoryStats() {
  try {
    const [counts, warrantyExpired] = await Promise.all([
      ItInventoryModel.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      ItInventoryModel.countDocuments({
        warrantyExpiry: { $lt: new Date() },
      }),
    ]);

    return { counts, warrantyExpired };
  } catch (err) {
    throw new Error(err.message || "Error fetching inventory stats");
  }
}


export async function createItInventoriesBulk(items = []) {
  try {
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error("Items must be a non-empty array");
    }

    // insertMany is more efficient than looping .create()
    const result = await ItInventoryModel.insertMany(items, {
      ordered: false, // continue even if some fail (e.g., duplicate key)
    });

    return result;
  } catch (err) {
    throw new Error(err.message || "Error creating bulk inventories");
  }
}

