const { z } = require("zod");

const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    role: z.enum(["admin", "receptionist"]).optional()
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

const loginBodySchema = z
  .object({
    email: z.string().email().optional(),
    password: z.string().min(1).optional(),
    role: z.enum(["admin", "receptionist", "doctor"]).optional(),
    code: z.string().min(1).optional()
  })
  .superRefine((value, ctx) => {
    if (value.role) {
      if (!value.code && !value.password) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Password is required for role login",
          path: ["password"]
        });
      }
      return;
    }

    if (value.email) {
      if (!value.password) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Password is required for email login",
          path: ["password"]
        });
      }
      return;
    }

    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Provide either email/password or role/password",
      path: ["email"]
    });
  });

const loginSchema = z.object({
  body: loginBodySchema,
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

module.exports = { registerSchema, loginSchema };
