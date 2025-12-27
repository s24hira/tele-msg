// Load saved data on startup
window.addEventListener('DOMContentLoaded', () => {
    const savedToken = localStorage.getItem('botToken');
    const savedUserIds = localStorage.getItem('userIds');
    const savedMessage = localStorage.getItem('message');

    if (savedToken) document.getElementById('botToken').value = savedToken;
    if (savedUserIds) {
        document.getElementById('userIds').value = savedUserIds;
        // Trigger blur to format if valid
        try {
            const parsed = JSON.parse(savedUserIds);
            document.getElementById('userIds').value = JSON.stringify(parsed, null, 2);
        } catch (e) {}
    }
    if (savedMessage) document.getElementById('message').value = savedMessage;
});

// Save data on input changes
['botToken', 'userIds', 'message'].forEach(id => {
    document.getElementById(id).addEventListener('input', (e) => {
        localStorage.setItem(id, e.target.value);
    });
});

// Auto-format JSON on blur
document.getElementById('userIds').addEventListener('blur', function() {
    const val = this.value.trim();
    if (val) {
        try {
            const parsed = JSON.parse(val);
            this.value = JSON.stringify(parsed, null, 2);
            this.classList.remove('error');
            this.classList.add('success');
            localStorage.setItem('userIds', this.value);
        } catch (e) {
            this.classList.remove('success');
            this.classList.add('error');
        }
    } else {
        this.classList.remove('success', 'error');
    }
});

function clearLogs() {
    const body = document.getElementById('statusBody');
    const summary = document.getElementById('statusSummary');
    body.innerHTML = '';
    summary.textContent = 'Ready';
    document.getElementById('statusPanel').style.display = 'none';
}

function resetFields() {
    if (confirm('Are you sure you want to clear all fields? This will also remove saved data.')) {
        ['botToken', 'userIds', 'message'].forEach(id => {
            const el = document.getElementById(id);
            el.value = '';
            el.classList.remove('success', 'error');
            localStorage.removeItem(id);
        });
        clearLogs();
    }
}

function copyLogs() {
    const body = document.getElementById('statusBody');
    const logs = Array.from(body.querySelectorAll('.log-entry')).map(entry => {
        return entry.textContent.replace('SENT', '[SENT] ').replace('FAIL', '[FAIL] ');
    }).join('\n');
    
    if (!logs) return;
    
    navigator.clipboard.writeText(logs).then(() => {
        const btn = document.getElementById('copyBtn');
        const originalHtml = btn.innerHTML;
        btn.innerHTML = '<svg class="icon" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>';
        setTimeout(() => {
            btn.innerHTML = originalHtml;
        }, 2000);
    });
}

async function sendMessage() {
    const botToken = document.getElementById('botToken').value.trim();
    const userIdsStr = document.getElementById('userIds').value.trim();
    const message = document.getElementById('message').value.trim();
    
    const btn = document.getElementById('sendBtn');
    const btnText = document.getElementById('btnText');
    const btnSpinner = document.getElementById('btnSpinner');
    const sendIcon = document.getElementById('sendIcon');
    
    const statusBody = document.getElementById('statusBody');
    const statusSummary = document.getElementById('statusSummary');

    if (!botToken || !userIdsStr || !message) {
        alert('Please fill in all fields.');
        return;
    }

    let userIds;
    try {
        userIds = JSON.parse(userIdsStr);
        if (!Array.isArray(userIds)) throw new Error('Not an array');
    } catch (e) {
        alert('Invalid JSON format for User IDs.');
        return;
    }

    // Loading State
    btn.disabled = true;
    btnText.textContent = 'Sending...';
    btnSpinner.style.display = 'block';
    sendIcon.style.display = 'none';
    
    statusBody.innerHTML = ''; // Clear previous logs
    statusSummary.textContent = 'Processing...';
    document.getElementById('statusPanel').style.display = 'flex';

    let successCount = 0;
    let failCount = 0;

    try {
        const response = await fetch('/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                bot_token: botToken,
                user_ids: userIdsStr,
                message: message
            })
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Server Error');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop(); // Keep the last partial line in buffer

            const fragment = document.createDocumentFragment();
            let hasNewLogs = false;

            for (const line of lines) {
                if (!line.trim()) continue;
                try {
                    const res = JSON.parse(line);
                    hasNewLogs = true;
                    
                    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
                    
                    const div = document.createElement('div');
                    div.className = `log-entry ${res.status === 'success' ? 'success' : 'error'}`;
                    
                    const timeSpan = document.createElement('span');
                    timeSpan.className = 'log-time';
                    timeSpan.textContent = time;

                    const badge = document.createElement('span');
                    badge.className = `badge ${res.status === 'success' ? 'success' : 'error'}`;
                    badge.textContent = res.status === 'success' ? 'SENT' : 'FAIL';
                    
                    const text = document.createElement('span');
                    text.className = 'log-text';
                    text.textContent = `User ${res.user_id}`;
                    if (res.error) text.textContent += ` — ${res.error}`;

                    div.appendChild(timeSpan);
                    div.appendChild(badge);
                    div.appendChild(text);
                    fragment.appendChild(div);

                    if (res.status === 'success') successCount++;
                    else failCount++;
                    
                } catch (e) {
                    console.error('Error parsing JSON chunk', e);
                }
            }

            if (hasNewLogs) {
                statusBody.appendChild(fragment);
                statusBody.scrollTop = statusBody.scrollHeight;
                statusSummary.innerHTML = `<span style="color:var(--success)">${successCount} Sent</span> &bull; <span style="color:var(--error)">${failCount} Failed</span>`;
            }
        }

    } catch (error) {
        statusBody.innerHTML += `<div class="log-entry error">Error: ${error.message}</div>`;
        statusSummary.textContent = 'Error';
    } finally {
        btn.disabled = false;
        btnText.textContent = 'Send';
        btnSpinner.style.display = 'none';
        sendIcon.style.display = 'block';
        
        if (statusSummary.textContent === 'Processing...') {
             statusSummary.innerHTML = `<span style="color:var(--success)">${successCount} Sent</span> &bull; <span style="color:var(--error)">${failCount} Failed</span>`;
        }
    }
}
