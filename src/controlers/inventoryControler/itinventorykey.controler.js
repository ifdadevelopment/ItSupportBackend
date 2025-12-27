import InventoryItem, { ItInventoryItemKey } from "../../model/items/item.model.js";
import { getFullInventoryItemHistoryById, inventoryItemKeyService } from "../../service/inventoryItemService/inventoryItemKey.service.js";


const itInventoryGetControler = async (req, res) => {
    try {
        const inventoryItemKey = await inventoryItemKeyService();
        
        return res.json({
            data: inventoryItemKey
        }).status(200);
    }
    catch (err) {
        res.json({ error: "Some Error Occured" }).status(400);
    }
}
export const createItInventoryKeyControler = async (req, res) => {
    try {
        const inventoryItemKey = await ItInventoryItemKey.create(req.body);
        return res.json({
            data: inventoryItemKey
        }).status(200);
    }
    catch (err) {
        res.json({ error: "Some Error Occured" }).status(400);
    }
}



export const itInventoryItemGetHistoryControler = async (req, res) => {
    try {
        const result = await getFullInventoryItemHistoryById(req.params.id);
        console.log(result);
        return res.json( result ).status(200);
    }
    catch (err) {
        console.log(err);
        res.json({ error: "Some Error Occured" }).status(400);
    }
}
// export const deleteInventoryKeyController = async (req, res) => {
//   try {
//     const { usageId } = req.params;

//     if (!usageId) {
//       return res.status(400).json({
//         success: false,
//         message: "Usage ID is required"
//       });
//     }

//     // FIND PARENT ITEM BY EITHER ID
//     const parentItem = await ItInventoryItem.findOne({
//       $or: [
//         { "usageHistory._id": usageId },
//         { "usageHistory.inventoryId": usageId }
//       ]
//     });

//     if (!parentItem) {
//       return res.status(404).json({
//         success: false,
//         message: "Usage not found"
//       });
//     }

//     // DELETE MATCH FROM ARRAY
//     parentItem.usageHistory = parentItem.usageHistory.filter(
//       u =>
//         u._id.toString() !== usageId &&
//         u.inventoryId?.toString() !== usageId
//     );

//     await parentItem.save();

//     return res.status(200).json({
//       success: true,
//       message: "Usage entry deleted successfully",
//       deletedUsageId: usageId,
//       parentItemId: parentItem._id.toString()
//     });

//   } catch (err) {
//     console.log("DELETE USAGE ERROR:", err);
//     return res.status(500).json({ success: false, message: "Server error" });
//   }
// };

// // ============================================================
// // DELETE ITEM CARD (USING ITEM KEY ID = _id)
// // ============================================================
// export const deleteItemKeyCardController = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const deleted = await ItInventoryItem.deleteOne({ _id: id });

//     if (deleted.deletedCount === 0) {
//       return res.status(404).json({
//         success: false,
//         message: "Item not found"
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Item deleted successfully",
//       deletedItemId: id
//     });

//   } catch (err) {
//     console.log("DELETE ITEM ERROR:", err);
//     return res.status(500).json({ success: false, message: "Server error" });
//   }
// };

// ============================================================
// RESTORE DISABLED
// ============================================================
export const restoreInventoryKeyController = async (req, res) => {
  return res.status(200).json({
    success: false,
    message: "Undo disabled – restore not supported."
  });
};
export const deleteItemKeysCardController = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Item Key ID is required",
      });
    }
    const itemKey = await ItInventoryItemKey.findById(id);
    if (!itemKey) {
      return res.status(404).json({
        success: false,
        message: "Item Key not found",
      });
    }
    const deletedItems = await InventoryItem.deleteMany({ itemKey: id });
    await ItInventoryItemKey.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Inventory Item Key deleted successfully",
      deletedItemKeyId: id,
      deletedInventoryItems: deletedItems.deletedCount,
    });

  } catch (err) {
    console.log("DELETE ITEMKEY ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while deleting inventory item key",
    });
  }
};



export default itInventoryGetControler;