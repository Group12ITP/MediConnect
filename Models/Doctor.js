const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Counter = require("./Counter");

const doctorSchema = new mongoose.Schema(
  {
    // ... your existing schema (keep as is)
    doctorId: { type: String, unique: true, index: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: ["doctor", "admin"], default: "doctor" },
    isApproved: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    specialization: { type: String, required: true },
    licenseNumber: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
    tokenVersion: { type: Number, default: 0, select: false },
  },
  { timestamps: true }
);

// Keep all your middleware and methods (pre-save, comparePassword, etc.)
doctorSchema.pre("save", async function () {
  if (this.isNew) {
    const counter = await Counter.findByIdAndUpdate(
      "doctorId",
      { $inc: { seq: 1 } },
      { returnDocument: "after", upsert: true }
    );
    const paddedSeq = String(counter.seq).padStart(3, "0");
    this.doctorId = `DOC-${paddedSeq}`;
  }
  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
  }
});

doctorSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

doctorSchema.virtual("fullName").get(function () {
  return `Dr. ${this.firstName} ${this.lastName}`;
});

// FIX: Check if model exists before creating
const Doctor = mongoose.models.Doctor || mongoose.model("Doctor", doctorSchema);

module.exports = Doctor;