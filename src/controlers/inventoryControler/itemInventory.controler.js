import mongoose from "mongoose";
import InventoryItem, { ItInventoryItemKey } from "../../model/items/item.model.js";
import { inventoryItemKeyService } from "../../service/inventoryItemService/inventoryItemKey.service.js";
import { createInventoryItem, getAllItemsService, getInventoryItemById, searchInventoryItems, updateInventoryItem } from "../../service/inventoryItemService/inventoryitems.service.js";
import { getAllItInventories } from "../../service/inventoryService/itInventory.service.js";

export const createItInventoryItemController = async (req, res) => {
  try {
    const itInventory = await createInventoryItem({ ...req.body, addedBy: req.user._id });
    return res.status(200).json({ success: true, message: "Inventory Created Successfully", data: itInventory });
  } catch (err) {
    
    return res.status(400).json({ success: false, message: "Error creating It Inventory", error: err.message });
  }
};

export const getInventoryKeyControler = async (req, res)=>{
  try{
    const itemKey = await ItInventoryItemKey.find({});
    res.json({
      itemKey
    }).status(200);
  }
  catch(err){
    res.status(400).json({ error : "Could Not found "})
  }
}
export const getItInventoryItemController = async (req, res) => {
  try {
    const query = req.query.q == undefined ? "" : req.query.q;
    const itInventory = await getAllItemsService();
    return res.status(200).json({ success: true, message: "Inventory Created Successfully", data: itInventory.items });
  } catch (err) {
    
    return res.status(400).json({ success: false, message: "Error creating It Inventory", error: err.message });
  }
};


export const getItInventoryItemByIdController = async (req, res) => {
  try {
    const id = req.params.id;
    const itInventory = await getInventoryItemById(id);

    return res.status(200).json({ success: true, message: "Items Fetched Successfully", data: itInventory });
  } catch (err) {
    
    return res.status(400).json({ success: false, message: "Error creating It Inventory", error: err.message });
  }
};

export const addItemsToSystemFormController = async (req, res) => {
  try {
    const query = req.query.q?.trim() || "";
    const tagNoCpu = req.query.tagNoCpu || null;
    const itInventory = await inventoryItemKeyService();
    const systemInventory = await getAllItInventories(
      tagNoCpu ? { tagNoCpu } : {}
    );
    
    return res.status(200).json({
      success: true,
      message: "Inventory and systems fetched successfully",
      data: {
        items: itInventory,
        systems: systemInventory,
      },
    });
  } catch (err) {
    console.error("Error fetching inventory:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch inventory and systems",
      error: err.message,
    });
  }
};



export const updateItInventoryItemByIdController = async (req, res) => {
  try {

    const id = req.params.id
    const itInventory = await updateInventoryItem(id, req.body);
    return res.status(200).json({ success: true, message: "Inventory Updated Successfully", data: itInventory });
  } catch (err) {
    
    return res.status(400).json({ success: false, message: "Error creating It Inventory", error: err.message });
  }
};


export async function addUsageHistoryControler(req, res) {
  try {
    const itemId = req.body.itemId;
    const item = await InventoryItem.findOne({ itemKey : itemId,   quantity: { $gt: 0 } }).populate("usageHistory","inventoryId");
    const inventoryId = req.body.systemId;
    const usedBy = req.user._id
    const qty = parseInt(req.body.quantity);
    if (!item) return res.json({ "error": "No Item Found In Database" }).status(400);
    if (item.quantity < qty) {
      return res.json({ "error": "No Item Found In Database" }).status(400);
    }
    await item.addUsageHistory({ inventoryId, qty, usedBy });
    res.json({ "success": "Item Added to inventory Successfully!!" });
  }
  catch (err) {
    console.log(err)
    res.json({ "error": "Internal Server Error" }).status(400);
  }
  
}
export const deleteInventoryKeyController = async (req, res) => {
  try {
    // admin check
    if (!req.user || req.user.user_type !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admin can delete usage history",
      });
    }

    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Usage ID",
      });
    }

    const parent = await InventoryItem.findOne({
      "usageHistory._id": id,
    });

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: "Usage entry not found",
      });
    }

    const usageEntry = parent.usageHistory.find(
      (u) => u._id.toString() === id
    );

    // restore quantity
    parent.quantity += usageEntry.qty;

    // remove usage
    parent.usageHistory = parent.usageHistory.filter(
      (u) => u._id.toString() !== id
    );

    await parent.save();

    return res.status(200).json({
      success: true,
      message: "Usage entry deleted and stock restored",
      deletedItem: usageEntry,
      parentId: parent._id,
    });

  } catch (err) {
    console.error("DELETE USAGE HISTORY ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


export const deleteItemKeyCardController = async (req, res) => {
  try {
    if (!req.user || req.user.user_type !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admin can delete inventory items",
      });
    }

    const { itemKeyId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(itemKeyId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ItemKey ID",
      });
    }

    const deleted = await InventoryItem.deleteMany({ itemKey: itemKeyId });

    if (deleted.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "No inventory items found for this key",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Inventory items deleted successfully",
      deletedCount: deleted.deletedCount,
    });

  } catch (err) {
    console.error("DELETE ITEMKEY ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};




