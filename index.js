const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Initialize WhatsApp client with Android-specific configurations
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ]
        // Removed executablePath to use system Chrome/Chromium
    }
});

// Generate QR Code
client.on('qr', (qr) => {
    console.log('QR RECEIVED', qr);
    qrcode.generate(qr, {small: true});
});

// Ready event
client.on('ready', () => {
    console.log('Client is ready!');
});

// Message event
client.on('message', msg => {
    if (msg.body === '!ping') {
        msg.reply('pong');
    }
});

// Initialize WhatsApp client
client.initialize();

// Basic web server
app.get('/', (req, res) => {
    res.send('WhatsApp Bot is running!');
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
