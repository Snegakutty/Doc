const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

const patientsQueue = Array.from({ length: 20 }, (_, i) => `Patient ${i + 1}`);
let doctors = [
    { id: 'a', name: 'Doctor A', available: true },
    { id: 'b', name: 'Doctor B', available: true },
    { id: 'c', name: 'Doctor C', available: true },
    { id: 'd', name: 'Doctor D', available: true }
];

let currentAssignments = [];
let doctorLeft = false;

const assignPatient = () => {
    doctors.forEach((doc) => {
        if (doc.available && patientsQueue.length > 0 && !(doc.id === 'c' && doctorLeft)) {
            const patient = patientsQueue.shift();
            currentAssignments.push({ doctor: doc.name, patient });
            doc.available = false;

            io.emit('update', { currentAssignments, doctors, patientsQueue });

            const visitTime = Math.random() * 5000 + 2000;
            setTimeout(() => {
                doc.available = true;
                currentAssignments = currentAssignments.filter(assignment => assignment.doctor !== doc.name);
                io.emit('update', { currentAssignments, doctors, patientsQueue });
                assignPatient();
            }, visitTime);
        }
    });
};

io.on('connection', (socket) => {
    socket.emit('update', { currentAssignments, doctors, patientsQueue });
    assignPatient();
});

setTimeout(() => {
    doctorLeft = true;
    doctors = doctors.filter(doc => doc.id !== 'c'); // Doctor C leaves
    io.emit('doctorLeft', { doctorId: 'c' });
}, 10000); // After 10 seconds

server.listen(3000, () => {
    console.log('Server running on port 3000');
});
