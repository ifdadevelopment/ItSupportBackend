// services/inventory.service.js
import InventoryModel from "../../model/inventory/inventory.model.js";
import { getIo } from "../../socket.js";

// Create new inventory item
export async function createInventory(data) {
  try {
    return await InventoryModel.create(data);
  } catch (err) {
    throw new Error(err.message || "Error creating inventory");
  }
}

// Get all inventories with optional filters, pagination, search
export async function getAllInventories(filter = {}, options = {}) {
  try {
    const { page = 1, limit = 20, search } = options;
    const query = { isActive: true, ...filter };

    if (search) {
      query.$text = { $search: search };
    }

    const inventories = await InventoryModel.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await InventoryModel.countDocuments(query);

    return { data: inventories, total, page, limit };
  } catch (err) {
    throw new Error(err.message || "Error fetching inventories");
  }
}

// Get inventory by ID
export async function getInventoryById(id) {
  try {
    return await InventoryModel.findById(id);
  } catch (err) {
    throw new Error("Inventory not found");
  }
}

// Update inventory
export async function updateInventory(id, updateData) {
  try {
    const updated = await InventoryModel.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
    if (!updated) throw new Error("Inventory not found");
    return updated;
  } catch (err) {
    throw new Error(err.message || "Error updating inventory");
  }
}

// Soft delete inventory
export async function deleteInventory(id) {
  try {
    const deleted = await InventoryModel.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );
    if (!deleted) throw new Error("Inventory not found");
    return deleted;
  } catch (err) {
    throw new Error(err.message || "Error deleting inventory");
  }
}

// Assign item to user
export async function assignToUser(id, userId) {
  try {
    const inventory = await InventoryModel.findById(id);
   

    if (!inventory) throw new Error("Inventory not found");
    return await inventory.assignToUser(userId);
  } catch (err) {
    throw new Error(err.message || "Error assigning inventory");
  }
}

// Unassign item
export async function unassignInventory(id) {
  try {
    const inventory = await InventoryModel.findById(id);
    if (!inventory) throw new Error("Inventory not found");
    return await inventory.unassign();
  } catch (err) {
    throw new Error(err.message || "Error unassigning inventory");
  }
}

// Get expiring warranties
export async function getExpiringWarranties(days = 30) {
  try {
    return await InventoryModel.getExpiringWarranties(days);
  } catch (err) {
    throw new Error("Error fetching expiring warranties");
  }
}


export const getUserInventoryHistory = async (userId) => {
  try {
    if (!userId) {
      throw new Error("User ID not found in request");
    }

    // Find all inventories where this user appears in assignmentHistory
    const inventories = await InventoryModel.find({
      "assignmentHistory.user": userId,
    })
      .lean();

    // Flatten only this user's history from each inventory
    let history = inventories.flatMap((inv) =>
      inv.assignmentHistory
        .filter((h) => h.user?.toString() === userId.toString())
        .map((h) => ({
          inventoryId: inv._id,
          inventoryName: inv.name,
          category: inv.category,
          action: h.action,
          assignedDate: h.assignedDate,
          returnedDate: h.returnedDate,
        }))
    );

    // Sort by assignedDate / returnedDate (latest first)
    history.sort((a, b) => {
      const dateA = a.returnedDate || a.assignedDate;
      const dateB = b.returnedDate || b.assignedDate;
      return new Date(dateB) - new Date(dateA);
    });
    // Take last 15
    history = history.slice(0, 15);
    return history;
  } catch (error) {
    return null;
  }
};
