const mongoose = require("mongoose");

const educationSchema = new mongoose.Schema({
  degree: { type: String, required: true, trim: true },
  institution: { type: String, required: true, trim: true },
  year: { type: Number, required: true, min: 1950, max: new Date().getFullYear() },
}, { _id: true });

const doctorProfileSchema = new mongoose.Schema(
  {
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true, unique: true },
    doctorId: { type: String, required: true, index: true },
    profilePhoto: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },
    bio: { type: String, trim: true, maxlength: 1000, default: "" },
    yearsOfExperience: { type: Number, min: 0, max: 70, default: 0 },
    consultationFee: {
      amount: { type: Number, min: 0, default: 0 },
      currency: { type: String, default: "LKR", uppercase: true },
    },
    languages: { type: [String], default: ["English"] },
    affiliation: {
      hospitalName: { type: String, trim: true, default: "" },
      address: { type: String, trim: true, default: "" },
      city: { type: String, trim: true, default: "" },
    },
    education: { type: [educationSchema], default: [] },
    isProfileComplete: { type: Boolean, default: false },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

doctorProfileSchema.pre("save", async function () {
  this.isProfileComplete =
    !!this.bio &&
    this.yearsOfExperience > 0 &&
    this.consultationFee.amount > 0 &&
    this.languages.length > 0 &&
    !!this.affiliation.hospitalName &&
    this.education.length > 0;
});

doctorProfileSchema.index({ doctorId: 1 });
doctorProfileSchema.index({ "affiliation.city": 1 });
doctorProfileSchema.index({ yearsOfExperience: 1 });
doctorProfileSchema.index({ "consultationFee.amount": 1 });

// FIX: Check if model exists before creating
const DoctorProfile = mongoose.models.DoctorProfile || mongoose.model("DoctorProfile", doctorProfileSchema);

module.exports = DoctorProfile;