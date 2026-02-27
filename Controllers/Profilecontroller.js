const { validationResult } = require("express-validator");
const DoctorProfile = require("../Models/Doctorprofile");
const { uploadImage, deleteImage } = require("../utils/cloudinary");

// ── Helper: Format validation errors ───────────────────────────
const handleValidationErrors = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  return null;
};

// ───────────────────────────────────────────────────────────────
// @desc    Create a doctor profile (called once after registration)
// @route   POST /api/doctors/profile
// @access  Private (doctor)
// ───────────────────────────────────────────────────────────────
const createProfile = async (req, res) => {
  const validationError = handleValidationErrors(req, res);
  if (validationError) return;

  try {
    // Prevent duplicate profiles
    const existing = await DoctorProfile.findOne({ doctor: req.doctor._id });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Profile already exists. Use the update endpoint instead.",
      });
    }

    const {
      bio,
      yearsOfExperience,
      consultationFee,
      languages,
      affiliation,
    } = req.body;

    const profile = await DoctorProfile.create({
      doctor: req.doctor._id,
      doctorId: req.doctor.doctorId,
      bio,
      yearsOfExperience,
      consultationFee,
      languages,
      affiliation,
    });

    return res.status(201).json({
      success: true,
      message: "Profile created successfully.",
      data: profile,
    });
  } catch (error) {
    console.error("createProfile error:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ───────────────────────────────────────────────────────────────
// @desc    Get own profile (logged-in doctor)
// @route   GET /api/doctors/profile/me
// @access  Private (doctor)
// ───────────────────────────────────────────────────────────────
const getMyProfile = async (req, res) => {
  try {
    const profile = await DoctorProfile.findOne({
      doctor: req.doctor._id,
    }).populate("doctor", "firstName lastName email specialization licenseNumber phone doctorId role isApproved");

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found. Please create your profile first.",
      });
    }

    return res.status(200).json({ success: true, data: profile });
  } catch (error) {
    console.error("getMyProfile error:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ───────────────────────────────────────────────────────────────
// @desc    Get any doctor's profile by doctorId (e.g. DOC-001)
// @route   GET /api/doctors/profile/:doctorId
// @access  Private (admin, doctor)
// ───────────────────────────────────────────────────────────────
const getProfileById = async (req, res) => {
  try {
    const profile = await DoctorProfile.findOne({
      doctorId: req.params.doctorId,
    }).populate("doctor", "firstName lastName email specialization licenseNumber phone doctorId role isApproved");

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: `No profile found for doctor ID: ${req.params.doctorId}`,
      });
    }

    return res.status(200).json({ success: true, data: profile });
  } catch (error) {
    console.error("getProfileById error:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ───────────────────────────────────────────────────────────────
// @desc    Get all doctor profiles (admin view)
// @route   GET /api/doctors/profile
// @access  Private (admin)
// ───────────────────────────────────────────────────────────────
const getAllProfiles = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      city,
      minFee,
      maxFee,
      minExperience,
      language,
      isProfileComplete,
    } = req.query;

    const filter = {};
    if (city) filter["affiliation.city"] = { $regex: city, $options: "i" };
    if (minFee || maxFee) {
      filter["consultationFee.amount"] = {};
      if (minFee) filter["consultationFee.amount"].$gte = Number(minFee);
      if (maxFee) filter["consultationFee.amount"].$lte = Number(maxFee);
    }
    if (minExperience) filter.yearsOfExperience = { $gte: Number(minExperience) };
    if (language) filter.languages = { $in: [language] };
    if (isProfileComplete !== undefined)
      filter.isProfileComplete = isProfileComplete === "true";

    const skip = (Number(page) - 1) * Number(limit);
    const total = await DoctorProfile.countDocuments(filter);

    const profiles = await DoctorProfile.find(filter)
      .populate("doctor", "firstName lastName email specialization licenseNumber phone doctorId isApproved")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    return res.status(200).json({
      success: true,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      data: profiles,
    });
  } catch (error) {
    console.error("getAllProfiles error:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ───────────────────────────────────────────────────────────────
// @desc    Update own profile
// @route   PUT /api/doctors/profile/me
// @access  Private (doctor)
// ───────────────────────────────────────────────────────────────
const updateProfile = async (req, res) => {
  const validationError = handleValidationErrors(req, res);
  if (validationError) return;

  try {
    const allowedFields = [
      "bio",
      "yearsOfExperience",
      "consultationFee",
      "languages",
      "affiliation",
    ];

    // Build update object from only allowed fields
    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const profile = await DoctorProfile.findOneAndUpdate(
      { doctor: req.doctor._id },
      { $set: updates },
      { new: true, runValidators: true }
    ).populate("doctor", "firstName lastName email specialization licenseNumber phone doctorId");

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found. Please create your profile first.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      data: profile,
    });
  } catch (error) {
    console.error("updateProfile error:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ───────────────────────────────────────────────────────────────
// @desc    Upload or replace profile photo
// @route   PATCH /api/doctors/profile/me/photo
// @access  Private (doctor)
// ───────────────────────────────────────────────────────────────
const uploadProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file provided. Please upload a JPEG, PNG, or WEBP image.",
      });
    }

    const profile = await DoctorProfile.findOne({ doctor: req.doctor._id });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found. Please create your profile first.",
      });
    }

    // Delete old photo from Cloudinary if one exists
    if (profile.profilePhoto.publicId) {
      await deleteImage(profile.profilePhoto.publicId);
    }

    // Upload new photo — reuse publicId slot for clean overwrite
    const { url, publicId } = await uploadImage(
      req.file.buffer,
      "telemed/doctor-profiles",
      profile.profilePhoto.publicId || null
    );

    profile.profilePhoto = { url, publicId };
    await profile.save();

    return res.status(200).json({
      success: true,
      message: "Profile photo updated successfully.",
      data: { profilePhoto: profile.profilePhoto },
    });
  } catch (error) {
    console.error("uploadProfilePhoto error:", error);
    return res.status(500).json({ success: false, message: "Server error during photo upload." });
  }
};

// ───────────────────────────────────────────────────────────────
// @desc    Delete profile photo
// @route   DELETE /api/doctors/profile/me/photo
// @access  Private (doctor)
// ───────────────────────────────────────────────────────────────
const deleteProfilePhoto = async (req, res) => {
  try {
    const profile = await DoctorProfile.findOne({ doctor: req.doctor._id });
    if (!profile) {
      return res.status(404).json({ success: false, message: "Profile not found." });
    }

    if (!profile.profilePhoto.publicId) {
      return res.status(400).json({ success: false, message: "No profile photo to delete." });
    }

    await deleteImage(profile.profilePhoto.publicId);
    profile.profilePhoto = { url: "", publicId: "" };
    await profile.save();

    return res.status(200).json({
      success: true,
      message: "Profile photo deleted successfully.",
    });
  } catch (error) {
    console.error("deleteProfilePhoto error:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ───────────────────────────────────────────────────────────────
// @desc    Add an education entry
// @route   POST /api/doctors/profile/me/education
// @access  Private (doctor)
// ───────────────────────────────────────────────────────────────
const addEducation = async (req, res) => {
  const validationError = handleValidationErrors(req, res);
  if (validationError) return;

  try {
    const { degree, institution, year } = req.body;

    const profile = await DoctorProfile.findOneAndUpdate(
      { doctor: req.doctor._id },
      { $push: { education: { degree, institution, year } } },
      { new: true, runValidators: true }
    );

    if (!profile) {
      return res.status(404).json({ success: false, message: "Profile not found." });
    }

    return res.status(201).json({
      success: true,
      message: "Education entry added successfully.",
      data: profile.education,
    });
  } catch (error) {
    console.error("addEducation error:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ───────────────────────────────────────────────────────────────
// @desc    Update a specific education entry
// @route   PUT /api/doctors/profile/me/education/:eduId
// @access  Private (doctor)
// ───────────────────────────────────────────────────────────────
const updateEducation = async (req, res) => {
  const validationError = handleValidationErrors(req, res);
  if (validationError) return;

  try {
    const { degree, institution, year } = req.body;
    const { eduId } = req.params;

    const profile = await DoctorProfile.findOneAndUpdate(
      {
        doctor: req.doctor._id,
        "education._id": eduId,
      },
      {
        $set: {
          "education.$.degree": degree,
          "education.$.institution": institution,
          "education.$.year": year,
        },
      },
      { new: true, runValidators: true }
    );

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile or education entry not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Education entry updated successfully.",
      data: profile.education,
    });
  } catch (error) {
    console.error("updateEducation error:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ───────────────────────────────────────────────────────────────
// @desc    Delete a specific education entry
// @route   DELETE /api/doctors/profile/me/education/:eduId
// @access  Private (doctor)
// ───────────────────────────────────────────────────────────────
const deleteEducation = async (req, res) => {
  try {
    const { eduId } = req.params;

    const profile = await DoctorProfile.findOneAndUpdate(
      { doctor: req.doctor._id },
      { $pull: { education: { _id: eduId } } },
      { new: true }
    );

    if (!profile) {
      return res.status(404).json({ success: false, message: "Profile not found." });
    }

    return res.status(200).json({
      success: true,
      message: "Education entry removed successfully.",
      data: profile.education,
    });
  } catch (error) {
    console.error("deleteEducation error:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ───────────────────────────────────────────────────────────────
// @desc    Admin deletes a doctor profile
// @route   DELETE /api/doctors/profile/:doctorId
// @access  Private (admin)
// ───────────────────────────────────────────────────────────────
const deleteProfile = async (req, res) => {
  try {
    const profile = await DoctorProfile.findOne({
      doctorId: req.params.doctorId,
    });

    if (!profile) {
      return res.status(404).json({ success: false, message: "Profile not found." });
    }

    // Delete photo from Cloudinary if exists
    if (profile.profilePhoto.publicId) {
      await deleteImage(profile.profilePhoto.publicId);
    }

    await profile.deleteOne();

    return res.status(200).json({
      success: true,
      message: `Profile for ${req.params.doctorId} deleted successfully.`,
    });
  } catch (error) {
    console.error("deleteProfile error:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

module.exports = {
  createProfile,
  getMyProfile,
  getProfileById,
  getAllProfiles,
  updateProfile,
  uploadProfilePhoto,
  deleteProfilePhoto,
  addEducation,
  updateEducation,
  deleteEducation,
  deleteProfile,
};