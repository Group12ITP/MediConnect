const clinicalThresholds = {
    version: '1.0',
    sugar: {
        unit: 'mg/dL',
        lowMax: 70,
        normalMax: 140
    },
    cholesterol: {
        unit: 'mg/dL',
        normalMax: 200,
        highMin: 240
    },
    bloodPressure: {
        unit: 'mmHg',
        systolic: {
            normalMax: 120,
            highMin: 140
        },
        diastolic: {
            normalMax: 80,
            highMin: 90
        }
    }
};

module.exports = clinicalThresholds;
