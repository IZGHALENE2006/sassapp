const roles = require("./roles");

const ACTIONS = Object.freeze({
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

const ALL_ACTIONS = Object.values(ACTIONS);

const ROLE_PERMISSIONS = {
  [roles.ADMIN]: ALL_ACTIONS,
  [roles.RECEPTIONIST]: [
    ACTIONS.DASHBOARD_VIEW,
    ACTIONS.PATIENT_CREATE,
    ACTIONS.PATIENT_READ,
    ACTIONS.PATIENT_UPDATE,
    ACTIONS.PATIENT_DELETE,
    ACTIONS.PATIENT_HISTORY,
    ACTIONS.QUEUE_CHECKIN,
    ACTIONS.QUEUE_READ,
    ACTIONS.QUEUE_UPDATE_STATUS,
    ACTIONS.APPOINTMENT_CREATE,
    ACTIONS.APPOINTMENT_READ,
    ACTIONS.APPOINTMENT_UPDATE,
    ACTIONS.APPOINTMENT_DELETE,
    ACTIONS.VISIT_READ,
    ACTIONS.PAYMENT_CREATE,
    ACTIONS.PAYMENT_READ,
    ACTIONS.REVENUE_REPORT_READ
  ]
};

const LEGACY_ROLE_ALIASES = {
  doctor: roles.ADMIN
};

const resolveRole = (role) => LEGACY_ROLE_ALIASES[role] || role;

const getPermissionsByRole = (role) => ROLE_PERMISSIONS[resolveRole(role)] || [];

const hasPermission = (role, action) => getPermissionsByRole(role).includes(action);

module.exports = {
  ACTIONS,
  ROLE_PERMISSIONS,
  ALL_ACTIONS,
  resolveRole,
  getPermissionsByRole,
  hasPermission
};
