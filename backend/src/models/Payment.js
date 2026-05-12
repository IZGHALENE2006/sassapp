const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true
    },
    amount: { type: Number, required: true, min: 0 },
    type: { type: String, enum: ["consultation", "analysis"], required: true },
    method: { type: String, enum: ["cash", "card", "transfer"], default: "cash" },
    paymentDate: { type: Date, default: Date.now, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
