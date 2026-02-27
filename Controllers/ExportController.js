const Doctor = require("../models/Doctor");
const DoctorProfile = require("../models/DoctorProfile");
const WeeklySchedule = require("../models/WeeklySchedule");
const DateSlot = require("../models/DateSlot");
const BlockedDate = require("../models/BlockedDate");

const { generateProfilePDF, generateAvailabilityPDF, generateDoctorListPDF } = require("../Utils/pdfGenerator");
const { generateProfileExcel, generateAvailabilityExcel, generateDoctorListExcel } = require("../Utils/excelGenerator");

// ── Helper: Set download response headers ───────────────────────
const setDownloadHeaders = (res, filename, mimeType) => {
  res.setHeader("Content-Type", mimeType);
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Cache-Control", "no-store");
};

// ── Helper: Fetch upcoming slots for a doctor (next 30 days) ────
const fetchUpcomingSlots = async (doctorId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const thirtyDaysLater = new Date(today);
  thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

  return DateSlot.find({
    doctorId,
    date: { $gte: today, $lte: thirtyDaysLater },
  }).sort({ date: 1, startTime: 1 });
};

// ── Helper: Fetch upcoming blocked dates ────────────────────────
const fetchBlockedDates = async (doctorId) => {
  return BlockedDate.find({
    doctorId,
    endDate: { $gte: new Date() },
  }).sort({ startDate: 1 });
};

// ═══════════════════════════════════════════════════════════════
//  PROFILE EXPORTS
// ═══════════════════════════════════════════════════════════════

// ───────────────────────────────────────────────────────────────
// @desc    Download own profile as PDF
// @route   GET /api/doctors/export/profile/pdf
// @access  Private (doctor)
// ───────────────────────────────────────────────────────────────
const exportMyProfilePDF = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.doctor._id);
    const profile = await DoctorProfile.findOne({ doctor: req.doctor._id });

    const pdfBuffer = await generateProfilePDF(doctor, profile);

    const filename = `telemed_doctor_${doctor.doctorId}_profile_${Date.now()}.pdf`;
    setDownloadHeaders(res, filename, "application/pdf");
    return res.send(pdfBuffer);
  } catch (error) {
    console.error("exportMyProfilePDF error:", error);
    return res.status(500).json({ success: false, message: "Failed to generate PDF." });
  }
};

// ───────────────────────────────────────────────────────────────
// @desc    Download own profile as Excel
// @route   GET /api/doctors/export/profile/excel
// @access  Private (doctor)
// ───────────────────────────────────────────────────────────────
const exportMyProfileExcel = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.doctor._id);
    const profile = await DoctorProfile.findOne({ doctor: req.doctor._id });

    const excelBuffer = await generateProfileExcel(doctor, profile);

    const filename = `telemed_doctor_${doctor.doctorId}_profile_${Date.now()}.xlsx`;
    setDownloadHeaders(res, filename, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    return res.send(excelBuffer);
  } catch (error) {
    console.error("exportMyProfileExcel error:", error);
    return res.status(500).json({ success: false, message: "Failed to generate Excel file." });
  }
};

// ═══════════════════════════════════════════════════════════════
//  AVAILABILITY EXPORTS
// ═══════════════════════════════════════════════════════════════

// ───────────────────────────────────────────────────────────────
// @desc    Download own availability summary as PDF
// @route   GET /api/doctors/export/availability/pdf
// @access  Private (doctor)
// ───────────────────────────────────────────────────────────────
const exportMyAvailabilityPDF = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.doctor._id);
    const weeklySchedule = await WeeklySchedule.findOne({ doctor: req.doctor._id });
    const upcomingSlots  = await fetchUpcomingSlots(req.doctor.doctorId);
    const blockedDates   = await fetchBlockedDates(req.doctor.doctorId);

    const pdfBuffer = await generateAvailabilityPDF(
      doctor,
      weeklySchedule,
      upcomingSlots,
      blockedDates
    );

    const filename = `telemed_doctor_${doctor.doctorId}_availability_${Date.now()}.pdf`;
    setDownloadHeaders(res, filename, "application/pdf");
    return res.send(pdfBuffer);
  } catch (error) {
    console.error("exportMyAvailabilityPDF error:", error);
    return res.status(500).json({ success: false, message: "Failed to generate PDF." });
  }
};

// ───────────────────────────────────────────────────────────────
// @desc    Download own availability summary as Excel
// @route   GET /api/doctors/export/availability/excel
// @access  Private (doctor)
// ───────────────────────────────────────────────────────────────
const exportMyAvailabilityExcel = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.doctor._id);
    const weeklySchedule = await WeeklySchedule.findOne({ doctor: req.doctor._id });
    const upcomingSlots  = await fetchUpcomingSlots(req.doctor.doctorId);
    const blockedDates   = await fetchBlockedDates(req.doctor.doctorId);

    const excelBuffer = await generateAvailabilityExcel(
      doctor,
      weeklySchedule,
      upcomingSlots,
      blockedDates
    );

    const filename = `telemed_doctor_${doctor.doctorId}_availability_${Date.now()}.xlsx`;
    setDownloadHeaders(res, filename, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    return res.send(excelBuffer);
  } catch (error) {
    console.error("exportMyAvailabilityExcel error:", error);
    return res.status(500).json({ success: false, message: "Failed to generate Excel file." });
  }
};

// ═══════════════════════════════════════════════════════════════
//  ADMIN: ALL DOCTORS EXPORTS
// ═══════════════════════════════════════════════════════════════

// ── Helper: Fetch all doctors + their profiles ──────────────────
const fetchAllDoctorsWithProfiles = async () => {
  const doctors = await Doctor.find({ role: "doctor" }).sort({ createdAt: -1 });

  const doctorsWithProfiles = await Promise.all(
    doctors.map(async (doctor) => {
      const profile = await DoctorProfile.findOne({ doctor: doctor._id });
      return { doctor, profile };
    })
  );

  return doctorsWithProfiles;
};

// ───────────────────────────────────────────────────────────────
// @desc    Admin downloads all doctors list as PDF
// @route   GET /api/doctors/export/all/pdf
// @access  Private (admin)
// ───────────────────────────────────────────────────────────────
const exportAllDoctorsPDF = async (req, res) => {
  try {
    const doctors = await fetchAllDoctorsWithProfiles();
    const pdfBuffer = await generateDoctorListPDF(doctors);

    const filename = `telemed_all_doctors_${Date.now()}.pdf`;
    setDownloadHeaders(res, filename, "application/pdf");
    return res.send(pdfBuffer);
  } catch (error) {
    console.error("exportAllDoctorsPDF error:", error);
    return res.status(500).json({ success: false, message: "Failed to generate PDF." });
  }
};

// ───────────────────────────────────────────────────────────────
// @desc    Admin downloads all doctors list as Excel
// @route   GET /api/doctors/export/all/excel
// @access  Private (admin)
// ───────────────────────────────────────────────────────────────
const exportAllDoctorsExcel = async (req, res) => {
  try {
    const doctors = await fetchAllDoctorsWithProfiles();
    const excelBuffer = await generateDoctorListExcel(doctors);

    const filename = `telemed_all_doctors_${Date.now()}.xlsx`;
    setDownloadHeaders(res, filename, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    return res.send(excelBuffer);
  } catch (error) {
    console.error("exportAllDoctorsExcel error:", error);
    return res.status(500).json({ success: false, message: "Failed to generate Excel file." });
  }
};

// ───────────────────────────────────────────────────────────────
// @desc    Admin exports a specific doctor's profile by doctorId
// @route   GET /api/doctors/export/:doctorId/pdf
// @route   GET /api/doctors/export/:doctorId/excel
// @access  Private (admin)
// ───────────────────────────────────────────────────────────────
const exportDoctorByIdPDF = async (req, res) => {
  try {
    const profile = await DoctorProfile.findOne({ doctorId: req.params.doctorId });
    if (!profile) {
      return res.status(404).json({ success: false, message: "Doctor not found." });
    }

    const doctor = await Doctor.findById(profile.doctor);
    const pdfBuffer = await generateProfilePDF(doctor, profile);

    const filename = `telemed_${doctor.doctorId}_profile_${Date.now()}.pdf`;
    setDownloadHeaders(res, filename, "application/pdf");
    return res.send(pdfBuffer);
  } catch (error) {
    console.error("exportDoctorByIdPDF error:", error);
    return res.status(500).json({ success: false, message: "Failed to generate PDF." });
  }
};

const exportDoctorByIdExcel = async (req, res) => {
  try {
    const profile = await DoctorProfile.findOne({ doctorId: req.params.doctorId });
    if (!profile) {
      return res.status(404).json({ success: false, message: "Doctor not found." });
    }

    const doctor = await Doctor.findById(profile.doctor);
    const excelBuffer = await generateProfileExcel(doctor, profile);

    const filename = `telemed_${doctor.doctorId}_profile_${Date.now()}.xlsx`;
    setDownloadHeaders(res, filename, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    return res.send(excelBuffer);
  } catch (error) {
    console.error("exportDoctorByIdExcel error:", error);
    return res.status(500).json({ success: false, message: "Failed to generate Excel file." });
  }
};

module.exports = {
  exportMyProfilePDF,
  exportMyProfileExcel,
  exportMyAvailabilityPDF,
  exportMyAvailabilityExcel,
  exportAllDoctorsPDF,
  exportAllDoctorsExcel,
  exportDoctorByIdPDF,
  exportDoctorByIdExcel,
};