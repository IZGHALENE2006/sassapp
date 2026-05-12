const dayjs = require("dayjs");
const Appointment = require("../models/Appointment");
const Payment = require("../models/Payment");
const QueueEntry = require("../models/QueueEntry");
const asyncHandler = require("../utils/asyncHandler");
const { ACTIONS, hasPermission } = require("../constants/permissions");

const getTodayDashboard = asyncHandler(async (req, res) => {
  const now = dayjs();
  const start = dayjs().startOf("day").toDate();
  const end = dayjs().endOf("day").toDate();
  const nowDate = now.toDate();
  const queueDate = dayjs().format("YYYY-MM-DD");
  const canReadRevenue = hasPermission(req.user.role, ACTIONS.PAYMENT_READ);

  const [
    uniquePatientIds,
    revenueAggregation,
    upcomingAppointments,
    todayAppointments,
    waitingAppointments,
    overdueAppointments
  ] = await Promise.all([
      QueueEntry.distinct("patient", { queueDate }),
      canReadRevenue
        ? Payment.aggregate([
            { $match: { paymentDate: { $gte: start, $lte: end } } },
            { $group: { _id: null, totalRevenue: { $sum: "$amount" } } }
          ])
        : Promise.resolve([]),
      Appointment.find({
        dateTime: { $gte: nowDate },
        status: "scheduled"
      })
        .populate("patient", "cin name phone")
        .sort({ dateTime: 1 }),
      Appointment.find({
        dateTime: { $gte: start, $lte: end },
        status: "scheduled"
      })
        .populate("patient", "cin name phone")
        .sort({ dateTime: 1 }),
      Appointment.find({
        dateTime: { $gte: start, $lte: nowDate },
        status: "scheduled"
      })
        .populate("patient", "cin name phone")
        .sort({ dateTime: 1 }),
      Appointment.find({
        dateTime: { $lt: nowDate },
        status: "scheduled"
      })
        .populate("patient", "cin name phone")
        .sort({ dateTime: 1 })
    ]);

  const totalRevenueToday = revenueAggregation[0]?.totalRevenue || 0;

  res.json({
    totalPatientsToday: uniquePatientIds.length,
    totalRevenueToday,
    revenueVisible: canReadRevenue,
    upcomingAppointments,
    todayAppointments,
    waitingAppointments,
    waitingAppointmentsCount: waitingAppointments.length,
    overdueAppointments,
    overdueAppointmentsCount: overdueAppointments.length
  });
});

module.exports = { getTodayDashboard };
