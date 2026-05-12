export const PERMISSIONS = Object.freeze({
  DASHBOARD_VIEW: "dashboard.view",

  PATIENT_CREATE: "patient.create",
  PATIENT_READ: "patient.read",
  PATIENT_UPDATE: "patient.update",
  PATIENT_DELETE: "patient.delete",
  PATIENT_HISTORY: "patient.history",

  QUEUE_CHECKIN: "queue.checkin",
  QUEUE_READ: "queue.read",
  QUEUE_UPDATE_STATUS: "queue.update_status",

  APPOINTMENT_CREATE: "appointment.create",
  APPOINTMENT_READ: "appointment.read",
  APPOINTMENT_UPDATE: "appointment.update",
  APPOINTMENT_DELETE: "appointment.delete",

  VISIT_CREATE: "visit.create",
  VISIT_READ: "visit.read",

  PAYMENT_CREATE: "payment.create",
  PAYMENT_READ: "payment.read",

  REVENUE_REPORT_READ: "revenue_report.read"
});

export function hasPermission(user, action) {
  if (!user || !action) return false;
  if (user.role === "admin") return true;
  const userPermissions = Array.isArray(user.permissions) ? user.permissions : [];
  return userPermissions.includes(action);
}
