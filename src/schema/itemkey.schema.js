import yup from "yup";

export const inventoryKeyUsageSchema = yup.object({
  body: yup.object({
     name: yup
      .string()
      .required("Name is required")
      .min(3, "Name must be at least 3 characters") 
   })
});