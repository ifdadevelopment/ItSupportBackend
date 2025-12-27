import express from "express";
import TicketModel from "../../model/ticketModel/model.ticket.js";
import InventoryModel from "../../model/inventory/inventory.model.js";
import UserModel from "../../model/auth/user.model.js";

const homeServiceFunction = async (user) => {
    try {
        const { _id, user_type } = user;

        if (user_type === "admin") {
            // --- Admin Dashboard ---
            const totalUsers = await UserModel.countDocuments();
            const totalTickets = await TicketModel.countDocuments();
            const pending = await TicketModel.countDocuments({ status: "open" });
            const solved = await TicketModel.countDocuments({ status: "resolved" });
            const inventoryTaken = await InventoryModel.countDocuments({ status: "in-use" });
            const inventoryAvailable = await InventoryModel.countDocuments({ status: "available" });
            const tickets = await TicketModel.find({ status: { $in: ['open', 'in-progress'] } })
                .sort({ createdAt: -1 }).populate({
                    path: "requestedBy",
                    select: "name email user_type" // Include only required fields
                }).populate({
                    path: "assignedTo",
                    select: "name email user_type", // from UserSchema
                }).populate("pc","tagNoCpu");
            const users = await UserModel.aggregate([
                {
                    $lookup: {
                        from: "tickets",
                        localField: "_id",
                        foreignField: "requestedBy",
                        as: "tickets",
                    },
                },
                {
                    $match: {
                        _id: { $ne: user._id }
                    }
                },
                {
                    $project: {
                        name: 1,
                        user_type : 1,
                        email: 1,
                        active: 1,
                        createdAt: 1,
                        ticketsRaised: { $size: "$tickets" },
                    },
                },
                { $sort: { ticketsRaised: -1 } },
            ]);

            return {
                summary: {
                    totalUsers,
                    totalTickets,
                    pending,
                    solved,
                    inventoryTaken,
                    inventoryAvailable,
                },
                tickets,
                users,
            };
        } else if (user_type === "technician") {
            // --- Technician Dashboard ---
            const assignedTickets = await TicketModel.find({
                status: { $in: ["open", "in-progress"] }
            }).sort({ createdAt: -1 }).populate("pc", 'tagNoCpu').populate("requestedBy", 'name email');
            const totalAssigned = await TicketModel.countDocuments({ assignedTo: _id });
            const totalTicket = await TicketModel.countDocuments({});
            const pendingAssigned = await TicketModel.countDocuments({ status: "open" });
            const inProgress = await TicketModel.countDocuments({ status: "in-progress" });
            const resolvedByTech = await TicketModel.countDocuments({ status: "resolved" });

            return {
                summary: {
                    totalTicket,
                    totalAssigned,
                    pendingAssigned,
                    inProgress,
                    resolvedByTech,
                },
                tickets: assignedTickets,
            };
        } else {
            // --- Normal User Dashboard ---
            const tickets = await TicketModel.find({ requestedBy: _id }).populate("pc", 'tagNoCpu').populate("requestedBy","name").
            populate("assignedTo", "name")                .sort({ createdAt: -1 });

            const inventory = await InventoryModel.find({ isAssignable: true, assignedTo: null });
            const totalTickets = await TicketModel.countDocuments({ requestedBy: _id });
            const solved = await TicketModel.countDocuments({ requestedBy: _id, status: "resolved" });
            const pending = await TicketModel.countDocuments({ requestedBy: _id, status: "open" });
            const inProgress = await TicketModel.countDocuments({ status: "in-progress", requestedBy : _id });
            const taken = await InventoryModel.countDocuments({ assignedTo: _id });

            return {
                ticketSummary: { total: totalTickets, solved, pending, taken, inProgress },
                inventory,
                tickets,
            };
        }
    } catch (error) {
        return null;
    }
};

export default homeServiceFunction;