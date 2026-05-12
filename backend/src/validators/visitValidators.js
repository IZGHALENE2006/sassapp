const { z } = require("zod");

const medicationInputSchema = z.object({
  name: z.string().min(2),
  dosage: z.string().optional(),
  frequency: z.string().optional(),
  duration: z.string().optional(),
  quantity: z.string().optional(),
  instructions: z.string().optional()
});

const createVisitSchema = z.object({
  body: z.object({
    patientId: z.string().min(1),
    notes: z.string().optional(),
    diagnosis: z.string().optional(),
    medications: z.array(medicationInputSchema).optional(),
    prescribedMedication: z.string().optional(),
    visitDate: z.string().datetime().optional()
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

const patientVisitsSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    patientId: z.string().min(1)
  }),
  query: z.object({}).optional()
});

module.exports = { createVisitSchema, patientVisitsSchema };
