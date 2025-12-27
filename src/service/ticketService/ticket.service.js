import Ticket from "../../model/ticketModel/model.ticket.js";
import UserModel from "../../model/auth/user.model.js";

/* ---------- GET TICKETS WITH FILTERS & PAGINATION ---------- */
export async function getTickets({
    page = 1, limit = 10, search = "", status = "", priority = "", category = "", assignedTo = "",
    requestedBy = "", sortBy = "createdAt", sortOrder = "desc", }) {
    const filter = { isActive: true };
    if (search) {
        filter.$or = [
            { title: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } },
            { ticketId: { $regex: search, $options: "i" } },
        ];
    }

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (requestedBy) filter.requestedBy = requestedBy;

    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [tickets, total] = await Promise.all([
        Ticket.find(filter)
            .populate("requestedBy", "name email department")
            .populate("assignedTo", "name email department")
            .sort(sort),
        Ticket.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / parseInt(limit));

    return {
        tickets,
        pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalItems: total,
            itemsPerPage: parseInt(limit),
            hasNextPage: parseInt(page) < totalPages,
            hasPrevPage: parseInt(page) > 1,
        },
    };
}



/* ---------- GET SINGLE TICKET ---------- */
export async function getTicketById(ticketId) {
    const ticket = await Ticket.findOne({ _id: ticketId, isActive: true })
        .populate("requestedBy", "name email department phone")
        .populate("assignedTo", "name email department phone")
        .populate("comments.author", "name email").populate('pc','_id, tagNoCpu' );
    return ticket;
}

/* ---------- CREATE NEW TICKET ---------- */
export async function createTicket(object) {
    try {
        const ticket = await Ticket.create(object);
        return ticket;
    }
    catch (err) {
        return false;
    }
}




/* ---------- UPDATE TICKET ---------- */
export async function updateTicket(ticketId, data) {
    const ticket = await Ticket.findOne({ _id: ticketId, isActive: true });
    if (!ticket) throw new Error("Ticket not found");

    const { assignedTo } = data;
    if (assignedTo && assignedTo !== ticket.assignedTo?.toString()) {
        const user = await UserModel.findOne({ _id: assignedTo, active: true });
        if (!user) throw new Error("Assigned user is invalid");
    }

    Object.assign(ticket, data);
    if (assignedTo !== undefined) ticket.assignedTo = assignedTo || null;
    if (data.dueDate) ticket.dueDate = new Date(data.dueDate);

    const updatedTicket = await ticket.save();
    await updatedTicket.populate([
        { path: "requestedBy", select: "name email department" },
        { path: "assignedTo", select: "name email department" },
    ]);

    return updatedTicket;
}

/* ---------- DELETE TICKET (soft delete) ---------- */
export async function deleteTicket(ticketId) {
    const ticket = await Ticket.findOne({ _id: ticketId, isActive: true });
    if (!ticket) throw new Error("Ticket not found");
    if (ticket.status === "in-progress") throw new Error("Cannot delete a ticket in-progress");

    ticket.isActive = false;
    await ticket.save();

    return ticket;
}

/* ---------- ADD COMMENT ---------- */
export async function addComment(ticketId, userId, content, isInternal = false) {
    return ticket;
}

/* ---------- ASSIGN TICKET ---------- */
export async function assignTicket(ticketId, userId) {
    const [ticket, user] = await Promise.all([
        Ticket.findOne({ _id: ticketId, isActive: true }),
        UserModel.findOne({ _id: userId, isActive: true }),
    ]);

    if (!ticket) throw new Error("Ticket not found");
    if (!user) throw new Error("User not found");

    await ticket.assignTo(userId);
    await ticket.populate("assignedTo", "name email department");

    return ticket;
}

/* ---------- RESOLVE TICKET ---------- */
export async function resolveTicket(ticketId, resolution) {
    const ticket = await Ticket.findOne({ _id: ticketId, isActive: true });
    if (!ticket) throw new Error("Ticket not found");

    await ticket.resolve(resolution);
    await ticket.populate([
        { path: "requestedBy", select: "name email" },
        { path: "assignedTo", select: "name email" },
    ]);

    return ticket;
}

/* ---------- CLOSE TICKET ---------- */
export async function closeTicket(ticketId) {
    const ticket = await Ticket.findOne({ _id: ticketId, isActive: true });
    if (!ticket) throw new Error("Ticket not found");
    if (ticket.status !== "resolved") throw new Error("Only resolved tickets can be closed");

    await ticket.close();
    return ticket;
}

/* ---------- META: STATS, OVERDUE, TRENDS ---------- */
export async function getTicketStats() {
    return Ticket.getTicketStats();
}

export async function getOverdueTickets() {
    return Ticket.getOverdueTickets().populate("requestedBy", "name email").populate("assignedTo", "name email");
}

export async function getTicketTrends(days = 30) {
    return Ticket.getTicketTrends(days);
}
