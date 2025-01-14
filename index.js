const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const path = require('path');
const moment = require('moment');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const port = process.env.PORT || 3000;

// Serve static files
app.use(express.static('public'));
app.use(express.json());

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

// Store connected clients
const clients = new Set();

// WebSocket connection handler
wss.on('connection', (ws) => {
    clients.add(ws);
    
    // Send current state to new client
    if (client.info) {
        ws.send(JSON.stringify({
            type: 'ready',
            number: client.info.wid.user
        }));
    }

    ws.on('close', () => {
        clients.delete(ws);
    });
});

// Broadcast to all connected clients
function broadcast(message) {
    clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message));
        }
    });
}

// WhatsApp Events
client.on('qr', (qr) => {
    console.log('=================QR CODE=================');
    console.log('Scan this QR code in WhatsApp to start bot');
    qrcode.generate(qr, {small: true});
    console.log('=======================================');
    // Also log the QR code string for backup
    console.log('QR Code String:', qr);
    broadcast({ type: 'qr', qr });
});

client.on('ready', () => {
    console.log('Client is ready!');
    broadcast({ 
        type: 'ready',
        number: client.info.wid.user
    });
});

client.on('authenticated', () => {
    console.log('AUTHENTICATED');
});

client.on('auth_failure', msg => {
    console.error('AUTHENTICATION FAILURE', msg);
});

client.on('disconnected', (reason) => {
    console.log('Client was disconnected', reason);
    broadcast({ type: 'disconnected' });
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

// Message Routes
app.post('/send-message', async (req, res) => {
    try {
        const { phone, message } = req.body;
        
        // Format phone number
        const formattedPhone = phone.replace(/[^\d]/g, '') + '@c.us';
        
        // Send message
        await client.sendMessage(formattedPhone, message);
        
        // Broadcast to WebSocket clients
        broadcast({
            type: 'message',
            message: {
                to: phone,
                content: message
            }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error sending message:', error);
        res.json({ success: false, error: error.message });
    }
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// Initialize WhatsApp client
client.initialize();

// Start server
server.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
