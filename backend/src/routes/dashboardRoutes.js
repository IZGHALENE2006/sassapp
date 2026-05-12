const express = require("express");
const { getTodayDashboard } = require("../controllers/dashboardController");
const { authorizeActions } = require("../middlewares/auth");
const { ACTIONS } = require("../constants/permissions");

const router = express.Router();

router.get("/today", authorizeActions(ACTIONS.DASHBOARD_VIEW), getTodayDashboard);

module.exports = router;
