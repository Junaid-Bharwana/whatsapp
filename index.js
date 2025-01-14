const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const moment = require('moment');
const app = express();
const port = process.env.PORT || 3000;

// Initialize WhatsApp client
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
            '--disable-gpu',
            '--disable-software-rasterizer',
            '--disable-dev-shm-usage',
            '--single-process'
        ],
        headless: true,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium'
    }
});

// Generate QR Code
client.on('qr', (qr) => {
    console.log('QR RECEIVED');
    qrcode.generate(qr, {small: true});
});

// Ready event
client.on('ready', () => {
    console.log('Client is ready!');
});

// Authentication event
client.on('authenticated', () => {
    console.log('AUTHENTICATED');
});

// Authentication failure event
client.on('auth_failure', msg => {
    console.error('AUTHENTICATION FAILURE', msg);
});

// Disconnected event
client.on('disconnected', (reason) => {
    console.log('Client was disconnected', reason);
});

// Message event
client.on('message', async msg => {
    try {
        const text = msg.body.toLowerCase();

        // Command handler
        switch(text) {
            case '!ping':
                msg.reply('pong');
                break;

            case '!help':
                msg.reply(`*Available Commands:*
!ping - Test bot response
!info - Get bot info
!time - Get current time
!about - About this bot`);
                break;

            case '!info':
                msg.reply(`*WhatsApp Bot Info*
Runtime: ${moment().format('HH:mm:ss')}
Node.js: ${process.version}
Platform: ${process.platform}`);
                break;

            case '!time':
                msg.reply(`Current time: ${moment().format('LLLL')}`)
                break;

            case '!about':
                msg.reply('This bot is running on Render.com');
                break;
        }
    } catch (error) {
        console.error('Error handling message:', error);
        msg.reply('An error occurred while processing your message');
    }
});

// Initialize WhatsApp client
client.initialize();

// Basic web server
app.get('/', (req, res) => {
    res.send('WhatsApp Bot is running!');
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
