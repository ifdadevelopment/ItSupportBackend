import DeviceToken from "../../model/DeviceToken.js";
import InventoryItem, { ItInventoryItemKey } from "../../model/items/item.model.js";
import { getFullInventoryItemHistoryById, inventoryItemKeyService } from "../../service/inventoryItemService/inventoryItemKey.service.js";
import { sendToToken } from "../../utils/fcmClient.js";

/* ---------- INVENTORY NOTIFICATION HELPER ---------- */
async function notifyInventoryUsers({
  notifyAdmins = false,
  notifyTechnicians = false,
  title,
  body,
  data = {},
}) {
  const tokenSet = new Set();

  if (notifyAdmins) {
    const admins = await DeviceToken.find({ "meta.userType": "admin" }).lean();
    admins.forEach(d => d?.token && tokenSet.add(d.token));
  }

  if (notifyTechnicians) {
    const techs = await DeviceToken.find({ "meta.userType": "technician" }).lean();
    techs.forEach(d => d?.token && tokenSet.add(d.token));
  }

  await Promise.allSettled(
    [...tokenSet].map(token =>
      sendToToken(token, {
        data: {
          title,
          body,
          ...data,
        },
      })
    )
  );
}

// const itInventoryGetControler = async (req, res) => {
//     try {
//         const inventoryItemKey = await inventoryItemKeyService();

//         return res.json({
//             data: inventoryItemKey
//         }).status(200);
//     }
//     catch (err) {
//         res.json({ error: "Some Error Occured" }).status(400);
//     }
// }
const itInventoryGetControler = async (req, res) => {
  try {
    const inventoryItemKey = await inventoryItemKeyService();
    return res.status(200).json({ data: inventoryItemKey });
  } catch (err) {
    return res.status(400).json({ error: "Some Error Occurred" });
  }
};

// export const createItInventoryKeyControler = async (req, res) => {
//     try {
//         const inventoryItemKey = await ItInventoryItemKey.create(req.body);
//         return res.json({
//             data: inventoryItemKey
//         }).status(200);
//     }
//     catch (err) {
//         res.json({ error: "Some Error Occured" }).status(400);
//     }
// }

export const createItInventoryKeyControler = async (req, res) => {
  try {
    const inventoryItemKey = await ItInventoryItemKey.create(req.body);

    const isTechnician = req.user.user_type === "technician";

    await notifyInventoryUsers({
      notifyAdmins: isTechnician,
      notifyTechnicians: !isTechnician,
      title: "📦 Inventory Key Created",
      body: `${req.user.name} created a new inventory item key`,
      data: {
        type: "inventory_key_created",
        itemKeyId: inventoryItemKey._id.toString(),
        createdBy: req.user.user_type,
      },
    });

    return res.status(200).json({
      success: true,
      data: inventoryItemKey,
    });

  } catch (err) {
    return res.status(400).json({ error: "Some Error Occurred" });
  }
};
export const updateItInventoryKeyController = async (req, res) => {
  try {
    const { id } = req.params;

    const updatedKey = await ItInventoryItemKey.findByIdAndUpdate(
      id,
      req.body,
      { new: true }
    );

    if (!updatedKey) {
      return res.status(404).json({
        success: false,
        message: "Inventory Item Key not found",
      });
    }

    const isTechnician = req.user.user_type === "technician";

    await notifyInventoryUsers({
      notifyAdmins: isTechnician,
      notifyTechnicians: !isTechnician,
      title: "✏️ Inventory Key Updated",
      body: `${req.user.name} updated an inventory item key`,
      data: {
        type: "inventory_key_updated",
        itemKeyId: updatedKey._id.toString(),
        updatedBy: req.user.user_type,
      },
    });

    return res.status(200).json({
      success: true,
      data: updatedKey,
    });

  } catch (err) {
    console.log("UPDATE ITEMKEY ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while updating inventory item key",
    });
  }
};


// export const itInventoryItemGetHistoryControler = async (req, res) => {
//     try {
//         const result = await getFullInventoryItemHistoryById(req.params.id);
//         console.log(result);
//         return res.json( result ).status(200);
//     }
//     catch (err) {
//         console.log(err);
//         res.json({ error: "Some Error Occured" }).status(400);
//     }
// }
export const itInventoryItemGetHistoryControler = async (req, res) => {
  try {
    const result = await getFullInventoryItemHistoryById(req.params.id);
    return res.status(200).json(result);
  } catch (err) {
    console.log(err);
    return res.status(400).json({ error: "Some Error Occurred" });
  }
};
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