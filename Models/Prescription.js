const mongoose = require("mongoose");
const Counter = require("./Counter");

// ── Sub-schema: A single medicine line in a prescription ────────
const prescriptionItemSchema = new mongoose.Schema(
  {
    // RxNorm RXCUI — used to match across pharmacy inventories
    rxcui: {
      type: String,
      required: [true, "RXCUI is required for each medicine"],
      trim: true,
    },
    genericName: {
      type: String,
      required: [true, "Generic name is required"],
      trim: true,
    },
    brandName: {
      type: String,
      trim: true,
      default: "",
    },
    dosage: {
      // e.g. "500mg twice daily"
      type: String,
      trim: true,
      default: "",
    },
    duration: {
      // e.g. "7 days", "2 weeks"
      type: String,
      trim: true,
      default: "",
    },
    quantity: {
      type: Number,
      min: [1, "Quantity must be at least 1"],
      default: 1,
    },
    instructions: {
      // e.g. "Take after meals"
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: true }
);

// ── Main Prescription Schema ────────────────────────────────────
const prescriptionSchema = new mongoose.Schema(
  {
    // ── Auto-Generated Prescription ID ─────────────────────────
    prescriptionId: {
      type: String,
      unique: true,
      index: true,
    },

    // ── Relationships ───────────────────────────────────────────
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    doctorId: {
      type: String,
      required: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    patientId: {
      type: String,
      required: true,
    },

    // ── Medicine List ───────────────────────────────────────────
    medicines: {
      type: [prescriptionItemSchema],
      required: true,
      validate: {
        validator: (arr) => arr.length >= 1,
        message: "Prescription must include at least one medicine",
      },
    },

    // ── Clinical Notes ──────────────────────────────────────────
    diagnosis: {
      type: String,
      trim: true,
      default: "",
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, "Notes cannot exceed 1000 characters"],
      default: "",
    },

    // ── Validity ────────────────────────────────────────────────
    validUntil: {
      type: Date,
      default: () => {
        const d = new Date();
        d.setDate(d.getDate() + 30); // Valid 30 days by default
        return d;
      },
    },

    // ── Status ──────────────────────────────────────────────────
    status: {
      type: String,
      enum: ["active", "dispensed", "expired", "cancelled"],
      default: "active",
    },

    // ── Dispensed Info ──────────────────────────────────────────
    dispensedAt: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pharmacy",
      default: null,
    },
    dispensedOn: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// ── Pre-save: Generate prescriptionId ──────────────────────────
prescriptionSchema.pre("save", async function () {
  if (this.isNew) {
    const counter = await Counter.findByIdAndUpdate(
      "prescriptionId",
      { $inc: { seq: 1 } },
      { returnDocument: "after", upsert: true }
    );
    const padded = String(counter.seq).padStart(4, "0");
    this.prescriptionId = `RX-${padded}`;
  }
});

// ── Auto-expire if validUntil has passed ────────────────────────
prescriptionSchema.pre("save", function () {
  if (
    this.status === "active" &&
    this.validUntil &&
    new Date() > this.validUntil
  ) {
    this.status = "expired";
  }
});

prescriptionSchema.index({ patientId: 1, status: 1 });
prescriptionSchema.index({ doctorId: 1 });
prescriptionSchema.index({ "medicines.rxcui": 1 });

module.exports = mongoose.model("Prescription", prescriptionSchema);