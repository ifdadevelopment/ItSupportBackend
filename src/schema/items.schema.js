import * as yup from "yup";

// -------------------------------
// Create Validation Schema
// -------------------------------
const inventoryItemCreateSchema = yup.object({
  body: yup.object({
    name : yup
      .string()
      .required("Item name is required")
      .max(100, "Item name must be at most 100 characters"),
    price : yup
      .number()
      .required("Price is required")
      .min(0, "Price cannot be negative"),
    quantity : yup
      .number()
      .required("Quantity is required")
      .min(1, "Quantity must be at least 1")
  }),
});

// -------------------------------
// Update Validation Schema
// -------------------------------
const inventoryItemUpdateSchema = yup.object({
  body: yup.object({
    name: yup.string().max(100, "Item name must be at most 100 characters"),
    price: yup
      .number()
      .min(0, "Price cannot be negative"),
    quantity: yup
      .number()
      .min(1, "Quantity must be at least 1"),
    user: yup
      .string()
      .matches(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId format"),
  }),
});

const inventoryItemUsageSchema = yup.object({
  body: yup.object({
    itemId: yup
      .string()
      .required("Inventory ID is required")
      .matches(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId format"),
    systemId: yup
      .string()
      .required("Inventory ID is required")
      .matches(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId format"),

    quantity: yup
      .number()
      .required("Quantity is required")
      .min(1, "Quantity must be at least 1"),
  }),
});


export { inventoryItemCreateSchema, inventoryItemUpdateSchema, inventoryItemUsageSchema };
