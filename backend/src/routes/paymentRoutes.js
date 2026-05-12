const express = require("express");
const { createPayment, listPayments } = require("../controllers/paymentController");
const validateRequest = require("../middlewares/validateRequest");
const { createPaymentSchema } = require("../validators/paymentValidators");
const { authorizeActions } = require("../middlewares/auth");
const { ACTIONS } = require("../constants/permissions");

const router = express.Router();

router.get("/", authorizeActions(ACTIONS.PAYMENT_READ), listPayments);
router.post("/", authorizeActions(ACTIONS.PAYMENT_CREATE), validateRequest(createPaymentSchema), createPayment);

module.exports = router;
