const PDFDocument = require("pdfkit");

// ── Brand Colors ────────────────────────────────────────────────
const COLORS = {
  primary:    "#2c7be5",
  dark:       "#1a1a2e",
  gray:       "#6c757d",
  lightGray:  "#f8f9fa",
  border:     "#dee2e6",
  white:      "#ffffff",
  success:    "#28a745",
  danger:     "#dc3545",
};

// ── Helper: Draw a horizontal rule ──────────────────────────────
const drawHR = (doc, y, color = COLORS.border) => {
  doc.moveTo(50, y).lineTo(doc.page.width - 50, y).strokeColor(color).lineWidth(1).stroke();
};

// ── Helper: Draw page header ────────────────────────────────────
const drawHeader = (doc, title, subtitle = "") => {
  // Header background
  doc.rect(0, 0, doc.page.width, 80).fill(COLORS.primary);

  // Platform name
  doc
    .fillColor(COLORS.white)
    .fontSize(20)
    .font("Helvetica-Bold")
    .text("TeleMed Platform", 50, 20);

  // Page title
  doc
    .fontSize(11)
    .font("Helvetica")
    .fillColor(COLORS.white)
    .text(title, 50, 46);

  if (subtitle) {
    doc.fontSize(9).text(subtitle, 50, 62);
  }

  // Generated date (top right)
  doc
    .fontSize(8)
    .text(
      `Generated: ${new Date().toLocaleString("en-GB")}`,
      doc.page.width - 200,
      30,
      { width: 150, align: "right" }
    );

  doc.moveDown(3);
};

// ── Helper: Draw a labeled value row ───────────────────────────
const drawField = (doc, label, value, x = 50, y = null) => {
  const currentY = y || doc.y;
  doc
    .fontSize(9)
    .font("Helvetica-Bold")
    .fillColor(COLORS.gray)
    .text(label.toUpperCase(), x, currentY, { width: 140 });

  doc
    .fontSize(10)
    .font("Helvetica")
    .fillColor(COLORS.dark)
    .text(value || "—", x + 150, currentY, { width: 300 });

  doc.moveDown(0.6);
};

// ── Helper: Section heading ─────────────────────────────────────
const drawSectionHeading = (doc, title) => {
  doc.moveDown(0.5);
  doc
    .fontSize(11)
    .font("Helvetica-Bold")
    .fillColor(COLORS.primary)
    .text(title, 50);
  drawHR(doc, doc.y + 2, COLORS.primary);
  doc.moveDown(0.6);
};

// ── Helper: Footer on each page ─────────────────────────────────
const addFooter = (doc) => {
  const pageCount = doc.bufferedPageRange
    ? doc.bufferedPageRange().count
    : 1;

  doc.on("pageAdded", () => {
    doc
      .fontSize(7)
      .fillColor(COLORS.gray)
      .text(
        "TeleMed Platform — Confidential. For authorized use only.",
        50,
        doc.page.height - 30,
        { align: "center", width: doc.page.width - 100 }
      );
  });
};

// ═══════════════════════════════════════════════════════════════
//  EXPORT 1: Doctor Profile PDF
// ═══════════════════════════════════════════════════════════════
const generateProfilePDF = (doctor, profile) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: "A4" });
      const buffers = [];

      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", reject);

      addFooter(doc);

      // ── Header ───────────────────────────────────────────────
      drawHeader(
        doc,
        "Doctor Profile Report",
        `${doctor.doctorId} — Exported on ${new Date().toDateString()}`
      );

      // ── Profile Photo placeholder + Name ────────────────────
      doc
        .fontSize(18)
        .font("Helvetica-Bold")
        .fillColor(COLORS.dark)
        .text(`Dr. ${doctor.firstName} ${doctor.lastName}`, 50, doc.y, { align: "left" });

      doc
        .fontSize(12)
        .font("Helvetica")
        .fillColor(COLORS.primary)
        .text(doctor.specialization, 50);

      doc.moveDown(0.3);

      // Status badges
      const approvedText = doctor.isApproved ? "✔ Approved" : "✘ Pending Approval";
      const approvedColor = doctor.isApproved ? COLORS.success : COLORS.danger;
      doc.fontSize(9).fillColor(approvedColor).text(approvedText, 50);
      doc.moveDown(0.8);

      drawHR(doc, doc.y);
      doc.moveDown(0.8);

      // ── Personal Information ─────────────────────────────────
      drawSectionHeading(doc, "Personal Information");
      drawField(doc, "Doctor ID",    doctor.doctorId);
      drawField(doc, "Full Name",    `Dr. ${doctor.firstName} ${doctor.lastName}`);
      drawField(doc, "Email",        doctor.email);
      drawField(doc, "Phone",        doctor.phone);
      drawField(doc, "License No",   doctor.licenseNumber);
      drawField(doc, "Member Since", new Date(doctor.createdAt).toDateString());

      // ── Professional Details ─────────────────────────────────
      if (profile) {
        drawSectionHeading(doc, "Professional Details");
        drawField(doc, "Specialization",   doctor.specialization);
        drawField(doc, "Experience",       `${profile.yearsOfExperience || 0} years`);
        drawField(doc, "Consult. Fee",     profile.consultationFee
          ? `${profile.consultationFee.currency} ${profile.consultationFee.amount}`
          : "—");
        drawField(doc, "Languages",        (profile.languages || []).join(", ") || "—");

        // ── Bio ──────────────────────────────────────────────
        if (profile.bio) {
          drawSectionHeading(doc, "About");
          doc
            .fontSize(10)
            .font("Helvetica")
            .fillColor(COLORS.dark)
            .text(profile.bio, 50, doc.y, { width: 490, align: "justify" });
          doc.moveDown(0.8);
        }

        // ── Affiliation ──────────────────────────────────────
        if (profile.affiliation && profile.affiliation.hospitalName) {
          drawSectionHeading(doc, "Hospital / Clinic Affiliation");
          drawField(doc, "Hospital",  profile.affiliation.hospitalName);
          drawField(doc, "Address",   profile.affiliation.address);
          drawField(doc, "City",      profile.affiliation.city);
        }

        // ── Education ────────────────────────────────────────
        if (profile.education && profile.education.length > 0) {
          drawSectionHeading(doc, "Education & Qualifications");

          profile.education.forEach((edu, i) => {
            doc
              .fontSize(10)
              .font("Helvetica-Bold")
              .fillColor(COLORS.dark)
              .text(`${i + 1}. ${edu.degree}`, 50);
            doc
              .fontSize(9)
              .font("Helvetica")
              .fillColor(COLORS.gray)
              .text(`   ${edu.institution} — ${edu.year}`, 50);
            doc.moveDown(0.4);
          });
        }
      }

      // ── Footer note ──────────────────────────────────────────
      doc.moveDown(1);
      drawHR(doc, doc.y);
      doc
        .moveDown(0.5)
        .fontSize(8)
        .fillColor(COLORS.gray)
        .text("This document is auto-generated by TeleMed Platform and is confidential.", 50, doc.y, {
          align: "center",
          width: 490,
        });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

// ═══════════════════════════════════════════════════════════════
//  EXPORT 2: Availability Summary PDF
// ═══════════════════════════════════════════════════════════════
const generateAvailabilityPDF = (doctor, weeklySchedule, upcomingSlots, blockedDates) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: "A4" });
      const buffers = [];
      const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", reject);

      addFooter(doc);

      drawHeader(
        doc,
        "Availability & Schedule Report",
        `Dr. ${doctor.firstName} ${doctor.lastName} — ${doctor.doctorId}`
      );

      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .fillColor(COLORS.dark)
        .text(`Dr. ${doctor.firstName} ${doctor.lastName}`, 50, doc.y);
      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor(COLORS.gray)
        .text(doctor.specialization, 50);
      doc.moveDown(1);

      // ── Weekly Schedule ──────────────────────────────────────
      drawSectionHeading(doc, "Weekly Recurring Schedule");

      if (weeklySchedule && weeklySchedule.schedule.length > 0) {
        const activeSchedule = weeklySchedule.schedule.filter((d) => d.isAvailable);

        if (activeSchedule.length === 0) {
          doc.fontSize(10).fillColor(COLORS.gray).text("No active days in weekly schedule.", 50);
        } else {
          activeSchedule.forEach((day) => {
            doc
              .fontSize(10)
              .font("Helvetica-Bold")
              .fillColor(COLORS.dark)
              .text(DAY_NAMES[day.dayOfWeek], 50);

            if (day.slots.length === 0) {
              doc.fontSize(9).font("Helvetica").fillColor(COLORS.gray).text("   No slots defined", 50);
            } else {
              day.slots
                .filter((s) => s.isActive)
                .forEach((slot) => {
                  doc
                    .fontSize(9)
                    .font("Helvetica")
                    .fillColor(COLORS.dark)
                    .text(
                      `   ${slot.startTime} – ${slot.endTime}  (${slot.slotDurationMins} min slots)`,
                      50
                    );
                });
            }
            doc.moveDown(0.4);
          });
        }
      } else {
        doc.fontSize(10).fillColor(COLORS.gray).text("No weekly schedule configured.", 50);
      }

      // ── Upcoming Specific Slots ──────────────────────────────
      doc.moveDown(0.5);
      drawSectionHeading(doc, `Upcoming Available Slots (next 30 days)`);

      if (upcomingSlots && upcomingSlots.length > 0) {
        // Group slots by date
        const grouped = upcomingSlots.reduce((acc, slot) => {
          const dateKey = new Date(slot.date).toDateString();
          if (!acc[dateKey]) acc[dateKey] = [];
          acc[dateKey].push(slot);
          return acc;
        }, {});

        Object.entries(grouped).forEach(([date, slots]) => {
          doc
            .fontSize(10)
            .font("Helvetica-Bold")
            .fillColor(COLORS.dark)
            .text(date, 50);

          slots.forEach((slot) => {
            doc
              .fontSize(9)
              .font("Helvetica")
              .fillColor(slot.status === "available" ? COLORS.success : COLORS.danger)
              .text(`   ${slot.startTime} – ${slot.endTime}  [${slot.status}]`, 50);
          });
          doc.moveDown(0.4);
        });
      } else {
        doc.fontSize(10).fillColor(COLORS.gray).text("No upcoming slots found.", 50);
      }

      // ── Blocked Dates ────────────────────────────────────────
      doc.moveDown(0.5);
      drawSectionHeading(doc, "Blocked Dates (Leave / Vacation)");

      if (blockedDates && blockedDates.length > 0) {
        blockedDates.forEach((block) => {
          const start = new Date(block.startDate).toDateString();
          const end   = new Date(block.endDate).toDateString();
          doc
            .fontSize(10)
            .font("Helvetica-Bold")
            .fillColor(COLORS.danger)
            .text(`${start} → ${end}`, 50);
          doc
            .fontSize(9)
            .font("Helvetica")
            .fillColor(COLORS.gray)
            .text(`   Type: ${block.blockType}  |  Reason: ${block.reason}`, 50);
          doc.moveDown(0.4);
        });
      } else {
        doc.fontSize(10).fillColor(COLORS.gray).text("No blocked dates.", 50);
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

// ═══════════════════════════════════════════════════════════════
//  EXPORT 3: All Doctors List PDF (Admin)
// ═══════════════════════════════════════════════════════════════
const generateDoctorListPDF = (doctors) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: "A4", layout: "landscape" });
      const buffers = [];

      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", reject);

      addFooter(doc);
      drawHeader(doc, "All Doctors Report (Admin)", `Total: ${doctors.length} doctors`);

      // ── Table Header ─────────────────────────────────────────
      const colX = { id: 50, name: 110, spec: 250, city: 380, fee: 470, status: 560 };
      const tableHeaderY = doc.y;

      doc.rect(50, tableHeaderY, doc.page.width - 100, 18).fill(COLORS.primary);

      doc
        .fontSize(8)
        .font("Helvetica-Bold")
        .fillColor(COLORS.white);

      doc.text("DOC ID",        colX.id,     tableHeaderY + 4);
      doc.text("NAME",          colX.name,   tableHeaderY + 4);
      doc.text("SPECIALIZATION",colX.spec,   tableHeaderY + 4);
      doc.text("CITY",          colX.city,   tableHeaderY + 4);
      doc.text("FEE (LKR)",     colX.fee,    tableHeaderY + 4);
      doc.text("STATUS",        colX.status, tableHeaderY + 4);

      doc.moveDown(1.2);

      // ── Table Rows ───────────────────────────────────────────
      doctors.forEach((item, index) => {
        const { doctor, profile } = item;
        const rowY = doc.y;
        const isEven = index % 2 === 0;

        // Alternating row background
        if (isEven) {
          doc.rect(50, rowY - 2, doc.page.width - 100, 16).fill(COLORS.lightGray);
        }

        const statusColor = doctor.isApproved ? COLORS.success : COLORS.danger;
        const statusText  = doctor.isApproved ? "Approved" : "Pending";

        doc.fontSize(8).font("Helvetica").fillColor(COLORS.dark);
        doc.text(doctor.doctorId || "—",                      colX.id,     rowY, { width: 55 });
        doc.text(`Dr. ${doctor.firstName} ${doctor.lastName}`, colX.name,   rowY, { width: 135 });
        doc.text(doctor.specialization || "—",                 colX.spec,   rowY, { width: 125 });
        doc.text(profile?.affiliation?.city || "—",            colX.city,   rowY, { width: 85 });
        doc.text(
          profile?.consultationFee
            ? `${profile.consultationFee.amount}`
            : "—",
          colX.fee, rowY, { width: 80 }
        );

        doc.fillColor(statusColor).text(statusText, colX.status, rowY, { width: 70 });

        doc.moveDown(0.55);

        // Add new page if running out of space
        if (doc.y > doc.page.height - 80) {
          doc.addPage();
          doc.moveDown(0.5);
        }
      });

      // ── Summary ──────────────────────────────────────────────
      doc.moveDown(1);
      drawHR(doc, doc.y);
      doc.moveDown(0.5);

      const approved = doctors.filter((d) => d.doctor.isApproved).length;
      const pending  = doctors.length - approved;

      doc
        .fontSize(9)
        .font("Helvetica")
        .fillColor(COLORS.dark)
        .text(`Total Doctors: ${doctors.length}   |   Approved: ${approved}   |   Pending: ${pending}`, 50, doc.y, {
          align: "center",
          width: doc.page.width - 100,
        });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = {
  generateProfilePDF,
  generateAvailabilityPDF,
  generateDoctorListPDF,
};