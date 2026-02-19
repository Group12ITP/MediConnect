const mongoose = require("mongoose");

// ── Sub-schema: Education & Qualifications ──────────────────────
const educationSchema = new mongoose.Schema(
  {
    degree: {
      type: String,
      required: [true, "Degree is required"],
      trim: true,
    },
    institution: {
      type: String,
      required: [true, "Institution is required"],
      trim: true,
    },
    year: {
      type: Number,
      required: [true, "Graduation year is required"],
      min: [1950, "Year seems too early"],
      max: [new Date().getFullYear(), "Year cannot be in the future"],
    },
  },
  { _id: true }
);

// ── Main Profile Schema ─────────────────────────────────────────
const doctorProfileSchema = new mongoose.Schema(
  {
    // ── Link to Doctor auth document ────────────────────────────
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
      unique: true, // One profile per doctor
    },

    // Denormalized for easy display without populating
    doctorId: {
      type: String,
      required: true,
      index: true,
    },

    // ── Profile Photo (Cloudinary) ───────────────────────────────
    profilePhoto: {
      url: {
        type: String,
        default: "",
      },
      publicId: {
        type: String,  // Cloudinary public_id — needed to delete old photo
        default: "",
      },
    },

    // ── Bio ──────────────────────────────────────────────────────
    bio: {
      type: String,
      trim: true,
      maxlength: [1000, "Bio cannot exceed 1000 characters"],
      default: "",
    },

    // ── Experience ───────────────────────────────────────────────
    yearsOfExperience: {
      type: Number,
      min: [0, "Years of experience cannot be negative"],
      max: [70, "Please enter a valid years of experience"],
      default: 0,
    },

    // ── Consultation Fee ─────────────────────────────────────────
    consultationFee: {
      amount: {
        type: Number,
        min: [0, "Fee cannot be negative"],
        default: 0,
      },
      currency: {
        type: String,
        default: "LKR",
        trim: true,
        uppercase: true,
      },
    },

    // ── Languages ────────────────────────────────────────────────
    languages: {
      type: [String],
      default: ["English"],
      validate: {
        validator: (arr) => arr.length <= 10,
        message: "Cannot list more than 10 languages",
      },
    },

    // ── Hospital / Clinic Affiliation ────────────────────────────
    affiliation: {
      hospitalName: {
        type: String,
        trim: true,
        default: "",
      },
      address: {
        type: String,
        trim: true,
        default: "",
      },
      city: {
        type: String,
        trim: true,
        default: "",
      },
    },

    // ── Education & Qualifications ───────────────────────────────
    education: {
      type: [educationSchema],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 10,
        message: "Cannot add more than 10 education entries",
      },
    },

    // ── Profile Completion Flag ──────────────────────────────────
    isProfileComplete: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Pre-save: Auto-compute isProfileComplete ────────────────────
doctorProfileSchema.pre("save", async function () {
  this.isProfileComplete =
    !!this.bio &&
    this.yearsOfExperience > 0 &&
    this.consultationFee.amount > 0 &&
    this.languages.length > 0 &&
    !!this.affiliation.hospitalName &&
    this.education.length > 0;
});

// ── Index for fast lookups ───────────────────────────────────────
doctorProfileSchema.index({ doctorId: 1 });
doctorProfileSchema.index({ "affiliation.city": 1 });
doctorProfileSchema.index({ yearsOfExperience: 1 });
doctorProfileSchema.index({ "consultationFee.amount": 1 });

module.exports = mongoose.model("DoctorProfile", doctorProfileSchema);