const ClinicalThreshold = require('../Models/ClinicalThreshold');
const PatientReport = require('../Models/PatientReport'); // Assuming you want to save it

class ReportService {

    async classifyReport(data) {
        // Load configurations (can cache this)
        // For simplicity, fetching all or by type
        // In real app, fetch specific version

        const thresholds = require('../Config/clinicalThresholds');
        // Or fetch from DB: await ClinicalThreshold.findOne({ active: true });

        let classification = 'NORMAL';

        if (data.type === 'SUGAR') {
            if (data.value.sugar > thresholds.sugar.normalMax) classification = 'HIGH';
            else if (data.value.sugar < thresholds.sugar.lowMax) classification = 'LOW';
        } else if (data.type === 'CHOLESTEROL') {
            if (data.value.cholesterol > thresholds.cholesterol.normalMax) classification = 'HIGH';
            // cholesterol usually doesn't have "low" risk in this context, but depends on requirements
        } else if (data.type === 'BLOOD_PRESSURE') {
            const { systolic, diastolic } = data.value.bp;
            const { systolic: sysThresh, diastolic: diaThresh } = thresholds.bloodPressure;

            if (systolic > sysThresh.normalMax || diastolic > diaThresh.normalMax) {
                classification = 'HIGH';
            }
            // Add low logic if needed
        }

        return classification;
    }

    async createReport(data) {
        const classification = await this.classifyReport(data);

        const report = new PatientReport({
            ...data,
            classification,
            thresholdVersion: '1.0' // Should come from config
        });

        return await report.save();
    }
}

module.exports = new ReportService();
