const express = require('express');
const { Client } = require('whatsapp-web.js');
const app = express();
const port = 3000;

// Start the Express server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

const client = new Client();

client.on('qr', (qr) => {
    console.log('QR RECEIVED', qr);
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.initialize();