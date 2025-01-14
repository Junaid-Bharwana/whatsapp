// DOM Elements
const statusBadge = document.getElementById('status-badge');
const qrContainer = document.getElementById('qr-container');
const connectedInfo = document.getElementById('connected-info');
const connectedNumber = document.getElementById('connected-number');
const messageForm = document.getElementById('message-form');
const recentMessages = document.getElementById('recent-messages');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');

// WebSocket Connection
let ws;
function connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    ws = new WebSocket(`${protocol}//${window.location.host}`);

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
    };

    ws.onclose = () => {
        updateStatus('disconnected');
        setTimeout(connectWebSocket, 3000);
    };
}

// Handle WebSocket Messages
function handleWebSocketMessage(data) {
    switch(data.type) {
        case 'qr':
            showQRCode(data.qr);
            updateStatus('waiting');
            break;
        case 'ready':
            hideQRCode();
            updateStatus('connected');
            showConnectedNumber(data.number);
            break;
        case 'disconnected':
            updateStatus('disconnected');
            hideQRCode();
            break;
        case 'message':
            addRecentMessage(data.message);
            break;
    }
}

// Update Status Badge
function updateStatus(status) {
    statusBadge.className = 'px-3 py-1 rounded-full text-sm font-semibold';
    switch(status) {
        case 'connected':
            statusBadge.classList.add('status-connected');
            statusBadge.textContent = 'Connected';
            break;
        case 'disconnected':
            statusBadge.classList.add('status-disconnected');
            statusBadge.textContent = 'Disconnected';
            break;
        case 'waiting':
            statusBadge.classList.add('status-waiting');
            statusBadge.textContent = 'Waiting for scan';
            break;
    }
}

// Show/Hide QR Code
function showQRCode(qrData) {
    qrContainer.classList.remove('hidden');
    connectedInfo.classList.add('hidden');
    const qrCode = document.getElementById('qr-code');
    qrCode.innerHTML = '';
    QRCode.toCanvas(qrCode, qrData, { width: 200 }, (error) => {
        if (error) console.error(error);
    });
}

function hideQRCode() {
    qrContainer.classList.add('hidden');
}

// Show Connected Number
function showConnectedNumber(number) {
    connectedInfo.classList.remove('hidden');
    connectedNumber.textContent = number;
}

// Handle Message Form
messageForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const phone = document.getElementById('phone').value;
    const message = document.getElementById('message').value;

    try {
        const response = await fetch('/send-message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ phone, message }),
        });

        const data = await response.json();
        if (data.success) {
            showToast('Message sent successfully!');
            document.getElementById('message').value = '';
            addRecentMessage({ to: phone, content: message });
        } else {
            showToast('Failed to send message: ' + data.error);
        }
    } catch (error) {
        showToast('Error sending message');
    }
});

// Add Recent Message
function addRecentMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.className = 'message-item fade-in';
    messageElement.innerHTML = `
        <div class="flex justify-between">
            <span class="font-semibold">${message.to}</span>
            <span class="text-gray-500 text-sm">${new Date().toLocaleTimeString()}</span>
        </div>
        <p class="text-gray-600 mt-1">${message.content}</p>
    `;
    recentMessages.insertBefore(messageElement, recentMessages.firstChild);
}

// Show Toast Message
function showToast(message) {
    toastMessage.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Initialize
connectWebSocket();
