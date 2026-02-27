const http = require('http');

const makeRequest = (options, data) => {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => resolve({ statusCode: res.statusCode, body: body ? JSON.parse(body) : {} }));
        });
        req.on('error', reject);
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
};

const runTests = async () => {
    try {
        console.log('Starting Tests...');

        // 1. Create Doctor Schedule
        const doctorId = '60d5ecb8b392d7001f8e6c01'; // Mock ID
        console.log('\nCreating Doctor Schedule...');
        const scheduleRes = await makeRequest({
            hostname: 'localhost', port: 5000, path: `/api/doctors/${doctorId}/schedule`, method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-role': 'DOCTOR', 'x-user-id': doctorId }
        }, {
            doctorId, timezone: 'UTC', workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
            dailyStartTime: '09:00', dailyEndTime: '17:00', slotDurationMinutes: 30
        });
        console.log('Create Schedule Status:', scheduleRes.statusCode);

        // 2. Get Slots
        console.log('\nGetting Slots...');
        const slotsRes = await makeRequest({
            hostname: 'localhost', port: 5000, path: `/api/doctors/${doctorId}/slots?date=2024-01-01`, method: 'GET',
            headers: { 'x-role': 'PATIENT' }
        });
        console.log('Get Slots Status:', slotsRes.statusCode);
        console.log('Slots found:', slotsRes.body.count);

        // 3. Book Appointment
        console.log('\nBooking Appointment...');
        const patientId = '60d5ecb8b392d7001f8e6c02';
        const bookRes = await makeRequest({
            hostname: 'localhost', port: 5000, path: '/api/appointments', method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-role': 'PATIENT', 'x-user-id': patientId }
        }, {
            doctorId, date: '2024-01-01', startTime: '09:00', endTime: '09:30', reason: 'Checkup'
        });
        console.log('Book Appointment Status:', bookRes.statusCode);
        const appointmentId = bookRes.body.data ? bookRes.body.data._id : null;

        // 4. Double Book (should fail)
        console.log('\nAttempting Double Book...');
        const conflictRes = await makeRequest({
            hostname: 'localhost', port: 5000, path: '/api/appointments', method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-role': 'PATIENT', 'x-user-id': 'another_patient' }
        }, {
            doctorId, date: '2024-01-01', startTime: '09:00', endTime: '09:30', reason: 'Conflict'
        });
        console.log('Double Book Status (Expected 409):', conflictRes.statusCode);

        // 5. Create Queue Session
        console.log('\nCreating Queue Session...');
        const sessionRes = await makeRequest({
            hostname: 'localhost', port: 5000, path: '/api/queue-sessions', method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-role': 'NURSE' }
        }, {
            doctorId, date: '2024-01-01'
        });
        console.log('Create Session Status:', sessionRes.statusCode);
        const sessionId = sessionRes.body.data ? sessionRes.body.data._id : null;

        if (sessionId && appointmentId) {
            // 6. Check In
            console.log('\nChecking In Patient...');
            const checkInRes = await makeRequest({
                hostname: 'localhost', port: 5000, path: `/api/queue-sessions/${sessionId}/check-in`, method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-role': 'NURSE' }
            }, { appointmentId });
            console.log('Check-in Status:', checkInRes.statusCode);
            console.log('Assigned Token:', checkInRes.body.data ? checkInRes.body.data.appointment.queueToken : 'N/A');

            // 7. Start Session
            console.log('\nStarting Session...');
            await makeRequest({
                hostname: 'localhost', port: 5000, path: `/api/queue-sessions/${sessionId}/start`, method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-role': 'DOCTOR' }
            }, {});

            // 8. Call Next
            console.log('\nCalling Next...');
            const callRes = await makeRequest({
                hostname: 'localhost', port: 5000, path: `/api/queue-sessions/${sessionId}/call-next`, method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-role': 'DOCTOR' }
            }, {});
            console.log('Call Next Status:', callRes.statusCode);
            console.log('Current Token:', callRes.body.data ? callRes.body.data.currentToken : 'N/A');
        }

        // 9. Report Classification
        console.log('\nSubmitting Report...');
        const reportRes = await makeRequest({
            hostname: 'localhost', port: 5000, path: `/api/patients/${patientId}/reports`, method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-role': 'NURSE' }
        }, {
            type: 'SUGAR', value: { sugar: 180 }, unit: 'mg/dL' // High
        });
        console.log('Submit Report Status:', reportRes.statusCode);
        console.log('Classification:', reportRes.body.data ? reportRes.body.data.classification : 'N/A');

    } catch (err) {
        console.error('Test Error:', err);
    }
};

runTests();
