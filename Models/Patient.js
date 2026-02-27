const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Counter = require("./Counter");

const patientSchema = new mongoose.Schema(
  {
    // ── Auto-Generated Patient ID ───────────────────────────────
    patientId: {
      type: String,
      unique: true,
      index: true,
    },

    // ── Basic Info ──────────────────────────────────────────────
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },

    // ── Role ────────────────────────────────────────────────────
    role: {
      type: String,
      default: "patient",
      immutable: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },

    // ── Personal Details ────────────────────────────────────────
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    dateOfBirth: {
      type: Date,
      default: null,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other", "prefer_not_to_say"],
      default: "prefer_not_to_say",
    },
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "unknown"],
      default: "unknown",
    },

    // ── Address (used for pharmacy finder) ──────────────────────
    address: {
      street:  { type: String, trim: true, default: "" },
      city:    { type: String, trim: true, default: "" },
      district:{ type: String, trim: true, default: "" },
      country: { type: String, trim: true, default: "Sri Lanka" },
    },

    // ── Assigned Doctor ─────────────────────────────────────────
    assignedDoctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      default: null,
    },

    // ── Token Versioning ────────────────────────────────────────
    tokenVersion: {
      type: Number,
      default: 0,
      select: false,
    },
  },
  { timestamps: true }
);

// ── Pre-save: Generate patientId + Hash password ────────────────
patientSchema.pre("save", async function () {
  if (this.isNew) {
    const counter = await Counter.findByIdAndUpdate(
      "patientId",
      { $inc: { seq: 1 } },
      { returnDocument: "after", upsert: true }
    );
    const padded = String(counter.seq).padStart(3, "0");
    this.patientId = `PAT-${padded}`;
  }

  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
  }
});

// ── Instance Method: Compare password ──────────────────────────
patientSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// ── Virtual: Full name ──────────────────────────────────────────
patientSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

module.exports = mongoose.model("Patient", patientSchema);