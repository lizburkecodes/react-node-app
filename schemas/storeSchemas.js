const { z } = require("zod");

/**
 * Store name validation
 * Allows alphanumeric, spaces, and basic punctuation
 */
const storeNameSchema = z
  .string()
  .min(2, "Store name must be at least 2 characters")
  .max(150, "Store name must not exceed 150 characters")
  .trim()
  .refine(
    (name) => /^[a-zA-Z0-9\s\-_.,'&()#]+$/.test(name),
    "Store name can only contain letters, numbers, spaces, and basic punctuation (- _ . , ' & #)"
  );

/**
 * Address text validation
 * Allows standard address characters
 */
const addressTextSchema = z
  .string()
  .min(5, "Address must be at least 5 characters")
  .max(500, "Address must not exceed 500 characters")
  .trim()
  .refine(
    (addr) => /^[a-zA-Z0-9\s\-.,#&()]+$/.test(addr),
    "Address can only contain standard address characters"
  );

/**
 * Latitude validation
 * Must be between -90 and 90
 */
const latitudeSchema = z
  .union([z.number(), z.string()])
  .refine(
    (val) => {
      const num = typeof val === "string" ? parseFloat(val) : val;
      return !isNaN(num) && num >= -90 && num <= 90;
    },
    "Latitude must be a number between -90 and 90"
  )
  .transform((val) => (typeof val === "string" ? parseFloat(val) : val));

/**
 * Longitude validation
 * Must be between -180 and 180
 */
const longitudeSchema = z
  .union([z.number(), z.string()])
  .refine(
    (val) => {
      const num = typeof val === "string" ? parseFloat(val) : val;
      return !isNaN(num) && num >= -180 && num <= 180;
    },
    "Longitude must be a number between -180 and 180"
  )
  .transform((val) => (typeof val === "string" ? parseFloat(val) : val));

/**
 * Geolocation validation schema
 * Must include valid latitude and longitude
 */
const geoSchema = z.object({
  type: z.literal("Point"),
  coordinates: z.array(z.number()).length(2),
});

/**
 * Create store validation schema
 * Validates store creation data
 */
const createStoreSchema = z.object({
  name: storeNameSchema,
  addressText: addressTextSchema,
  latitude: latitudeSchema,
  longitude: longitudeSchema,
});

/**
 * Update store validation schema
 * Validates store update data
 */
const updateStoreSchema = z.object({
  name: storeNameSchema.optional(),
  addressText: addressTextSchema.optional(),
  latitude: latitudeSchema.optional(),
  longitude: longitudeSchema.optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  "At least one field must be provided for update"
);

/**
 * Search validation schema
 * Validates search/filter parameters
 */
const searchSchema = z.object({
  q: z
    .string()
    .min(1, "Search query is required")
    .max(200, "Search query must not exceed 200 characters")
    .trim()
    .refine(
      (q) => !/^[\s\W_]*$/.test(q),
      "Search query must contain at least one letter or number"
    )
    .optional()
    .or(z.literal("")),
  location: z
    .string()
    .min(1, "Location must be at least 1 character")
    .max(500, "Location must not exceed 500 characters")
    .trim()
    .optional()
    .or(z.literal("")),
  lat: latitudeSchema.optional(),
  lng: longitudeSchema.optional(),
  radiusKm: z
    .union([z.number(), z.string()])
    .refine(
      (val) => {
        const num = typeof val === "string" ? parseFloat(val) : val;
        return !isNaN(num) && num > 0 && num <= 50000;
      },
      "Radius must be a number between 1 and 50000 km"
    )
    .transform((val) => (typeof val === "string" ? parseFloat(val) : val))
    .optional(),
  page: z
    .union([z.number(), z.string()])
    .refine(
      (val) => {
        const num = typeof val === "string" ? parseInt(val, 10) : val;
        return Number.isInteger(num) && num >= 1;
      },
      "Page must be an integer >= 1"
    )
    .transform((val) => (typeof val === "string" ? parseInt(val, 10) : val))
    .optional(),
  limit: z
    .union([z.number(), z.string()])
    .refine(
      (val) => {
        const num = typeof val === "string" ? parseInt(val, 10) : val;
        return Number.isInteger(num) && num >= 1 && num <= 100;
      },
      "Limit must be an integer between 1 and 100"
    )
    .transform((val) => (typeof val === "string" ? parseInt(val, 10) : val))
    .optional(),
});

/**
 * Store ID validation
 * Standard MongoDB ObjectId format
 */
const storeIdSchema = z.object({
  storeId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid store ID"),
});

/**
 * Get stores validation schema
 * Validates pagination and sorting parameters
 */
const getStoresSchema = z.object({
  page: z
    .union([z.number(), z.string()])
    .refine(
      (val) => {
        const num = typeof val === "string" ? parseInt(val, 10) : val;
        return Number.isInteger(num) && num >= 1;
      },
      "Page must be an integer >= 1"
    )
    .transform((val) => (typeof val === "string" ? parseInt(val, 10) : val))
    .optional(),
  limit: z
    .union([z.number(), z.string()])
    .refine(
      (val) => {
        const num = typeof val === "string" ? parseInt(val, 10) : val;
        return Number.isInteger(num) && num >= 1 && num <= 100;
      },
      "Limit must be an integer between 1 and 100"
    )
    .transform((val) => (typeof val === "string" ? parseInt(val, 10) : val))
    .optional(),
  sort: z
    .string()
    .refine(
      (sort) => /^-?[a-zA-Z_]+$/.test(sort),
      "Sort must be a valid field name, optionally prefixed with '-' for descending"
    )
    .optional(),
});

module.exports = {
  createStoreSchema,
  updateStoreSchema,
  searchSchema,
  storeIdSchema,
  getStoresSchema,
};
