const { z } = require("zod");

const createPatientSchema = z.object({
  body: z.object({
    cin: z.string().min(4),
    name: z.string().min(2),
    phone: z.string().min(6),
    recordSource: z.enum(["regular", "legacy"]).optional(),
    dateOfBirth: z.string().datetime().optional(),
    gender: z.enum(["male", "female", "other"]).optional(),
    address: z.string().optional()
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

const searchPatientSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z
    .object({
      cin: z.string().optional(),
      phone: z.string().optional(),
      name: z.string().optional(),
      segment: z.enum(["regular", "legacy", "all"]).optional()
    })
    .refine((data) => data.cin || data.phone || data.name, {
      message: "At least one search parameter is required"
    })
});

const patientIdParamSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    id: z.string().min(1)
  }),
  query: z.object({}).optional()
});

const updatePatientSchema = z.object({
  body: z
    .object({
      cin: z.string().min(4).optional(),
      name: z.string().min(2).optional(),
      phone: z.string().min(6).optional(),
      recordSource: z.enum(["regular", "legacy"]).optional(),
      dateOfBirth: z.string().datetime().optional(),
      gender: z.enum(["male", "female", "other"]).optional(),
      address: z.string().optional()
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field is required to update patient"
    }),
  params: z.object({
    id: z.string().min(1)
  }),
  query: z.object({}).optional()
});

module.exports = {
  createPatientSchema,
  searchPatientSchema,
  patientIdParamSchema,
  updatePatientSchema
};
