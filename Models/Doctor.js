const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Counter = require("./Counter");

const doctorSchema = new mongoose.Schema(
  {
    // ── Auto-Generated Doctor ID ────────────────────────────────
    doctorId: {
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

    // ── Role & Status ───────────────────────────────────────────
    role: {
      type: String,
      enum: ["doctor", "admin"],
      default: "doctor",
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },

    // ── Professional Info ───────────────────────────────────────
    specialization: {
      type: String,
      required: [true, "Specialization is required"],
      trim: true,
    },
    licenseNumber: {
      type: String,
      required: [true, "Medical license number is required"],
      unique: true,
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },

    // ── Password Reset ──────────────────────────────────────────
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpires: {
      type: Date,
      select: false,
    },

    // ── Token Versioning (logout all devices) ───────────────────
    tokenVersion: {
      type: Number,
      default: 0,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

// ── Pre-save Hook: Generate doctorId + Hash password ───────────
// IMPORTANT: async pre-save hooks must NOT use next().
// Mongoose awaits the returned Promise automatically.
// Throwing an error inside rejects the hook correctly.
doctorSchema.pre("save", async function () {
  // 1. Generate doctorId only on first save
  if (this.isNew) {
    const counter = await Counter.findByIdAndUpdate(
      "doctorId",
      { $inc: { seq: 1 } },
      { returnDocument: "after", upsert: true }
    );
    const paddedSeq = String(counter.seq).padStart(3, "0");
    this.doctorId = `DOC-${paddedSeq}`;
  }

  // 2. Hash password only when modified
  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
  }
});

// ── Instance Method: Compare password ──────────────────────────
doctorSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ── Virtual: Full name ──────────────────────────────────────────
doctorSchema.virtual("fullName").get(function () {
  return `Dr. ${this.firstName} ${this.lastName}`;
});

module.exports = mongoose.model("Doctor", doctorSchema);