import InventoryItem, { ItInventoryItemKey } from "../../model/items/item.model.js";

const inventoryItemKeyService = async () => {
  try {
    const inventoryItemKeys = await ItInventoryItemKey.find();
    const result = [];
    for (const itemKey of inventoryItemKeys) {
      const inventoryItems = await InventoryItem.find({ itemKey: itemKey._id });
      const totalQuantity = inventoryItems.reduce((sum, item) => sum + item.quantity, 0);
      result.push({
        _id : itemKey._id,
        key: itemKey.name,      
        quantity: totalQuantity 
      });
    }

    return result; 
  } catch (error) {
    throw new Error('Error fetching inventory items: ' + error.message);
  }
};

const getFullInventoryItemHistoryById = async (itemKeyId) => {
  try {
    const itemKey = await ItInventoryItemKey.findOne({ _id: itemKeyId });

    const inventoryItems = await InventoryItem.find({ itemKey: itemKeyId })
      .populate("itemKey")
      .populate({
        path: "addedBy",
        select: "name"
      })
      .populate({
        path: "usageHistory.inventoryId",
        select: "name key displayTag tagNoCpu"
      })
      .populate({
        path: "usageHistory.usedBy",
        select: "name"
      });

    if (!inventoryItems || inventoryItems.length === 0 || inventoryItems[0].quantity === 0) {
      return { message: "No inventory purchased yet", data: [] };
    }

    const inventoryHistory = inventoryItems.map(item => {
      return {
        _id: item._id,
        itemKeyId: item.itemKey._id,
        itemName: item?.itemKey?.name,
        itemDescription: item?.itemKey?.description,
        quantityPurchased: item?.quantity,
        createdAt: item?.createdAt,
        addedBy: item?.addedBy?.name,
        pricePerItem: item?.price,

        usageHistory: item?.usageHistory?.length > 0
          ? item.usageHistory.map(usage => ({
              _id: usage._id,
              usedBy: usage.usedBy ? usage.usedBy.name : "Unknown",    // ✔ correct
              usedIn: usage.inventoryId ? usage.inventoryId.tagNoCpu : "Unknown",  // ✔ correct
              quantityUsed: usage.qty,
              dateUsed: usage.date,
            }))
          : [],
      };
    });

    return {
      message: "Inventory history fetched successfully",
      data: inventoryHistory
    };

  } catch (error) {
    console.log(error);
    throw new Error("Unable to fetch inventory history");
  }
};




export { inventoryItemKeyService, getFullInventoryItemHistoryById };