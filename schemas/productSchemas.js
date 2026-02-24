const { z } = require("zod");

/**
 * Product name validation
 * Allows alphanumeric characters, spaces, and common punctuation
 */
const productNameSchema = z
  .string()
  .min(2, "Product name must be at least 2 characters")
  .max(200, "Product name must not exceed 200 characters")
  .trim()
  .refine(
    (name) => /^[a-zA-Z0-9\s\-_.,'&()]+$/.test(name),
    "Product name can only contain letters, numbers, spaces, and basic punctuation (- _ . , ' &)"
  );

/**
 * Product quantity validation
 * Must be an integer between 0 and 999999
 */
const quantitySchema = z
  .union([z.number(), z.string()])
  .refine(
    (val) => {
      const num = typeof val === "string" ? parseInt(val, 10) : val;
      return Number.isInteger(num);
    },
    "Quantity must be a whole number"
  )
  .refine(
    (val) => {
      const num = typeof val === "string" ? parseInt(val, 10) : val;
      return num >= 0;
    },
    "Quantity must be 0 or greater"
  )
  .refine(
    (val) => {
      const num = typeof val === "string" ? parseInt(val, 10) : val;
      return num <= 999999;
    },
    "Quantity must not exceed 999999"
  )
  .transform((val) => (typeof val === "string" ? parseInt(val, 10) : val));

/**
 * Image URL validation
 * Must be a valid HTTP(S) URL
 */
const imageUrlSchema = z
  .string()
  .url("Image must be a valid URL")
  .refine(
    (url) => url.startsWith("http://") || url.startsWith("https://"),
    "Image URL must start with http:// or https://"
  )
  .max(500, "Image URL must not exceed 500 characters")
  .optional()
  .or(z.literal(""));

/**
 * Create product validation schema
 * Validates product creation data (storeId comes from URL params)
 */
const createProductSchema = z.object({
  name: productNameSchema,
  quantity: quantitySchema,
  image: imageUrlSchema,
});

/**
 * Update product validation schema
 * Validates product update data
 */
const updateProductSchema = z.object({
  name: productNameSchema.optional(),
  quantity: quantitySchema.optional(),
  image: imageUrlSchema.optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  "At least one field must be provided for update"
);

/**
 * Product ID validation
 * Standard MongoDB ObjectId format
 */
const productIdSchema = z.object({
  productId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid product ID"),
});

module.exports = {
  createProductSchema,
  updateProductSchema,
  productIdSchema,
};
