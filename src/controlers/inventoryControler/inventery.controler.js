import UserModel from "../../model/auth/user.model.js";
import InventoryModel from "../../model/inventory/inventory.model.js";
import { assignToUser, createInventory, getAllInventories, getUserInventoryHistory, unassignInventory } from "../../service/inventoryService/inventory.service.js";
import { getIo } from "../../socket.js";


export const createInventoryController = async (req, res) => {
    try {
        const ticket = await createInventory({ ...req.body, requestedBy: req.user._id });
        return res.status(200).json({ success: true, message: "Ticket created successfully", data: ticket });
    } catch (err) {
        console.error(err);
        return res.status(400).json({ success: false, message: "Error creating ticket", error: err.message });
    }
};

export const getCurrentUserInventoryControler = async (req, res) => {
    try {
        const currentUserInventories = await getAllInventories({ assignedTo: req.user._id });
        const history = await getUserInventoryHistory(req?.user?._id);
       res.json({ data: currentUserInventories, history: history }).status(200);
    }
    catch (err) {
        res.json({ success: false, error: err.message }).status(400);

    }
}

export const requestInventoryControler = async (req, res) => {
    try {
        const inventory = await assignToUser(req.params.inventoryId, req.user._id);
        const io = getIo();
        io.emit("inventory_update", {

        });
        return res.status(200).json({
            message: "Inventory successfully assigned",
            inventory,
        });
    } catch (error) {
        console.error("Error requesting inventory:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};


export const returnInventoryControler = async (req, res) => {
    try {
        const inventory = await unassignInventory(req.params.inventoryId);
          const io = getIo();
        io.emit("inventory_update", {

        });
        return res.status(200).json({
            message: "Inventory successfully assigned",
            inventory,
        });
    } catch (error) {
        console.error("Error requesting inventory:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};




