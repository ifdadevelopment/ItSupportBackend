import * as yup from "yup";

const conditionEnum = ["Good", "Fair", "Poor", "Damaged"];
const statusEnum = ["available", "in-use", "repair", "retired"];

const itInventoryCreateSchema = yup.object({
  body: yup.object({
    manufactureBy: yup.string().nullable().max(100),
    tagNoCpu: yup.string().nullable().max(50).uppercase(),
    operatingSystem: yup.string().nullable().max(100),
    ram: yup.string().nullable().max(50),
    storage: yup.string().nullable().max(50),
    processor: yup.string().nullable().max(100),
    price: yup.string().nullable(),
    keyboard: yup.string().nullable().max(100),
    mouse: yup.string().nullable().max(100),
    displayTag: yup.string().nullable().max(50),
    keyboardTag: yup.string().nullable().max(50),
    mouseTag: yup.string().nullable().max(50),

    location: yup.string().nullable().max(200),
    department: yup.string().nullable().max(100),
    domain: yup.string().nullable().max(100),

    statusExplain: yup.string().nullable().max(200),
    condition: yup.string().nullable().oneOf(conditionEnum),
    software: yup.array().nullable().of(yup.string()),

    // purchaseDate: yup.date().nullable(),
    // warrantyExpiry: yup.date().nullable(),

    status: yup.string().nullable().oneOf(statusEnum),
    macAddress: yup.string().nullable(),
  }),
});

//
// UPDATE — all fields nullable
//
const itInventoryUpdateSchema = yup.object({
  body: yup.object({
    manufactureBy: yup.string().nullable().max(100),
    tagNoCpu: yup.string().nullable().max(50).uppercase(),
    operatingSystem: yup.string().nullable().max(100),
    ram: yup.string().nullable().max(50),
    storage: yup.string().nullable().max(50),
    processor: yup.string().nullable().max(100),
    price: yup.string().nullable(),
    keyboard: yup.string().nullable().max(100),
    mouse: yup.string().nullable().max(100),
    displayTag: yup.string().nullable().max(50),
    keyboardTag: yup.string().nullable().max(50),
    mouseTag: yup.string().nullable().max(50),

    macAddress: yup.string()
      .nullable()
      .matches(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/, "Invalid MAC address"),

    location: yup.string().nullable().max(200),
    department: yup.string().nullable().max(100),
    domain: yup.string().nullable().max(100),

    statusExplain: yup.string().nullable().max(200),
    condition: yup.string().nullable().oneOf(conditionEnum),
    software: yup.array().nullable().of(yup.string()),

    assignedTo: yup.string().nullable(),
    // purchaseDate: yup.date().nullable(),
    // warrantyExpiry: yup.date().nullable(),

    status: yup.string().nullable().oneOf(statusEnum),
  }),
});

export { itInventoryCreateSchema, itInventoryUpdateSchema };
