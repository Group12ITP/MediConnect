const ReportService = require('../Services/ReportService');
const PatientReport = require('../Models/PatientReport');
const { success } = require('../Utils/response');

exports.createReport = async (req, res, next) => {
    try {
        const { patientId } = req.params;
        const reportData = { ...req.body, patientId };

        const report = await ReportService.createReport(reportData);

        return success(res, 'report.created', report, 201);
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
            const types = ['SUGAR', 'CHOLESTEROL', 'BLOOD_PRESSURE'];
            reports = [];
            for (const type of types) {
                const latestReport = await PatientReport.findOne({ patientId, type }).sort({ createdAt: -1 });
                if (latestReport) reports.push(latestReport);
            }
        } else {
            reports = await PatientReport.find({ patientId }).sort({ createdAt: -1 });
        }

        res.status(200).json({
            ok: true,
            message: res.__('common.success'),
            count: reports.length,
            data: reports,
            locale: req.locale
        });
    } catch (err) {
        next(err);
    }
};
