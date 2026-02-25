const ReportService = require('../Services/ReportService');
const PatientReport = require('../Models/PatientReport');

exports.createReport = async (req, res, next) => {
    try {
        const { patientId } = req.params;
        const reportData = { ...req.body, patientId };

        const report = await ReportService.createReport(reportData);

        res.status(201).json({ success: true, data: report });
    } catch (err) {
        next(err);
    }
};

exports.getReports = async (req, res, next) => {
    try {
        const { patientId } = req.params;
        const { latest } = req.query;

        let reports;
        if (latest === 'true') {
            // Get one of each type, sorted by latest
            // Aggregate or just find relevant types
            // Simple approach: find all, sort desc, filter in code or separate queries
            const types = ['SUGAR', 'CHOLESTEROL', 'BLOOD_PRESSURE'];
            reports = [];
            for (const type of types) {
                const latestReport = await PatientReport.findOne({ patientId, type }).sort({ createdAt: -1 });
                if (latestReport) reports.push(latestReport);
            }
        } else {
            reports = await PatientReport.find({ patientId }).sort({ createdAt: -1 });
        }

        res.status(200).json({ success: true, count: reports.length, data: reports });
    } catch (err) {
        next(err);
    }
};
