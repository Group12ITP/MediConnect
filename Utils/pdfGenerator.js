/**
 * MediConnect — Professional PDF Generator
 * Uses PDFKit to produce formatted, branded PDF reports.
 * Supports: All Appointments, Single Appointment, Queue Session.
 */

const PDFDocument = require('pdfkit');

// ─── Brand Colours ────────────────────────────────────────────────────────────
const BRAND = {
    primary: '#1A73E8',   // MediConnect blue
    secondary: '#34A853',   // green accent
    dark: '#1C2B4A',   // header dark
    muted: '#6B7280',   // grey for labels
    light: '#F3F6FB',   // row background
    border: '#D1D5DB',
    white: '#FFFFFF',
    danger: '#DC2626',
    warn: '#F59E0B'
};

// ─── Status colours ───────────────────────────────────────────────────────────
const STATUS_COLOR = {
    BOOKED: BRAND.primary,
    CHECKED_IN: BRAND.secondary,
    IN_PROGRESS: BRAND.warn,
    COMPLETED: BRAND.secondary,
    CANCELLED: BRAND.danger,
    NO_SHOW: BRAND.danger,
    RESCHEDULED: '#8B5CF6',
    NOT_STARTED: BRAND.muted,
    RUNNING: BRAND.secondary,
    PAUSED: BRAND.warn,
    ENDED: BRAND.dark
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(d) {
    if (!d) return '—';
    const date = new Date(d);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDatetime(d) {
    if (!d) return '—';
    const date = new Date(d);
    return date.toLocaleString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

/**
 * Draw the MediConnect branded header at the top of every page.
 */
function drawHeader(doc, title, subtitle = '') {
    // Dark header band
    doc.rect(0, 0, doc.page.width, 80).fill(BRAND.dark);

    // Logo text
    doc.font('Helvetica-Bold').fontSize(22).fillColor(BRAND.white)
        .text('Medi', 40, 22, { continued: true })
        .fillColor(BRAND.primary).text('Connect');

    // Report title on right
    doc.font('Helvetica-Bold').fontSize(14).fillColor(BRAND.white)
        .text(title, 0, 22, { align: 'right', width: doc.page.width - 40 });

    if (subtitle) {
        doc.font('Helvetica').fontSize(9).fillColor(BRAND.border)
            .text(subtitle, 0, 44, { align: 'right', width: doc.page.width - 40 });
    }

    // Accent line
    doc.rect(0, 80, doc.page.width, 4).fill(BRAND.primary);

    doc.moveDown(1);
    doc.y = 100;
}

/**
 * Draw the footer with page number and generation timestamp.
 */
function drawFooter(doc) {
    const bottom = doc.page.height - 40;
    doc.rect(0, bottom - 8, doc.page.width, 48).fill(BRAND.light);
    doc.rect(0, bottom - 8, doc.page.width, 2).fill(BRAND.border);

    doc.font('Helvetica').fontSize(8).fillColor(BRAND.muted)
        .text(`Generated: ${new Date().toLocaleString('en-GB')}`, 40, bottom + 4)
        .text('MediConnect Healthcare Platform — Confidential', 0, bottom + 4, {
            align: 'center', width: doc.page.width
        })
        .text(`Page ${doc.bufferedPageRange().count}`, 0, bottom + 4, {
            align: 'right', width: doc.page.width - 40
        });
}

/**
 * Draw a simple labelled key-value row (for detail sections).
 */
function kv(doc, label, value, y_offset = 0) {
    const startY = doc.y + y_offset;
    doc.font('Helvetica-Bold').fontSize(9).fillColor(BRAND.muted).text(label.toUpperCase(), 40, startY, { width: 140 });
    doc.font('Helvetica').fontSize(10).fillColor(BRAND.dark).text(value || '—', 185, startY, { width: 340 });
    doc.moveDown(0.6);
}

/**
 * Draw a section heading bar.
 */
function sectionHeading(doc, text) {
    doc.moveDown(0.5);
    doc.rect(40, doc.y, doc.page.width - 80, 22).fill(BRAND.primary);
    doc.font('Helvetica-Bold').fontSize(10).fillColor(BRAND.white)
        .text(text, 48, doc.y - 18, { width: doc.page.width - 96 });
    doc.moveDown(1.2);
}

/**
 * Draw a status badge (coloured text).
 */
function statusBadge(doc, status, x, y) {
    const color = STATUS_COLOR[status] || BRAND.muted;
    const label = (status || '').replace(/_/g, ' ');
    const badgeW = Math.max(70, label.length * 6.5 + 10);

    doc.roundedRect(x, y - 2, badgeW, 14, 3).fill(color);
    doc.font('Helvetica-Bold').fontSize(7).fillColor(BRAND.white)
        .text(label, x + 5, y + 1, { width: badgeW - 10, align: 'center' });
}

// ─── Appointment Table ────────────────────────────────────────────────────────

const COL = { id: 40, date: 105, time: 175, doctor: 230, patient: 325, status: 430 };

function drawTableHeader(doc) {
    const rowY = doc.y;
    doc.rect(40, rowY, doc.page.width - 80, 18).fill(BRAND.dark);
    doc.font('Helvetica-Bold').fontSize(8).fillColor(BRAND.white);
    doc.text('#', COL.id, rowY + 5, { width: 55 });
    doc.text('DATE', COL.date, rowY + 5, { width: 65 });
    doc.text('TIME', COL.time, rowY + 5, { width: 50 });
    doc.text('DOCTOR ID', COL.doctor, rowY + 5, { width: 90 });
    doc.text('PATIENT ID', COL.patient, rowY + 5, { width: 100 });
    doc.text('STATUS', COL.status, rowY + 5, { width: 90 });
    doc.moveDown(1.1);
}

function drawAppointmentRow(doc, appt, index) {
    // Alternate row shading
    if (index % 2 === 0) {
        doc.rect(40, doc.y - 2, doc.page.width - 80, 22).fill(BRAND.light);
    }

    const rowY = doc.y;
    doc.font('Helvetica').fontSize(8).fillColor(BRAND.dark);
    doc.text(String(index + 1), COL.id, rowY, { width: 55 });
    doc.text(appt.date || '—', COL.date, rowY, { width: 65 });
    doc.text(`${appt.startTime || ''}–${appt.endTime || ''}`, COL.time, rowY, { width: 50 });
    doc.text(String(appt.doctorId || '—').slice(-8), COL.doctor, rowY, { width: 90 });
    doc.text(String(appt.patientId || '—').slice(-8), COL.patient, rowY, { width: 90 });

    // status badge
    statusBadge(doc, appt.status, COL.status, rowY);

    doc.moveDown(1.1);
}

// ─── Summary Stats Box ────────────────────────────────────────────────────────

function drawStatBox(doc, label, value, x, y, color = BRAND.primary) {
    doc.rect(x, y, 110, 52).fill(color);
    doc.font('Helvetica-Bold').fontSize(22).fillColor(BRAND.white).text(String(value), x + 8, y + 8, { width: 94, align: 'center' });
    doc.font('Helvetica').fontSize(8).fillColor(BRAND.white).text(label, x + 8, y + 36, { width: 94, align: 'center' });
}

// ═══════════════════════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate a PDF for ALL appointments.
 * @param {Array} appointments
 * @param {object} filters  - e.g. { date, doctorId }
 * @returns {PDFDocument}
 */
exports.generateAllAppointmentsPDF = (appointments, filters = {}) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4', bufferPages: true });

    drawHeader(doc, 'Appointments Report',
        filters.date ? `Date: ${filters.date}` : `All records  •  Total: ${appointments.length}`);

    // ── Summary stats ──
    doc.moveDown(0.5);
    const statY = doc.y;
    const counts = {
        BOOKED: appointments.filter(a => a.status === 'BOOKED').length,
        COMPLETED: appointments.filter(a => a.status === 'COMPLETED').length,
        CANCELLED: appointments.filter(a => a.status === 'CANCELLED').length,
        NO_SHOW: appointments.filter(a => a.status === 'NO_SHOW').length,
    };
    drawStatBox(doc, 'Total', appointments.length, 40, statY, BRAND.dark);
    drawStatBox(doc, 'Booked', counts.BOOKED, 160, statY, BRAND.primary);
    drawStatBox(doc, 'Completed', counts.COMPLETED, 280, statY, BRAND.secondary);
    drawStatBox(doc, 'Cancelled', counts.CANCELLED, 400, statY, BRAND.danger);

    doc.y = statY + 68;

    // ── Table ──
    sectionHeading(doc, 'Appointment Records');
    drawTableHeader(doc);

    appointments.forEach((appt, i) => {
        // New page if needed
        if (doc.y > doc.page.height - 80) {
            doc.addPage();
            drawHeader(doc, 'Appointments Report (cont.)');
            drawTableHeader(doc);
        }
        drawAppointmentRow(doc, appt, i);
    });

    if (appointments.length === 0) {
        doc.font('Helvetica').fontSize(11).fillColor(BRAND.muted)
            .text('No appointments found for the selected criteria.', { align: 'center' });
    }

    // ── Footer ──
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        drawFooter(doc);
    }

    doc.end();
    return doc;
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate a PDF for a SINGLE appointment (detailed view).
 * @param {object} appointment
 * @returns {PDFDocument}
 */
exports.generateSingleAppointmentPDF = (appointment) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4', bufferPages: true });

    drawHeader(doc, 'Appointment Detail', `ID: ${appointment._id}`);

    sectionHeading(doc, 'Appointment Information');
    kv(doc, 'Appointment ID', String(appointment._id));
    kv(doc, 'Date', appointment.date);
    kv(doc, 'Time Slot', `${appointment.startTime || '—'} – ${appointment.endTime || '—'}`);
    kv(doc, 'Doctor ID', String(appointment.doctorId || '—'));
    kv(doc, 'Patient ID', String(appointment.patientId || '—'));
    if (appointment.nurseId) kv(doc, 'Nurse ID', String(appointment.nurseId));
    kv(doc, 'Queue Token', appointment.queueToken != null ? String(appointment.queueToken) : '—');

    // Status with colour
    doc.font('Helvetica-Bold').fontSize(9).fillColor(BRAND.muted).text('STATUS', 40, doc.y, { width: 140 });
    statusBadge(doc, appointment.status, 185, doc.y - 4);
    doc.moveDown(1.2);

    sectionHeading(doc, 'Clinical Notes');
    kv(doc, 'Reason for Visit', appointment.reason || 'Not specified');
    kv(doc, 'Notes', appointment.notes || 'None');

    sectionHeading(doc, 'Timestamps');
    kv(doc, 'Created At', formatDatetime(appointment.createdAt));
    kv(doc, 'Updated At', formatDatetime(appointment.updatedAt));

    // Footer
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        drawFooter(doc);
    }

    doc.end();
    return doc;
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate a PDF for a QUEUE SESSION report.
 * @param {object} session
 * @returns {PDFDocument}
 */
exports.generateQueueReportPDF = (session) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4', bufferPages: true });

    drawHeader(doc, 'Queue Session Report', `Doctor: ...${String(session.doctorId).slice(-6)}  •  Date: ${session.date}`);

    // ── Stats ──
    doc.moveDown(0.5);
    const statY = doc.y;
    drawStatBox(doc, 'Capacity', session.capacity || 0, 40, statY, BRAND.dark);
    drawStatBox(doc, 'Booked', session.bookedCount || 0, 160, statY, BRAND.primary);
    drawStatBox(doc, 'Checked In', session.checkedInCount || 0, 280, statY, BRAND.secondary);
    drawStatBox(doc, 'Served', session.currentToken || 0, 400, statY, BRAND.warn);
    doc.y = statY + 68;

    sectionHeading(doc, 'Session Overview');
    kv(doc, 'Session ID', String(session._id));
    kv(doc, 'Doctor ID', String(session.doctorId));
    kv(doc, 'Date', session.date);
    kv(doc, 'Start Time', session.sessionStartTime || '—');
    kv(doc, 'End Time', session.sessionEndTime || '—');

    doc.font('Helvetica-Bold').fontSize(9).fillColor(BRAND.muted).text('STATUS', 40, doc.y, { width: 140 });
    statusBadge(doc, session.status, 185, doc.y - 4);
    doc.moveDown(1.2);

    kv(doc, 'Capacity', String(session.capacity || 0));
    kv(doc, 'Booked Count', String(session.bookedCount || 0));
    kv(doc, 'Checked-In Count', String(session.checkedInCount || 0));
    kv(doc, 'Current Token', String(session.currentToken || 0));
    kv(doc, 'Next Token', String(session.nextToken || 0));

    // ── Events log ──
    if (session.events && session.events.length > 0) {
        sectionHeading(doc, `Event Log  (${session.events.length} events)`);

        session.events.forEach((ev, i) => {
            if (doc.y > doc.page.height - 80) {
                doc.addPage();
                drawHeader(doc, 'Queue Session Report (cont.)');
            }

            const rowY = doc.y;
            if (i % 2 === 0) doc.rect(40, rowY - 2, doc.page.width - 80, 18).fill(BRAND.light);

            doc.font('Helvetica-Bold').fontSize(8).fillColor(BRAND.dark)
                .text(String(ev.type || ''), 40, rowY, { width: 90 });
            doc.font('Helvetica').fontSize(8).fillColor(BRAND.muted)
                .text(formatDatetime(ev.timestamp), 135, rowY, { width: 150 });
            doc.font('Helvetica').fontSize(8).fillColor(BRAND.dark)
                .text(ev.details || '—', 290, rowY, { width: 265 });
            doc.moveDown(0.9);
        });
    } else {
        doc.font('Helvetica').fontSize(10).fillColor(BRAND.muted)
            .text('No events recorded for this session.', 40, doc.y);
    }

    sectionHeading(doc, 'Timestamps');
    kv(doc, 'Created At', formatDatetime(session.createdAt));
    kv(doc, 'Updated At', formatDatetime(session.updatedAt));

    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        drawFooter(doc);
    }

    doc.end();
    return doc;
};
