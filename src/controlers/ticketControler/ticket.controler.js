import { uploadFileToS3 } from "../../middleware/upload.middleware.js";
import Ticket from "../../model/ticketModel/model.ticket.js";
import {
  getTickets,
  getTicketById,
  createTicket,
  updateTicket,
  deleteTicket,
  addComment,
  assignTicket,
  resolveTicket,
  closeTicket,
  getTicketStats,
  getOverdueTickets
} from "../../service//ticketService/ticket.service.js";
import { getInventoryById } from "../../service/inventoryService/inventory.service.js";
import { getItInventoryById } from "../../service/inventoryService/itInventory.service.js";
import { findAllUserService, findUserService } from "../../service/user.service.js";
import { getIo } from "../../socket.js";
import { deleteFileFromS3 } from "../../utils/s3Delete.js";


/* ---------- GET TICKETS ---------- */
export const getTicketsController = async (req, res) => {
  try {
    if (req.user.user_type == "technician") {
      const tickets = await Ticket.find({
        isActive: true,
        status: { $in: ["open", "in-progress"] }
      })
        .populate("requestedBy", "name email")
        .populate("assignedTo", "name email")
        .sort({ createdAt: -1 }); // Newest first
      return res.status(200).json({ success: true, data: tickets })
    }
    const data = await getTickets(req.query);
    return res.status(200).json({ success: true, data });
  } catch (err) {

    return res.status(500).json({ success: false, message: "Error loading tickets", error: err.message });
  }
};

/* ---------- GET SINGLE TICKET ---------- */
export const getTicketByIdController = async (req, res) => {
  try {
    const ticket = await getTicketById(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, message: "Ticket not found" });
    const allUser = await findAllUserService({ user_type: { $ne: "user" } });

    return res.status(200).json({ success: true, data: ticket, user: allUser });
  } catch (err) {

    return res.status(500).json({ success: false, message: "Error loading ticket", error: err.message });
  }
};

/* ---------- CREATE TICKET ---------- */
// export const createTicketController = async (req, res) => {
//   try {
//     const ticket = await createTicket({ ...req.body, requestedBy: req.user._id });
//     const io = getIo();
//     io.emit("ticket_raised", {});
//       setImmediate(async () => {
//       try {
//         const users = await findAllUserService({ user_type: "technician" });

//         for (const user of users) {
//           if (user.user_token) {
//             await notificationService(user.user_token); // or non-await if fire-and-forget
//           }
//         }
//       } catch (notifyErr) {
//       }
//     });
//     return res.status(201).json({ success: true, message: "Ticket created successfully", data: ticket });
//   } catch (err) {    
//     return res.status(500).json({ success: false, message: "Error creating ticket", error: err.message });
//   }
// };


export const createTicketController = async (req, res) => {
  try {
    const uploads = Array.isArray(req.s3Uploads) ? req.s3Uploads : [];

    const ticketData = {
      ...req.body,
      requestedBy: req.user._id,
      attachments: uploads.map(file => ({
        url: file.url,
        key: file.key,
        originalName: file.originalName,
        mimetype: file.type,
        size: file.size,
      }))
    };

    const ticket = await Ticket.create(ticketData);

    return res.status(201).json({
      success: true,
      message: "Ticket created successfully",
      data: ticket,
    });

  } catch (err) {
    console.log("Ticket Create Error:", err);
    return res.status(500).json({ success: false, message: "Failed to create ticket" });
  }
};





/* ---------- UPDATE TICKET ---------- */
export const updateTicketController = async (req, res) => {
  try {
    const ticket = await updateTicket(req.params.id, req.body);
    const io = getIo();
    io.emit("update_ticket_status", {

    });
    return res.status(200).json({ success: true, message: "Ticket updated successfully", data: ticket });
  } catch (err) {

    return res.status(500).json({ success: false, message: "Error updating ticket", error: err.message });
  }
};

/* ---------- DELETE TICKET ---------- */
// export const deleteTicketController = async (req, res) => {
//   try {
//     const ticket = await deleteTicket(req.params.id);
//     return res.status(200).json({ success: true, message: "Ticket deleted successfully", data: ticket });
//   } catch (err) {

//     return res.status(500).json({ success: false, message: "Error deleting ticket", error: err.message });
//   }
// };

/* ---------- ADD COMMENT ---------- */
export const addCommentController = async (req, res) => {
  try {
    const { content, isInternal } = req.body;
    const userId = req.user._id;
    const ticket = await Ticket.findOne({ _id: req.params.ticketId });
    ticket.addComment(req.user._id, content);
    const io = getIo();
    io.emit("add_comment", {

    })
    // const ticket = await addComment(req.params.ticketId, userId, content, isInternal);
    return res.status(200).json({ success: true, message: "Comment added successfully", data: ticket });
  } catch (err) {

    return res.status(500).json({ success: false, message: "Error adding comment", error: err.message });
  }
};

/* ---------- ASSIGN TICKET ---------- */
export const assignTicketController = async (req, res) => {
  try {
    const { userId } = req.body;
    const ticket = await assignTicket(req.params.id, userId);
    return res.status(200).json({ success: true, message: "Ticket assigned successfully", data: ticket });
  } catch (err) {

    return res.status(500).json({ success: false, message: "Error assigning ticket", error: err.message });
  }
};

/* ---------- RESOLVE TICKET ---------- */
export const resolveTicketController = async (req, res) => {
  try {
    const { resolution } = req.body;
    const ticket = await resolveTicket(req.params.id, resolution);
    return res.status(200).json({ success: true, message: "Ticket resolved successfully", data: ticket });
  } catch (err) {

    return res.status(500).json({ success: false, message: "Error resolving ticket", error: err.message });
  }
};

/* ---------- CLOSE TICKET ---------- */
export const closeTicketController = async (req, res) => {
  try {
    const ticket = await closeTicket(req.params.id);
    return res.status(200).json({ success: true, message: "Ticket closed successfully", data: ticket });
  } catch (err) {

    return res.status(500).json({ success: false, message: "Error closing ticket", error: err.message });
  }
};

/* ---------- META ---------- */
export const getTicketStatsController = async (req, res) => {
  try {
    const stats = await getTicketStats();
    return res.status(200).json({ success: true, data: stats });
  } catch (err) {

    return res.status(500).json({ success: false, message: "Error fetching ticket stats", error: err.message });
  }
};

export const getOverdueTicketsController = async (req, res) => {
  try {
    const tickets = await getOverdueTickets();
    return res.status(200).json({ success: true, data: tickets });
  } catch (err) {

    return res.status(500).json({ success: false, message: "Error fetching overdue tickets", error: err.message });
  }
};

export const getTicketTrendsController = async (req, res) => {
  try {
    const { period } = req.query;
    const trends = await getTicketTrends(period ? parseInt(period) : 30);
    return res.status(200).json({ success: true, data: trends });
  } catch (err) {

    return res.status(500).json({ success: false, message: "Error fetching ticket trends", error: err.message });
  }
};

export const getMyTicketsByTypeController = async (req, res) => {
  try {
    const { status, ...rest } = req.query;

    const filter = {
      ...rest,
      isActive: true,
    };
    if (req.user?.user_type === 'user') {
      filter.requestedBy = req.user._id;
    }
    if (status === 'pending') {
      filter.status = {
        $in: ['open', 'in-progress']
      };
    } else if (status) {
      // If not pending, keep status as-is
      filter.status = status;
    }

    const tickets = await Ticket.find(filter)
      .populate("requestedBy", "name email")
      .populate("assignedTo", "name email").populate("pc", "tagNoCpu")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: tickets });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch tickets",
      error: err.message,
    });
  }
};
// export const getMyTicketsByTypeController = async (req, res) => {
//   try {
//     const { status, searchText, ...rest } = req.query;

//     const filter = {
//       ...rest,
//       isActive: true,
//     };

//     // If user is normal -> show only their own tickets
//     if (req.user?.user_type === "user") {
//       filter.requestedBy = req.user._id;
//     }

//     // Status filter logic
//     if (status === "pending") {
//       filter.status = { $in: ["open", "in-progress"] };
//     } else if (status) {
//       filter.status = status;
//     }

//     /* ------------------------------------------
//         🔍 ADVANCED SEARCH (User Name + Title + AssignedTo + Description)
//     --------------------------------------------- */
//     let searchQuery = {};

//     if (searchText && searchText.trim()) {
//       const regex = new RegExp(searchText, "i");

//       searchQuery = {
//         $or: [
//           { title: { $regex: regex } },
//           { description: { $regex: regex } },

//           // requestedBy name search
//           { "requestedBy.name": { $regex: regex } },

//           // assignedTo name search
//           { "assignedTo.name": { $regex: regex } },
//         ],
//       };
//     }

//     /* ------------------------------------------------
//         FINALLY — FETCH TICKETS USING AGGREGATION
//     ------------------------------------------------ */
//     const tickets = await Ticket.aggregate([
//       {
//         $match: filter,
//       },

//       // Join users
//       {
//         $lookup: {
//           from: "users",
//           localField: "requestedBy",
//           foreignField: "_id",
//           as: "requestedBy",
//         },
//       },
//       {
//         $unwind: {
//           path: "$requestedBy",
//           preserveNullAndEmptyArrays: true,
//         },
//       },

//       // Join assigned user
//       {
//         $lookup: {
//           from: "users",
//           localField: "assignedTo",
//           foreignField: "_id",
//           as: "assignedTo",
//         },
//       },
//       {
//         $unwind: {
//           path: "$assignedTo",
//           preserveNullAndEmptyArrays: true,
//         },
//       },

//       // Join PC info
//       {
//         $lookup: {
//           from: "pcs",
//           localField: "pc",
//           foreignField: "_id",
//           as: "pc",
//         },
//       },
//       {
//         $unwind: {
//           path: "$pc",
//           preserveNullAndEmptyArrays: true,
//         },
//       },

//       // Apply search if exists
//       ...(searchText
//         ? [{ $match: searchQuery }]
//         : []),

//       { $sort: { createdAt: -1 } },
//     ]);

//     return res.status(200).json({ success: true, data: tickets });

//   } catch (err) {
//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch tickets",
//       error: err.message,
//     });
//   }
// };
export const getTicketStatusController = async (req, res) => {
  try {
    const { location, sublocation, status, requestedBy } = req.query;

    const filter = {
      isActive: true,
    };

    if (location) filter.location = location;
    if (sublocation) filter.sublocation = sublocation;
    if (status) filter.status = status;
    if (requestedBy) filter.requestedBy = requestedBy;

    const tickets = await Ticket.find(filter)
      .populate("requestedBy", "name email")
      .populate("assignedTo", "name email")
      .populate("pc", "tagNoCpu")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: tickets });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Error filtering tickets",
      error: err.message
    });
  }
};
export const deleteTicketAttachmentController = async (req, res) => {
  try {
    const { ticketId, attachmentKey } = req.params;

    if (!attachmentKey) {
      return res.status(400).json({
        success: false,
        message: "Attachment key is required",
      });
    }

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }
    const updatedAttachments = ticket.attachments.filter(
      (a) => a.key !== attachmentKey
    );
    if (updatedAttachments.length === ticket.attachments.length) {
      return res.status(404).json({
        success: false,
        message: "Attachment not found",
      });
    }
    await deleteFileFromS3(attachmentKey);
    ticket.attachments = updatedAttachments;
    await ticket.save();

    return res.status(200).json({
      success: true,
      message: "Attachment deleted successfully",
      data: ticket,
    });

  } catch (err) {
    console.log("DELETE ATTACHMENT ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Error deleting attachment",
    });
  }
};
export const deleteTicketController = async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.user_type !== "admin") {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete tickets",
      });
    }

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }
    if (ticket.attachments?.length > 0) {
      for (const file of ticket.attachments) {
        if (!file.key) continue;

        try {
          const deleted = await deleteFileFromS3(file.key);

          if (deleted) {
            console.log("🗑️ Deleted from S3:", file.key);
          } else {
            console.log("⚠️ Failed to delete S3 object:", file.key);
          }
        } catch (err) {
          console.log("⚠️ S3 delete error:", err.message);
        }
      }
    }
    await Ticket.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Ticket and attachments deleted successfully",
    });

  } catch (err) {
    console.log("DELETE TICKET ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while deleting ticket",
      error: err.message,
    });
  }
};

