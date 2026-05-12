const { z } = require("zod");

const createAppointmentSchema = z.object({
  body: z.object({
    patientId: z.string().min(1),
    doctorName: z.string().min(2),
    reason: z.string().optional(),
    dateTime: z.string().datetime()
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

const updateAppointmentSchema = z.object({
  body: z.object({
    doctorName: z.string().min(2).optional(),
    reason: z.string().optional(),
    dateTime: z.string().datetime().optional(),
    status: z.enum(["scheduled", "completed", "cancelled", "no_show"]).optional()
  }),
  params: z.object({
    id: z.string().min(1)
  }),
  query: z.object({}).optional()
});

const appointmentIdParamSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    id: z.string().min(1)
  }),
  query: z.object({}).optional()
});

module.exports = {
  createAppointmentSchema,
  updateAppointmentSchema,
  appointmentIdParamSchema
};
