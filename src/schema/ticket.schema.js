import * as yup from "yup";

// Ticket create validation
const ticketCreateSchema = yup.object({
  body: yup.object({
    title: yup.string()
      .required("Title is required")
      .max(200, "Title cannot exceed 200 characters"),
    description: yup.string()
      .required("Description is required")
      .max(2000, "Description cannot exceed 2000 characters"),
    category: yup.string()
      .required("Category is required")
      .oneOf([
        "Hardware Issue",
        "Software Issue",
        "Network Issue",
        "Printer Issue",
        "Email Issue",
        "Password Reset",
        "New Equipment Request",
        "Software Installation",
        "Other"
      ], "Invalid category"),
    priority: yup.string()
      .oneOf(["Low", "Medium", "High", "Urgent"], "Invalid priority")
      .default("medium"),
    assignedTo: yup.string().nullable(),
    dueDate: yup.date().nullable(),
    // tags: yup.array().of(yup.string()),
    // attachments: yup.array().of(
    //   yup.object({
    //     filename: yup.string(),
    //     originalName: yup.string(),
    //     mimetype: yup.string(),
    //     size: yup.number(),
    //     url: yup.string()
    //   })
    // ),
    // requestedBy: yup.string().required("Ticket creator is required")
      attachments: yup.array().nullable(),
  }).noUnknown(false) 
});

// Ticket update validation
const ticketUpdateSchema = yup.object({
  body: yup.object({
    title: yup.string().max(200, "Title cannot exceed 200 characters"),
    description: yup.string().max(2000, "Description cannot exceed 2000 characters"),
    category: yup.string()
      .oneOf([
        "Hardware Issue",
        "Software Issue",
        "Network Issue",
        "Printer Issue",
        "Email Issue",
        "Password Reset",
        "New Equipment Request",
        "Software Installation",
        "Other"
      ], "Invalid category"),
    priority: yup.string().oneOf(["low", "medium", "high", "urgent"], "Invalid priority"),
    status: yup.string().oneOf(["open", "in-progress", "resolved", "closed"], "Invalid status"),
    assignedTo: yup.string().nullable(),
    dueDate: yup.date().nullable(),
    tags: yup.array().of(yup.string()),
    resolution: yup.string().max(1000, "Resolution cannot exceed 1000 characters")
  })
});

export { ticketCreateSchema, ticketUpdateSchema };
