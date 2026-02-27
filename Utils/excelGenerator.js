const ExcelJS = require("exceljs");

// ── Brand Colors (Excel uses ARGB hex) ─────────────────────────
const EXCEL_COLORS = {
  primary:   "FF2C7BE5",
  white:     "FFFFFFFF",
  lightGray: "FFF8F9FA",
  dark:      "FF1A1A2E",
  success:   "FF28A745",
  danger:    "FFDC3545",
  border:    "FFDEE2E6",
};

// ── Helper: Apply standard header row style ─────────────────────
const styleHeaderRow = (row, bgColor = EXCEL_COLORS.primary) => {
  row.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgColor } };
    cell.font = { bold: true, color: { argb: EXCEL_COLORS.white }, size: 10 };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = {
      top:    { style: "thin", color: { argb: EXCEL_COLORS.border } },
      bottom: { style: "thin", color: { argb: EXCEL_COLORS.border } },
      left:   { style: "thin", color: { argb: EXCEL_COLORS.border } },
      right:  { style: "thin", color: { argb: EXCEL_COLORS.border } },
    };
  });
  row.height = 22;
};

// ── Helper: Apply alternating data row style ────────────────────
const styleDataRow = (row, isEven) => {
  row.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: isEven ? EXCEL_COLORS.lightGray : EXCEL_COLORS.white },
    };
    cell.font = { size: 10, color: { argb: EXCEL_COLORS.dark } };
    cell.alignment = { vertical: "middle", wrapText: true };
    cell.border = {
      top:    { style: "hair", color: { argb: EXCEL_COLORS.border } },
      bottom: { style: "hair", color: { argb: EXCEL_COLORS.border } },
      left:   { style: "hair", color: { argb: EXCEL_COLORS.border } },
      right:  { style: "hair", color: { argb: EXCEL_COLORS.border } },
    };
  });
  row.height = 18;
};

// ── Helper: Add title block at top of sheet ─────────────────────
const addSheetTitle = (sheet, title, subtitle, colCount) => {
  // Row 1: Platform name
  sheet.mergeCells(1, 1, 1, colCount);
  const titleCell = sheet.getCell(1, 1);
  titleCell.value = "TeleMed Platform";
  titleCell.font = { bold: true, size: 16, color: { argb: EXCEL_COLORS.white } };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: EXCEL_COLORS.primary } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  sheet.getRow(1).height = 30;

  // Row 2: Report title
  sheet.mergeCells(2, 1, 2, colCount);
  const subtitleCell = sheet.getCell(2, 1);
  subtitleCell.value = title;
  subtitleCell.font = { bold: true, size: 12, color: { argb: EXCEL_COLORS.primary } };
  subtitleCell.alignment = { horizontal: "center", vertical: "middle" };
  sheet.getRow(2).height = 22;

  // Row 3: Sub-info
  sheet.mergeCells(3, 1, 3, colCount);
  const infoCell = sheet.getCell(3, 1);
  infoCell.value = `${subtitle}   |   Generated: ${new Date().toLocaleString("en-GB")}`;
  infoCell.font = { size: 9, color: { argb: "FF6C757D" } };
  infoCell.alignment = { horizontal: "center", vertical: "middle" };
  sheet.getRow(3).height = 16;

  // Blank row separator
  sheet.getRow(4).height = 8;
};

// ═══════════════════════════════════════════════════════════════
//  EXPORT 1: Doctor Profile Excel
// ═══════════════════════════════════════════════════════════════
const generateProfileExcel = async (doctor, profile) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "TeleMed Platform";
  workbook.created = new Date();

  // ── Sheet 1: Personal Info ───────────────────────────────────
  const infoSheet = workbook.addWorksheet("Personal Info");
  infoSheet.columns = [
    { key: "field", width: 28 },
    { key: "value", width: 50 },
  ];

  addSheetTitle(infoSheet, "Doctor Profile Report", doctor.doctorId, 2);

  const headerRow = infoSheet.addRow(["Field", "Value"]);
  styleHeaderRow(headerRow);

  const infoData = [
    ["Doctor ID",         doctor.doctorId],
    ["First Name",        doctor.firstName],
    ["Last Name",         doctor.lastName],
    ["Email",             doctor.email],
    ["Phone",             doctor.phone],
    ["Specialization",    doctor.specialization],
    ["License Number",    doctor.licenseNumber],
    ["Role",              doctor.role],
    ["Account Status",    doctor.isApproved ? "Approved" : "Pending Approval"],
    ["Account Active",    doctor.isActive ? "Yes" : "No"],
    ["Member Since",      new Date(doctor.createdAt).toDateString()],
  ];

  if (profile) {
    infoData.push(
      ["Years of Experience",  `${profile.yearsOfExperience || 0} years`],
      ["Consultation Fee",     profile.consultationFee
        ? `${profile.consultationFee.currency} ${profile.consultationFee.amount}`
        : "—"],
      ["Languages",            (profile.languages || []).join(", ") || "—"],
      ["Hospital",             profile.affiliation?.hospitalName || "—"],
      ["Hospital Address",     profile.affiliation?.address || "—"],
      ["City",                 profile.affiliation?.city || "—"],
      ["Bio",                  profile.bio || "—"],
      ["Profile Complete",     profile.isProfileComplete ? "Yes" : "No"],
    );
  }

  infoData.forEach((row, i) => {
    const dataRow = infoSheet.addRow(row);
    styleDataRow(dataRow, i % 2 === 0);
    // Bold the field name
    dataRow.getCell(1).font = { bold: true, size: 10 };
  });

  // ── Sheet 2: Education ───────────────────────────────────────
  if (profile && profile.education && profile.education.length > 0) {
    const eduSheet = workbook.addWorksheet("Education");
    eduSheet.columns = [
      { key: "degree",      width: 35 },
      { key: "institution", width: 45 },
      { key: "year",        width: 15 },
    ];

    addSheetTitle(eduSheet, "Education & Qualifications", doctor.doctorId, 3);

    const eduHeader = eduSheet.addRow(["Degree", "Institution", "Year"]);
    styleHeaderRow(eduHeader);

    profile.education.forEach((edu, i) => {
      const row = eduSheet.addRow([edu.degree, edu.institution, edu.year]);
      styleDataRow(row, i % 2 === 0);
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

// ═══════════════════════════════════════════════════════════════
//  EXPORT 2: Availability Summary Excel
// ═══════════════════════════════════════════════════════════════
const generateAvailabilityExcel = async (doctor, weeklySchedule, upcomingSlots, blockedDates) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "TeleMed Platform";
  workbook.created = new Date();

  const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  // ── Sheet 1: Weekly Schedule ─────────────────────────────────
  const weeklySheet = workbook.addWorksheet("Weekly Schedule");
  weeklySheet.columns = [
    { key: "day",      width: 18 },
    { key: "start",    width: 15 },
    { key: "end",      width: 15 },
    { key: "duration", width: 20 },
    { key: "active",   width: 12 },
  ];

  addSheetTitle(weeklySheet, "Weekly Recurring Schedule", `Dr. ${doctor.firstName} ${doctor.lastName}`, 5);

  const wHeader = weeklySheet.addRow(["Day", "Start Time", "End Time", "Slot Duration", "Active"]);
  styleHeaderRow(wHeader);

  let rowIndex = 0;
  if (weeklySchedule && weeklySchedule.schedule.length > 0) {
    weeklySchedule.schedule.forEach((day) => {
      if (day.isAvailable) {
        day.slots.forEach((slot) => {
          const row = weeklySheet.addRow([
            DAY_NAMES[day.dayOfWeek],
            slot.startTime,
            slot.endTime,
            `${slot.slotDurationMins} mins`,
            slot.isActive ? "Yes" : "No",
          ]);
          styleDataRow(row, rowIndex % 2 === 0);
          rowIndex++;
        });
      }
    });
  }

  if (rowIndex === 0) {
    weeklySheet.addRow(["No weekly schedule configured", "", "", "", ""]);
  }

  // ── Sheet 2: Upcoming Slots ──────────────────────────────────
  const slotsSheet = workbook.addWorksheet("Upcoming Slots");
  slotsSheet.columns = [
    { key: "date",     width: 20 },
    { key: "start",    width: 15 },
    { key: "end",      width: 15 },
    { key: "duration", width: 18 },
    { key: "status",   width: 15 },
  ];

  addSheetTitle(slotsSheet, "Upcoming Available Slots", `Dr. ${doctor.firstName} ${doctor.lastName}`, 5);

  const sHeader = slotsSheet.addRow(["Date", "Start Time", "End Time", "Duration", "Status"]);
  styleHeaderRow(sHeader);

  if (upcomingSlots && upcomingSlots.length > 0) {
    upcomingSlots.forEach((slot, i) => {
      const row = slotsSheet.addRow([
        new Date(slot.date).toDateString(),
        slot.startTime,
        slot.endTime,
        `${slot.slotDurationMins} mins`,
        slot.status,
      ]);
      styleDataRow(row, i % 2 === 0);

      // Color status cell
      const statusCell = row.getCell(5);
      statusCell.font = {
        bold: true,
        color: { argb: slot.status === "available" ? EXCEL_COLORS.success : EXCEL_COLORS.danger },
      };
    });
  } else {
    slotsSheet.addRow(["No upcoming slots", "", "", "", ""]);
  }

  // ── Sheet 3: Blocked Dates ───────────────────────────────────
  const blockedSheet = workbook.addWorksheet("Blocked Dates");
  blockedSheet.columns = [
    { key: "start",  width: 22 },
    { key: "end",    width: 22 },
    { key: "type",   width: 18 },
    { key: "reason", width: 40 },
  ];

  addSheetTitle(blockedSheet, "Blocked Dates (Leave / Vacation)", `Dr. ${doctor.firstName} ${doctor.lastName}`, 4);

  const bHeader = blockedSheet.addRow(["Start Date", "End Date", "Type", "Reason"]);
  styleHeaderRow(bHeader);

  if (blockedDates && blockedDates.length > 0) {
    blockedDates.forEach((block, i) => {
      const row = blockedSheet.addRow([
        new Date(block.startDate).toDateString(),
        new Date(block.endDate).toDateString(),
        block.blockType,
        block.reason,
      ]);
      styleDataRow(row, i % 2 === 0);
    });
  } else {
    blockedSheet.addRow(["No blocked dates", "", "", ""]);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

// ═══════════════════════════════════════════════════════════════
//  EXPORT 3: All Doctors List Excel (Admin)
// ═══════════════════════════════════════════════════════════════
const generateDoctorListExcel = async (doctors) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "TeleMed Platform";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("All Doctors");
  sheet.columns = [
    { key: "doctorId",      width: 14 },
    { key: "firstName",     width: 18 },
    { key: "lastName",      width: 18 },
    { key: "email",         width: 30 },
    { key: "phone",         width: 18 },
    { key: "specialization",width: 25 },
    { key: "licenseNo",     width: 20 },
    { key: "city",          width: 18 },
    { key: "fee",           width: 16 },
    { key: "currency",      width: 12 },
    { key: "experience",    width: 16 },
    { key: "languages",     width: 25 },
    { key: "status",        width: 14 },
    { key: "memberSince",   width: 20 },
  ];

  addSheetTitle(sheet, "All Doctors Report (Admin)", `Total: ${doctors.length} doctors`, 14);

  const headerRow = sheet.addRow([
    "Doctor ID", "First Name", "Last Name", "Email", "Phone",
    "Specialization", "License No", "City", "Fee", "Currency",
    "Experience (Yrs)", "Languages", "Status", "Member Since",
  ]);
  styleHeaderRow(headerRow);

  // ── Auto filter on header row ────────────────────────────────
  sheet.autoFilter = {
    from: { row: 5, column: 1 },
    to:   { row: 5, column: 14 },
  };

  doctors.forEach(({ doctor, profile }, i) => {
    const row = sheet.addRow([
      doctor.doctorId,
      doctor.firstName,
      doctor.lastName,
      doctor.email,
      doctor.phone,
      doctor.specialization,
      doctor.licenseNumber,
      profile?.affiliation?.city || "—",
      profile?.consultationFee?.amount || 0,
      profile?.consultationFee?.currency || "LKR",
      profile?.yearsOfExperience || 0,
      (profile?.languages || []).join(", ") || "—",
      doctor.isApproved ? "Approved" : "Pending",
      new Date(doctor.createdAt).toDateString(),
    ]);

    styleDataRow(row, i % 2 === 0);

    // Color status cell
    const statusCell = row.getCell(13);
    statusCell.font = {
      bold: true,
      color: { argb: doctor.isApproved ? EXCEL_COLORS.success : EXCEL_COLORS.danger },
    };
  });

  // ── Summary Sheet ────────────────────────────────────────────
  const summarySheet = workbook.addWorksheet("Summary");
  addSheetTitle(summarySheet, "Export Summary", new Date().toLocaleString("en-GB"), 2);

  summarySheet.columns = [{ width: 30 }, { width: 20 }];

  const sHeader = summarySheet.addRow(["Metric", "Value"]);
  styleHeaderRow(sHeader);

  const approved  = doctors.filter((d) => d.doctor.isApproved).length;
  const pending   = doctors.length - approved;
  const specs     = [...new Set(doctors.map((d) => d.doctor.specialization))];

  const summaryData = [
    ["Total Doctors",          doctors.length],
    ["Approved Doctors",       approved],
    ["Pending Approval",       pending],
    ["Total Specializations",  specs.length],
    ["Report Generated",       new Date().toLocaleString("en-GB")],
  ];

  summaryData.forEach((row, i) => {
    const dataRow = summarySheet.addRow(row);
    styleDataRow(dataRow, i % 2 === 0);
    dataRow.getCell(1).font = { bold: true, size: 10 };
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

module.exports = {
  generateProfileExcel,
  generateAvailabilityExcel,
  generateDoctorListExcel,
};