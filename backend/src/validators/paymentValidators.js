const { z } = require("zod");

const createPaymentSchema = z.object({
  body: z.object({
    patientId: z.string().min(1),
    amount: z.number().positive(),
    type: z.enum(["consultation", "analysis"]),
    method: z.enum(["cash", "card", "transfer"]).optional(),
    paymentDate: z.string().datetime().optional()
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

module.exports = { createPaymentSchema };
