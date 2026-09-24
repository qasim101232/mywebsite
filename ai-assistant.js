// =========================================================
// CONFIG
// =========================================================
const API_BASE = 'http://localhost:5000';

// =========================================================
// ELEMENTS
// =========================================================
const chatBubble = document.getElementById('chatBubble');
const chatWindow = document.getElementById('chatWindow');
const closeChat = document.getElementById('closeChat');
const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const courseIdSelect = document.getElementById('courseId');

let isWaiting = false;

// =========================================================
// TOGGLE CHAT
// =========================================================
chatBubble.addEventListener('click', () => {
    chatWindow.classList.add('active');
    chatBubble.classList.add('hidden');
    setTimeout(() => userInput.focus(), 300);
});

closeChat.addEventListener('click', () => {
    chatWindow.classList.remove('active');
    chatBubble.classList.remove('hidden');
});

// =========================================================
// ADD MESSAGE
// =========================================================
function addMessage(text, sender = 'bot') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;

    const avatar = sender === 'bot' ? 'fa-robot' : 'fa-user';
    const safeText = escapeHtml(text).replace(/\n/g, '<br>');

    messageDiv.innerHTML = `
        <div class="avatar"><i class="fas ${avatar}"></i></div>
        <div class="bubble">${safeText}</div>
    `;

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// =========================================================
// TYPING INDICATOR
// =========================================================
function showTyping() {
    const div = document.createElement('div');
    div.className = 'message bot';
    div.id = 'typingIndicator';
    div.innerHTML = `
        <div class="avatar"><i class="fas fa-robot"></i></div>
        <div class="bubble typing">
            <span></span><span></span><span></span>
        </div>
    `;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function hideTyping() {
    const el = document.getElementById('typingIndicator');
    if (el) el.remove();
}

// =========================================================
// SEND MESSAGE
// =========================================================
async function sendMessage() {
    if (isWaiting) return;

    const message = userInput.value.trim();
    if (!message) return;

    const courseId = parseInt(courseIdSelect.value);

    addMessage(message, 'user');
    userInput.value = '';
    sendBtn.disabled = true;
    isWaiting = true;

    showTyping();

    try {
        const response = await fetch(`${API_BASE}/api/ai/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: message,
                courseId: courseId
            })
        });

        const data = await response.json();
        hideTyping();

        if (data.success) {
            addMessage(data.reply, 'bot');
        } else {
            addMessage('❌ ' + (data.error || 'AI jawab nahi de saka'), 'bot');
        }

    } catch (error) {
        hideTyping();
        addMessage('❌ Connection error!\n\nBackend chal raha hai?\n• CMD mein "node server.js" chalayein\n• http://localhost:5000/api/health kholein', 'bot');
        console.error('Error:', error);
    }

    sendBtn.disabled = false;
    isWaiting = false;
    userInput.focus();
}

// =========================================================
// EVENTS
// =========================================================
sendBtn.addEventListener('click', sendMessage);

userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// =========================================================
// HTML ESCAPE
// =========================================================
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}