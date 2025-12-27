import ItInventoryModel from "../../model/inventory/itInventory.model.js";
import Ticket from "../../model/ticketModel/model.ticket.js";
import ExcelJS from "exceljs";
import { Readable } from "stream";
import csvParser from "csv-parser";
import fs from "fs";
import path from "path";
import { createItInventory, getAllItInventories, getItInventoryById, updateItInventoryService } from "../../service/inventoryService/itInventory.service.js";
const getChangedFields = (oldData, newData) => {
  const diff = {};
  Object.keys(newData).forEach((key) => {
    if (
      oldData[key] !== undefined &&
      String(oldData[key]) !== String(newData[key])
    ) {
      diff[key] = { old: oldData[key], new: newData[key] };
    }
  });
  return diff;
};

export const createItInventoryController = async (req, res) => {
  try {
    const itInventory = await createItInventory({ ...req.body, requestedBy: req.user._id });
    return res.status(200).json({ success: true, message: "Inventory Created Successfully", data: itInventory });
  } catch (err) {
    console.log(err)
    return res.status(400).json({ success: false, message: "Error creating It Inventory", error: err.message });
  }
};

export const getPcOptions = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const skip = parseInt(req.query.skip) || 0;
    const search = req.query.search?.trim() || "";

    const query = {
      status: { $ne: "retired" },
    };

    if (search) {
      query.$or = [
        { tagNoCpu: { $regex: search, $options: "i" } }
      ];
    }

    const pcs = await ItInventoryModel.find(query)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const blockedPcIds = await Ticket.distinct("pc", {
      status: { $in: ['open', 'in-progress'] },
      pc: { $ne: null }
    });

    const blockedPcIdStrings = blockedPcIds.map(id => id.toString());

    const result = pcs.map((pc) => ({
      _id: pc._id,
      tag: pc.tagNoCpu,
      displayName: `${pc.tagNoCpu} - ${pc.manufactureBy} (${pc.ram}/${pc.storage})`,
      disabled: blockedPcIdStrings.includes(pc._id.toString()),
    }));

    return res.json({ success: true, data: result });
  } catch (error) {
    console.error("Error fetching PCs:", error);
    res.status(500).json({ success: false, message: "Failed to fetch PCs." });
  }
};


export const getItInventoryController = async (req, res) => {
  try {
    const filters = { ...req.query };
    
    const itInventory = await getAllItInventories(filters);

    return res.status(200).json({ success: true, data: itInventory });
  } catch (err) {
    
    return res.status(500).json({
      success: false,
      message: "Error fetching IT inventories",
      error: err.message,
    });
  }
};

export const updateItInventoryControler = async (req, res) => {
  try {
    const itInventory = await updateItInventoryService(req.params.id, req.body);
    return res.status(200).json({ success: true, data: itInventory });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Error fetching IT inventories",
      error: err.message,
    });
  }
}

export const getItInventoryByIdController = async (req, res) => {
  try {
    const itInventory = await getItInventoryById(req.params.id);
    return res.status(200).json({ success: true, data: itInventory });
  } catch (err) {
    
    return res.status(500).json({
      success: false,
      message: "Error fetching IT inventories",
      error: err.message,
    });
  }
};
const normalizeRow = (row) => {
  const clean = {};
  Object.keys(row).forEach((key) => {
    const v = row[key];
    if (v === undefined || v === null || v === "") return;

    if (v instanceof Date) {
      clean[key] = v.toISOString().slice(0, 10);
    } else {
      clean[key] = v;
    }
  });
  return clean;
};
// export const importInventoryExcel = async (req, res) => {
//   try {
//     const file = req.files?.[0];
//     if (!file) {
//       return res.status(400).json({
//         success: false,
//         message: "No file uploaded",
//       });
//     }

//     const ext = (file.originalname.split(".").pop() || "").toLowerCase();
//     let rows = [];

//     // ------------------------------------------------------
//     // 1️⃣ HANDLE CSV IMPORT
//     // ------------------------------------------------------
//     if (ext === "csv") {
//       const csvText = file.buffer.toString("utf8");

//       const stream = Readable.from(csvText);

//       const results = await new Promise((resolve, reject) => {
//         const arr = [];
//         stream
//           .pipe(csvParser())
//           .on("data", (row) => {
//             // SAFE cleaning
//             Object.keys(row).forEach((k) => {
//               if (row[k] === undefined || row[k] === null) row[k] = "";
//               row[k] = row[k].toString().trim();
//             });
//             arr.push(row);
//           })
//           .on("end", () => resolve(arr))
//           .on("error", reject);
//       });

//       rows = results.map((r) => normalizeRow(r));
//     }

//     // ------------------------------------------------------
//     // 2️⃣ HANDLE EXCEL IMPORT (.xlsx / .xls)
//     // ------------------------------------------------------
//     if (ext === "xlsx" || ext === "xls") {
//       const workbook = new ExcelJS.Workbook();
//       await workbook.xlsx.load(file.buffer);

//       const sheet = workbook.getWorksheet(1);
//       if (!sheet) {
//         return res.status(400).json({
//           success: false,
//           message: "Invalid Excel file",
//         });
//       }

//       // Read header row
//       const headerRow = sheet.getRow(1).values.slice(1).map((h) => String(h || "").trim());

//       sheet.eachRow((row, rowNum) => {
//         if (rowNum === 1) return;

//         const values = row.values.slice(1);

//         const obj = {};
//         values.forEach((cell, idx) => {
//           const field = headerRow[idx];
//           if (!field) return;

//           if (cell instanceof Date) {
//             obj[field] = cell.toISOString().slice(0, 10);
//           } else {
//             obj[field] = (cell ?? "").toString().trim();
//           }
//         });

//         const clean = normalizeRow(obj);
//         if (Object.keys(clean).length) rows.push(clean);
//       });
//     }

//     // ------------------------------------------------------
//     // 3️⃣ VALIDATION
//     // ------------------------------------------------------
//     if (!rows.length) {
//       return res.status(400).json({
//         success: false,
//         message: "No valid rows found in file",
//       });
//     }

//     // ------------------------------------------------------
//     // 4️⃣ BULK UPSERT (Insert + Update)
//     // ------------------------------------------------------
//     const ops = [];
//     let skipped = 0;

//     rows.forEach((item) => {
//       if (!item.tagNoCpu || item.tagNoCpu.trim() === "") {
//         skipped++;
//         return;
//       }

//       ops.push({
//         updateOne: {
//           filter: { tagNoCpu: item.tagNoCpu },
//           update: { $set: item },
//           upsert: true,
//         },
//       });
//     });

//     const result = await ItInventoryModel.bulkWrite(ops);

//     return res.json({
//       success: true,
//       message: "Import completed successfully",
//       inserted: result.upsertedCount,
//       updated: result.modifiedCount,
//       skipped,
//       totalRows: rows.length,
//       fileType: ext,
//     });
//   } catch (err) {
//     console.log("IMPORT ERROR:", err);
//     return res.status(500).json({
//       success: false,
//       message: err.message,
//     });
//   }
// };
export const importInventoryExcel = async (req, res) => {
  try {
    const file = req.files?.[0];
    if (!file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const ext = (file.originalname.split(".").pop() || "").toLowerCase();
    let rows = [];

    // ------------------------------------------------------
    // 1️⃣ HANDLE CSV IMPORT
    // ------------------------------------------------------
    if (ext === "csv") {
      const csvText = file.buffer.toString("utf8");
      const stream = Readable.from(csvText);

      const results = await new Promise((resolve, reject) => {
        const arr = [];
        stream
          .pipe(csvParser())
          .on("data", (row) => {
            Object.keys(row).forEach((k) => {
              if (row[k] === undefined || row[k] === null) row[k] = "";
              row[k] = row[k].toString().trim();
            });
            arr.push(row);
          })
          .on("end", () => resolve(arr))
          .on("error", reject);
      });

      rows = results.map((r) => normalizeRow(r));
    }

    // ------------------------------------------------------
    // 2️⃣ HANDLE EXCEL IMPORT (.xlsx / .xls)
    // ------------------------------------------------------
    if (ext === "xlsx" || ext === "xls") {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(file.buffer);

      const sheet = workbook.getWorksheet(1);
      if (!sheet) {
        return res.status(400).json({
          success: false,
          message: "Invalid Excel file",
        });
      }

      // Read header row
      const headerRow = sheet
        .getRow(1)
        .values.slice(1)
        .map((h) => String(h || "").trim());

      sheet.eachRow((row, rowNum) => {
        if (rowNum === 1) return;

        const values = row.values.slice(1);
        const obj = {};

        values.forEach((cell, idx) => {
          const field = headerRow[idx];
          if (!field) return;

          if (cell instanceof Date) {
            obj[field] = cell.toISOString().slice(0, 10);
          } else {
            obj[field] = (cell ?? "").toString().trim();
          }
        });

        const clean = normalizeRow(obj);
        if (Object.keys(clean).length) rows.push(clean);
      });
    }

    // ------------------------------------------------------
    // 3️⃣ VALIDATION
    // ------------------------------------------------------
    if (!rows.length) {
      return res.status(400).json({
        success: false,
        message: "No valid rows found in file",
      });
    }

    // ------------------------------------------------------
    // 4️⃣ DATA NORMALIZATION + BULK UPSERT
    // ------------------------------------------------------
    const ops = [];
    let skipped = 0;

    rows.forEach((item) => {
      if (item.category) {
        const c = String(item.category).toLowerCase();
        if (c.startsWith("comp")) item.category = "Computers";
        else if (c.startsWith("disp") || c.startsWith("mon"))
          item.category = "Display";
      }
      if (item.price !== undefined && item.price !== null && item.price !== "") {
        const num = Number(item.price);
        if (!isNaN(num)) item.price = num;
      }
      if (typeof item.software === "string" && item.software.length > 0) {
        item.software = item.software
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }

      const tagCpu = item.tagNoCpu?.trim();
      const tagDisplay = item.displayTag?.trim();
      if (!tagCpu && !tagDisplay) {
        skipped++;
        return;
      }

      let filter = {};
      if (tagCpu && tagDisplay) {
        filter = { $or: [{ tagNoCpu: tagCpu }, { displayTag: tagDisplay }] };
      } else if (tagCpu) {
        filter = { tagNoCpu: tagCpu };
      } else {
        filter = { displayTag: tagDisplay };
      }

      ops.push({
        updateOne: {
          filter,
          update: { $set: item },
          upsert: true,
        },
      });
    });

    if (!ops.length) {
      return res.status(400).json({
        success: false,
        message: "No valid rows with tagNoCpu or displayTag",
      });
    }

    const result = await ItInventoryModel.bulkWrite(ops);

    return res.json({
      success: true,
      message: "Import completed successfully",
      inserted: result.upsertedCount,
      updated: result.modifiedCount,
      skipped,
      totalRows: rows.length,
      fileType: ext,
    });
  } catch (err) {
    console.log("IMPORT ERROR:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const exportInventoryExcel = async (req, res) => {
  try {
    const items = await ItInventoryModel.find().lean();

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Inventory");

    if (!items.length) {
      sheet.addRow(["No Data Found"]);
    } else {
      const exportFields = [
        "serialNo",
        "manufactureBy",
        "brand",
        "model",
        "category",
        "subCategoery",
        "tagNoCpu",
        "displayTag",
        "operatingSystem",
        "ram",
        "storage",
        "processor",
        "price",
        "keyboard",
        "mouse",
        "keyboardTag",
        "mouseTag",
        "macAddress",
        "mainLocation",
        "location",
        "department",
        "domain",
        "statusExplain",
        "condition",
        "software",
        "assignedTo",
        "purchaseDate",
        "warrantyExpiry",
        "status",
      ];

      sheet.columns = exportFields.map((key) => ({
        header: key,
        key: key,
        width: 25,
      }));

      items.forEach((item) => {
        const row = {};
        exportFields.forEach((field) => {
          let value = item[field];
          if (Array.isArray(value)) {
            value = value.join(", ");
          }

          row[field] = value ?? "";
        });
        sheet.addRow(row);
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const fileBase64 = buffer.toString("base64");

    return res.json({
      success: true,
      fileBase64,
      fileName: "ITInventoryExport.xlsx",
    });
  } catch (err) {
    console.log("EXPORT ERROR:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};





// export const exportInventoryExcel = async (req, res) => {
//   try {
//     const items = await ItInventoryModel.find().lean();

//     const workbook = new ExcelJS.Workbook();
//     const sheet = workbook.addWorksheet("Inventory");

//     if (!items.length) {
//       sheet.addRow(["No Data Found"]);
//     } else {
//       sheet.columns = Object.keys(items[0]).map((key) => ({
//         header: key,
//         key: key,
//         width: 25,
//       }));

//       items.forEach((item) => sheet.addRow(item));
//     }

//     const buffer = await workbook.xlsx.writeBuffer();
//     const fileBase64 = buffer.toString("base64");

//     return res.json({
//       success: true,
//       fileBase64,
//       fileName: "ITInventoryExport.xlsx",
//     });
//   } catch (err) {
//     console.log("EXPORT ERROR:", err);
//     return res.status(500).json({ success: false, message: err.message });
//   }
// };


// export const downloadInventoryTemplate = async (req, res) => {
//   try {
//     const sampleHeaders = [
//   "serialNo",
//   "manufactureBy",
//   "tagNoCpu",
//   "operatingSystem",
//   "ram",
//   "storage",
//   "processor",
//   "category",
//   "subCategoery",
//   "keyboard",
//   "mouse",
//   "displayTag",
//   "keyboardTag",
//   "mouseTag",
//   "macAddress",
//   "mainLocation",
//   "location",
//   "department",
//   "domain",
//   "statusExplain",
//   "condition",
//   "software",
//   "assignedTo",
//   "purchaseDate",
//   "warrantyExpiry",
//   "status"
// ]


//     const workbook = new ExcelJS.Workbook();
//     const sheet = workbook.addWorksheet("Template");

//     sheet.addRow(sampleHeaders);

//     const buffer = await workbook.xlsx.writeBuffer();
//     const fileBase64 = buffer.toString("base64");

//     return res.json({
//       success: true,
//       fileBase64,
//       fileName: "ITInventoryTemplate.xlsx",
//     });
//   } catch (err) {
//     console.log("TEMPLATE ERROR:", err);
//     return res.status(500).json({ success: false, message: err.message });
//   }
// };
export const downloadInventoryTemplate = async (req, res) => {
  try {
    const sampleHeaders = [
      "serialNo",
      "manufactureBy",
      "brand",
      "model",
      "category",
      "subCategoery",
      "tagNoCpu",
      "displayTag",
      "operatingSystem",
      "ram",
      "storage",
      "processor",
      "price",
      "keyboard",
      "mouse",
      "keyboardTag",
      "mouseTag",
      "macAddress",
      "mainLocation",
      "location",
      "department",
      "domain",
      "statusExplain",
      "condition",
      "software",
      "assignedTo",
      "purchaseDate",
      "warrantyExpiry",
      "status",
    ];

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Template");

    sheet.addRow(sampleHeaders);

    const buffer = await workbook.xlsx.writeBuffer();
    const fileBase64 = buffer.toString("base64");

    return res.json({
      success: true,
      fileBase64,
      fileName: "ITInventoryTemplate.xlsx",
    });
  } catch (err) {
    console.log("TEMPLATE ERROR:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const updateItInventoryController = async (req, res) => {
  try {
    const userType = req.user.user_type; 

    if (!["admin", "technician"].includes(userType)) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const id = req.params.id;
    const body = req.body;

    if (!body.category) {
      return res.status(400).json({
        success: false,
        message: "Category is required",
      });
    }

    const REQUIRED_FOR_DISPLAY = new Set([
      "manufactureBy",
      "displayTag",
      "mainLocation",
      "location",
    ]);

    const REQUIRED_FOR_COMPUTERS = new Set([
      "manufactureBy",
      "tagNoCpu",
      "operatingSystem",
      "ram",
      "storage",
      "processor",
      "macAddress",
      "mainLocation",
      "location",
      "domain",
    ]);

    const requiredSet =
      body.category === "Display"
        ? REQUIRED_FOR_DISPLAY
        : REQUIRED_FOR_COMPUTERS;

    for (const field of requiredSet) {
      if (
        body[field] === undefined ||
        body[field] === null ||
        String(body[field]).trim() === ""
      ) {
        return res.status(400).json({
          success: false,
          message: `${field} cannot be empty`,
        });
      }
    }

    const updated = await ItInventoryModel.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    })
      .populate("assignedTo", "name email")
      .lean();

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Inventory not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Inventory updated successfully",
      data: updated,
    });

  } catch (err) {
    console.error("UPDATE ERROR:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
export const deleteItInventoryController = async (req, res) => {
  try {
    const userType = req.user.user_type;

    if (userType !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admin can delete inventory",
      });
    }

    const id = req.params.id;

    const exists = await ItInventoryModel.findById(id);
    if (!exists) {
      return res.status(404).json({
        success: false,
        message: "Inventory not found",
      });
    }

    await ItInventoryModel.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Inventory deleted successfully",
    });

  } catch (err) {
    console.error("DELETE ERROR:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
// export const getInventoryByIdController = async (req, res) => {
//   try {
//     const userType = req.user.user_type;
//     if (!["admin", "technician"].includes(userType)) {
//       return res.status(403).json({
//         success: false,
//         message: "Access denied",
//       });
//     }

//     const id = req.params.id;

//     // FETCH ITEM
//     let data = await ItInventoryModel.findById(id)
//       .populate("assignedTo", "name email")
//       .lean();

//     if (!data) {
//       return res.status(404).json({
//         success: false,
//         message: "Inventory not found",
//       });
//     }
//     data.token =
//       data.category === "Computers"
//         ? data.tagNoCpu || null
//         : data.displayTag || null;
//     const ticketCount = await Ticket.countDocuments({ pc: id });
//     data.ticketCount = ticketCount;
//     const REQUIRED_FOR_DISPLAY = new Set([
//       "manufactureBy",
//       "displayTag",
//       "mainLocation",
//       "location",
//     ]);

//     const REQUIRED_FOR_COMPUTERS = new Set([
//       "manufactureBy",
//       "tagNoCpu",
//       "operatingSystem",
//       "ram",
//       "storage",
//       "processor",
//       "macAddress",
//       "mainLocation",
//       "location",
//       "domain",
//     ]);

//     const requiredSet =
//       data.category === "Display"
//         ? REQUIRED_FOR_DISPLAY
//         : REQUIRED_FOR_COMPUTERS;

//     const missing = [];

//     for (const field of requiredSet) {
//       if (!data[field] || String(data[field]).trim() === "") {
//         missing.push(field);
//         data[field] = ""; 
//       }
//     }

//     data.requiredFields = [...requiredSet];
//     data.missingRequiredFields = missing;
//     data.options = {
//       categories: ["Computers", "Display"],
//       conditions: ["Good", "Fair", "Poor", "Damaged"],
//       status: ["available", "in-use", "repair", "retired"],
//       domains: ["ifda.local", "workgroup"],
//       mainLocations: ["Kalkaji G33", "Kalkaji H18", "Badarpur"],
//       departments: [
//         "Basic Lab",
//         "Graphic Lab",
//         "Backend",
//         "Counselor",
//         "HR",
//         "Server",
//       ],
//     };

//     return res.status(200).json({
//       success: true,
//       data,
//     });
//   } catch (err) {
//     console.error("GET BY ID ERROR:", err);
//     return res.status(500).json({ success: false, message: err.message });
//   }
// };
// export const getAllInventoryController = async (req, res) => {
//   try {
//     const userType = req.user.user_type;

//     if (userType !== "admin") {
//       return res.status(403).json({
//         success: false,
//         message: "Only admin can view full inventory list",
//       });
//     }

//     let data = await ItInventoryModel.find({})
//       .populate("assignedTo", "name email").populate("")
//       .sort({ updatedAt: -1 })
//       .lean();

//     data = await Promise.all(
//       data.map(async (item) => {
//         const ticketCount = await Ticket.countDocuments({ pc: item._id });

//         // TOKEN (tagNoCpu for Computers, displayTag for Display)
//         const token =
//           item.category === "Computers"
//             ? item.tagNoCpu || null
//             : item.displayTag || null;

//         return {
//           ...item,
//           token,
//           ticketCount,
//         };
//       })
//     );

//     return res.status(200).json({
//       success: true,
//       count: data.length,
//       data,
//     });
//   } catch (err) {
//     console.error("GET ALL ERROR:", err);
//     return res.status(500).json({ success: false, message: err.message });
//   }
// };
export const getLastUpdatedById = async (req, res) => {
  try {
    const id = req.params.id;

    const data = await ItInventoryModel.findById(id)
      .select("manufactureBy category tagNoCpu description  displayTag updatedAt")
      .sort({ updatedAt: -1 })
      .populate("updateHistory.updatedBy", "name email")
      .lean();

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Inventory not found",
      });
    }

    const last = data.updateHistory?.[data.updateHistory.length - 1] || null;

    return res.status(200).json({
      success: true,
      lastUpdate: last,
      updatedAt: data.updatedAt,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
// 🟩 Fetch ALL ITEMS sorted by LAST UPDATED (descending)
export const getAllLastUpdated = async (req, res) => {
  try {
    const items = await ItInventoryModel.find({})
      .select("manufactureBy category tagNoCpu description  displayTag updatedAt")
      .sort({ updatedAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: items.length,
      data: items,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 🟪 Fetch FULL UPDATE HISTORY of one item
export const getFullUpdateHistory = async (req, res) => {
  try {
    const id = req.params.id;

    const data = await ItInventoryModel.findById(id)
      .select("updateHistory manufactureBy tagNoCpu displayTag category")
      .populate("updateHistory.updatedBy", "name email")
      .lean();

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Inventory not found",
      });
    }

    return res.status(200).json({
      success: true,
      item: {
        manufactureBy: data.manufactureBy,
        tagNoCpu: data.tagNoCpu,
        displayTag: data.displayTag,
        category: data.category,
      },
      history: data.updateHistory.reverse(), // newest first
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};



export const getInventoryByIdController = async (req, res) => {
  try {
    const userType = req.user.user_type;
    if (!["admin", "technician"].includes(userType)) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const id = req.params.id;

    // FETCH ITEM
    let data = await ItInventoryModel.findById(id)
      .populate("assignedTo", "name email")
      .lean();

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Inventory not found",
      });
    }

    // TOKEN FOR UI DISPLAY
    data.token =
      data.category === "Computers"
        ? data.tagNoCpu || null
        : data.displayTag || null;

    // ⭐ FIXED: COUNT ALL TICKETS RELATED TO THIS INVENTORY
    data.ticketCount = await Ticket.countDocuments({ pc: id });

    // REQUIRED FIELD LOGIC (unchanged)
    const REQUIRED_FOR_DISPLAY = new Set([
      "manufactureBy",
      "displayTag",
      "mainLocation",
      "location",
    ]);

    const REQUIRED_FOR_COMPUTERS = new Set([
      "manufactureBy",
      "tagNoCpu",
      "operatingSystem",
      "ram",
      "storage",
      "processor",
      "macAddress",
      "mainLocation",
      "location",
      "domain",
    ]);

    const requiredSet =
      data.category === "Display"
        ? REQUIRED_FOR_DISPLAY
        : REQUIRED_FOR_COMPUTERS;

    const missing = [];
    for (const field of requiredSet) {
      if (!data[field] || String(data[field]).trim() === "") {
        missing.push(field);
        data[field] = "";
      }
    }

    // Extra options (unchanged)
    data.requiredFields = [...requiredSet];
    data.missingRequiredFields = missing;
    data.options = {
      categories: ["Computers", "Display"],
      conditions: ["Good", "Fair", "Poor", "Damaged"],
      status: ["available", "in-use", "repair", "retired"],
      domains: ["ifda.local", "workgroup"],
      mainLocations: ["Kalkaji G33", "Kalkaji H18", "Badarpur"],
      departments: [
        "Basic Lab",
        "Graphic Lab",
        "Backend",
        "Counselor",
        "HR",
        "Server",
      ],
    };

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    console.error("GET BY ID ERROR:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
export const getAllInventoryController = async (req, res) => {
  try {
    const userType = req.user.user_type;

    if (userType !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admin can view full inventory list",
      });
    }

    let data = await ItInventoryModel.find({})
      .populate("assignedTo", "name email")
      .sort({ updatedAt: -1 })
      .lean();

    // ⭐ FIX: Count tickets for each Inventory item
    data = await Promise.all(
      data.map(async (item) => {
        const ticketCount = await Ticket.countDocuments({ pc: item._id });

        const token =
          item.category === "Computers"
            ? item.tagNoCpu || null
            : item.displayTag || null;

        return {
          ...item,
          token,
          ticketCount,
        };
      })
    );

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (err) {
    console.error("GET ALL ERROR:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};







// export const updateItInventoryController = async (req, res) => {
//   try {
//     const userType = req.user.user_type;

//     if (!["admin", "technician"].includes(userType)) {
//       return res.status(403).json({
//         success: false,
//         message: "Access denied",
//       });
//     }

//     const id = req.params.id;
//     const body = req.body;

//     if (!body.category) {
//       return res.status(400).json({
//         success: false,
//         message: "Category is required",
//       });
//     }

//     const REQUIRED_FOR_DISPLAY = new Set([
//       "manufactureBy",
//       "displayTag",
//       "mainLocation",
//       "location",
//     ]);

//     const REQUIRED_FOR_COMPUTERS = new Set([
//       "manufactureBy",
//       "tagNoCpu",
//       "operatingSystem",
//       "ram",
//       "storage",
//       "processor",
//       "macAddress",
//       "mainLocation",
//       "location",
//       "domain",
//     ]);

//     const requiredSet =
//       body.category === "Display"
//         ? REQUIRED_FOR_DISPLAY
//         : REQUIRED_FOR_COMPUTERS;

//     for (const field of requiredSet) {
//       if (
//         body[field] === undefined ||
//         body[field] === null ||
//         String(body[field]).trim() === ""
//       ) {
//         return res.status(400).json({
//           success: false,
//           message: `${field} cannot be empty`,
//         });
//       }
//     }

//     // Get OLD DATA (for history)
//     const oldData = await ItInventoryModel.findById(id).lean();
//     if (!oldData) {
//       return res.status(404).json({
//         success: false,
//         message: "Inventory not found",
//       });
//     }

//     // Detect changes
//     const changes = getChangedFields(oldData, body);

//     // Perform update
//     const updated = await ItInventoryModel.findByIdAndUpdate(id, body, {
//       new: true,
//       runValidators: true,
//     })
//       .populate("assignedTo", "name email");

//     // Save update history only when fields changed
//     if (Object.keys(changes).length > 0) {
//       updated.updateHistory.push({
//         updatedBy: req.user._id,
//         updatedAt: new Date(),
//         changes,
//       });
//       await updated.save();
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Inventory updated successfully",
//       data: updated.toObject(),
//     });

//   } catch (err) {
//     console.error("UPDATE ERROR:", err);
//     return res.status(500).json({ success: false, message: err.message });
//   }
// };