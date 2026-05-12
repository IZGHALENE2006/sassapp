const Payment = require("../models/Payment");
const Patient = require("../models/Patient");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");

const PAYMENT_TYPES = new Set(["consultation", "analysis"]);
const PAYMENT_METHODS = new Set(["cash", "card", "transfer"]);

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const createPayment = asyncHandler(async (req, res) => {
  const { patientId, amount, type, method, paymentDate } = req.validated.body;

  const patient = await Patient.findById(patientId);
  if (!patient) {
    throw new ApiError(404, "Patient not found");
  }

  const payment = await Payment.create({
    patient: patientId,
    amount,
    type,
    method,
    paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
    createdBy: req.user._id
  });

  const populated = await payment.populate("patient", "cin name phone");
  res.status(201).json({ message: "Payment recorded", payment: populated });
});

const listPayments = asyncHandler(async (req, res) => {
  const {
    from,
    to,
    type,
    method,
    patientId,
    cin,
    name,
    minAmount,
    maxAmount,
    sort
  } = req.query;
  const filter = {};

  if (from || to) {
    filter.paymentDate = {};
    if (from) {
      const fromDate = new Date(from);
      if (!Number.isNaN(fromDate.getTime())) {
        filter.paymentDate.$gte = fromDate;
      }
    }
    if (to) {
      const toDate = new Date(to);
      if (!Number.isNaN(toDate.getTime())) {
        filter.paymentDate.$lte = toDate;
      }
    }
    if (Object.keys(filter.paymentDate).length === 0) {
      delete filter.paymentDate;
    }
  }

  if (type && PAYMENT_TYPES.has(type)) {
    filter.type = type;
  }

  if (method && PAYMENT_METHODS.has(method)) {
    filter.method = method;
  }

  if (patientId) {
    filter.patient = patientId;
  }

  if (minAmount || maxAmount) {
    filter.amount = {};

    if (minAmount !== undefined && minAmount !== "") {
      const parsedMin = Number(minAmount);
      if (!Number.isNaN(parsedMin)) {
        filter.amount.$gte = parsedMin;
      }
    }

    if (maxAmount !== undefined && maxAmount !== "") {
      const parsedMax = Number(maxAmount);
      if (!Number.isNaN(parsedMax)) {
        filter.amount.$lte = parsedMax;
      }
    }

    if (Object.keys(filter.amount).length === 0) {
      delete filter.amount;
    }
  }

  const normalizedCin = typeof cin === "string" ? cin.trim() : "";
  const normalizedName = typeof name === "string" ? name.trim() : "";

  if (normalizedCin || normalizedName) {
    const patientFilter = {};

    if (normalizedCin) {
      patientFilter.cin = { $regex: escapeRegex(normalizedCin), $options: "i" };
    }

    if (normalizedName) {
      patientFilter.name = { $regex: escapeRegex(normalizedName), $options: "i" };
    }

    const matchingPatients = await Patient.find(patientFilter).select("_id");
    const patientIds = matchingPatients.map((patient) => patient._id);

    if (patientIds.length === 0) {
      res.json({ payments: [] });
      return;
    }

    if (filter.patient) {
      const selected = String(filter.patient);
      const existsInMatches = patientIds.some((id) => String(id) === selected);
      if (!existsInMatches) {
        res.json({ payments: [] });
        return;
      }
    } else {
      filter.patient = { $in: patientIds };
    }
  }

  const sortDirection = sort === "asc" ? 1 : -1;
  const payments = await Payment.find(filter)
    .populate("patient", "cin name phone")
    .sort({ paymentDate: sortDirection });

  res.json({ payments });
});

module.exports = { createPayment, listPayments };
