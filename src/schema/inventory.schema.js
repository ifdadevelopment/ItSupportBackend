import * as yup from "yup";

// Inventory create validation
const inventoryCreateSchema = yup.object({
  body: yup.object({
    name: yup.string()
      .required("Item name is required")
      .max(100, "Item name cannot exceed 100 characters"),
    category: yup.string()
      .required("Category is required")
      .oneOf([
        "Computer",
        "Laptop",
        "Printer",
        "Monitor",
        "Networking Equipment",
        "Mobile",
        "Tablet",
        "Server",
        "Other"
      ], "Invalid category"),

    brand: yup.string()
      .max(50, "Brand name cannot exceed 50 characters"),

    model: yup.string()
      .max(50, "Model name cannot exceed 50 characters"),

    serialNumber: yup.string()
      .required("Serial number is required")
      .max(50, "Serial number cannot exceed 50 characters"),

    location: yup.string()
      .required("Location is required")
      .max(100, "Location cannot exceed 100 characters"),

    status: yup.string()
      .oneOf(["available", "in-use", "maintenance", "retired"], "Invalid status")
      .default("available"),

    condition: yup.string()
      .oneOf(["Excellent", "Good", "Fair", "Poor"], "Invalid condition")
      .default("Good"),

    purchaseDate: yup.date().nullable(),
    warrantyExpiry: yup.date().nullable(),

    price: yup.number()
      .min(0, "Price cannot be negative")
      .default(0),

    description: yup.string()
      .max(500, "Description cannot exceed 500 characters"),

    assignedTo: yup.string().nullable(),
    assignedDate: yup.date().nullable(),
    lastMaintenanceDate: yup.date().nullable(),
    nextMaintenanceDate: yup.date().nullable(),

    tags: yup.array().of(yup.string()),

    images: yup.array().of(
      yup.object({
        url: yup.string().url("Invalid image URL"),
        description: yup.string()
      })
    ),

    isActive: yup.boolean().default(true),
  })
});

// Inventory update validation
const inventoryUpdateSchema = yup.object({
  body: yup.object({
    name: yup.string().max(100, "Item name cannot exceed 100 characters"),
    category: yup.string().oneOf([
      "Computer",
      "Laptop",
      "Printer",
      "Monitor",
      "Networking Equipment",
      "Mobile",
      "Tablet",
      "Server",
      "Other"
    ], "Invalid category"),
    brand: yup.string().max(50),
    model: yup.string().max(50),
    serialNumber: yup.string().max(50),
    location: yup.string().max(100),
    status: yup.string().oneOf(["available", "in-use", "maintenance", "retired"]),
    condition: yup.string().oneOf(["excellent", "good", "fair", "poor"]),
    purchaseDate: yup.date().nullable(),
    warrantyExpiry: yup.date().nullable(),
    price: yup.number().min(0),
    description: yup.string().max(500),
    assignedTo: yup.string().nullable(),
    assignedDate: yup.date().nullable(),
    lastMaintenanceDate: yup.date().nullable(),
    nextMaintenanceDate: yup.date().nullable(),
    tags: yup.array().of(yup.string()),
    images: yup.array().of(
      yup.object({
        url: yup.string().url(),
        description: yup.string()
      })
    ),
    isActive: yup.boolean(),
  })
});


// Common fields
const inventoryBaseSchema = {
  name: yup.string().max(100, "Item name cannot exceed 100 characters"),
  category: yup.string().oneOf(
    [
      "Computer",
      "Laptop",
      "Printer",
      "Monitor",
      "Networking Equipment",
      "Mobile",
      "Tablet",
      "Server",
      "Other",
    ],
    "Invalid category"
  ),
  brand: yup.string().max(50, "Brand name cannot exceed 50 characters"),
  model: yup.string().max(50, "Model name cannot exceed 50 characters"),
  serialNumber: yup.string().max(50, "Serial number cannot exceed 50 characters"),
  location: yup.string().max(100, "Location cannot exceed 100 characters"),
  status: yup
    .string()
    .oneOf(["available", "in-use", "maintenance", "retired"], "Invalid status")
    .default("available"),
  condition: yup
    .string()
    .oneOf(["Excellent", "Good", "Fair", "Poor"], "Invalid condition")
    .default("Good"),
  purchaseDate: yup.date().nullable(),
  warrantyExpiry: yup.date().nullable(),
  price: yup.number().min(0, "Price cannot be negative").default(0),
  description: yup.string().max(500, "Description cannot exceed 500 characters"),
  assignedTo: yup.string().nullable(),
  assignedDate: yup.date().nullable(),
  lastMaintenanceDate: yup.date().nullable(),
  nextMaintenanceDate: yup.date().nullable(),
  tags: yup.array().of(yup.string()),
  images: yup.array().of(
    yup.object({
      url: yup.string().url("Invalid image URL"),
      description: yup.string(),
    })
  ),
  isActive: yup.boolean().default(true),
};

// Create schema (extends base + required fields)

export { inventoryCreateSchema, inventoryUpdateSchema, inventoryBaseSchema };
