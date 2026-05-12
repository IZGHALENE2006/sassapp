const { z } = require("zod");

const checkInSchema = z.object({
  body: z.object({
    patientId: z.string().min(1)
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

const updateQueueStatusSchema = z.object({
  body: z.object({
    status: z.enum(["waiting", "called", "in_consultation", "done", "skipped"])
  }),
  params: z.object({
    id: z.string().min(1)
  }),
  query: z.object({}).optional()
});

module.exports = { checkInSchema, updateQueueStatusSchema };
