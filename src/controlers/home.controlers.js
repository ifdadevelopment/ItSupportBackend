import homeServiceFunction from "../service/homePageService/homePageService.js";
import { getAllInventories } from "../service/inventoryService/inventory.service.js";
import { getTickets } from "../service/ticketService/ticket.service.js";

export const homePageControler = async (req, res) => {
    try {
        const data = await homeServiceFunction(req.user);
        res.json(data).status(200);
    } catch (error) {
        return res.status(400).json({ success: false, message: "Error creating ticket", error: err.message });
    }
}


