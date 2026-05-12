const { z } = require("zod");

const createLegacyPatientSchema = z.object({
  body: z.object({
    cin: z.string().min(3).max(30),
    name: z.string().min(2).max(120)
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

const legacyPatientIdParamSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    id: z.string().min(1)
  }),
  query: z.object({}).optional()
});

module.exports = {
  createLegacyPatientSchema,
  legacyPatientIdParamSchema
};
