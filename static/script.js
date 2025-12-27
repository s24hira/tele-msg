// Load saved data on startup
window.addEventListener('DOMContentLoaded', () => {
    const fields = ['botToken', 'userIds', 'message'];
    fields.forEach(id => {
        const val = localStorage.getItem(id);
        if (val) {
            const el = document.getElementById(id);
            el.value = val;
            if (id === 'userIds') {
                try {
                    const parsed = JSON.parse(val);
                    el.value = JSON.stringify(parsed, null, 2);
                    document.getElementById('stat-total').textContent = parsed.length;
                    el.classList.add('success');
                } catch (e) {}
            }
        }
    });
});

// Save data on input changes
['botToken', 'userIds', 'message'].forEach(id => {
    document.getElementById(id).addEventListener('input', (e) => {
        localStorage.setItem(id, e.target.value);
        if (id === 'userIds') {
            try {
                const parsed = JSON.parse(e.target.value);
                document.getElementById('stat-total').textContent = parsed.length;
                e.target.classList.remove('error');
                e.target.classList.add('success');
            } catch (err) {
                e.target.classList.remove('success');
            }
        }
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
            document.getElementById('stat-total').textContent = parsed.length;
            localStorage.setItem('userIds', this.value);
        } catch (e) {
            this.classList.remove('success');
            this.classList.add('error');
        }
    } else {
        this.classList.remove('success', 'error');
        document.getElementById('stat-total').textContent = '0';
    }
});

function clearLogs() {
    document.getElementById('statusBody').innerHTML = '<div class="terminal-entry" style="color: var(--text-muted);">[SYSTEM] Logs cleared... waiting for new sequence.</div>';
    document.getElementById('stat-success').textContent = '0';
    document.getElementById('stat-failed').textContent = '0';
}

function resetFields() {
    if (confirm('Are you sure you want to reset? This will clear all inputs and saved data.')) {
        ['botToken', 'userIds', 'message'].forEach(id => {
            const el = document.getElementById(id);
            el.value = '';
            el.classList.remove('success', 'error');
            localStorage.removeItem(id);
        });
        document.getElementById('stat-total').textContent = '0';
        clearLogs();
    }
}

function addTerminalLog(type, message) {
    const body = document.getElementById('statusBody');
    const time = new Date().toLocaleTimeString([], { hour12: false });
    const div = document.createElement('div');
    div.className = 'terminal-entry';
    
    const prefix = type === 'success' ? '<span class="t-success">[SUCCESS]</span>' : 
                   type === 'error' ? '<span class="t-error">[ERROR]</span>' : 
                   '<span style="color:var(--primary)">[SYSTEM]</span>';

    div.innerHTML = `
        <span class="t-time">${time}</span>
        ${prefix}
        <span>${message}</span>
    `;
    
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
}

async function sendMessage() {
    const botToken = document.getElementById('botToken').value.trim();
    const userIdsStr = document.getElementById('userIds').value.trim();
    const message = document.getElementById('message').value.trim();
    
    const btn = document.getElementById('sendBtn');
    const btnText = document.getElementById('btnText');
    const statSuccess = document.getElementById('stat-success');
    const statFailed = document.getElementById('stat-failed');

    if (!botToken || !userIdsStr || !message) {
        alert('Transmission failed. Missing metadata.');
        return;
    }

    let userIds;
    try {
        userIds = JSON.parse(userIdsStr);
        if (!Array.isArray(userIds)) throw new Error();
    } catch (e) {
        alert('Cipher error. Target Uplinks must be in valid JSON array format.');
        return;
    }

    // Initialize State
    btn.disabled = true;
    btn.classList.add('transmitting');
    btnText.textContent = 'Transmitting...';
    document.getElementById('statusBody').innerHTML = '';
    addTerminalLog('system', `Broadcast sequence initiated for ${userIds.length} targets.`);
    
    let successCount = 0;
    let failCount = 0;
    statSuccess.textContent = '0';
    statFailed.textContent = '0';

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

        if (!response.ok) throw new Error('Gateway timeout or server error.');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop();

            for (const line of lines) {
                if (!line.trim()) continue;
                try {
                    const res = JSON.parse(line);
                    if (res.status === 'success') {
                        successCount++;
                        statSuccess.textContent = successCount;
                        addTerminalLog('success', `Transmission successful for Node ID: ${res.user_id}`);
                    } else {
                        failCount++;
                        statFailed.textContent = failCount;
                        addTerminalLog('error', `Node ID: ${res.user_id} - ${res.error || 'Connection dropped'}`);
                    }
                } catch (e) {}
            }
        }

    } catch (error) {
        addTerminalLog('error', `CRITICAL SYSTEM ERROR: ${error.message}`);
    } finally {
        btn.disabled = false;
        btn.classList.remove('transmitting');
        btnText.textContent = 'Execute Transmission';
        addTerminalLog('system', 'Sequence complete. Awaiting user input.');
    }
}

function copyLogs() {
    const logs = Array.from(document.querySelectorAll('.terminal-entry'))
        .map(el => el.textContent.trim())
        .join('\n');
    
    if (!logs) return;
    
    navigator.clipboard.writeText(logs).then(() => {
        alert('Terminal logs exported to clipboard.');
    });
}

// Password toggle logic
document.getElementById('toggleBotToken').addEventListener('click', function() {
    const botTokenInput = document.getElementById('botToken');
    const eyeOpen = this.querySelector('.eye-open');
    const eyeClosed = this.querySelector('.eye-closed');
    
    if (botTokenInput.type === 'password') {
        botTokenInput.type = 'text';
        eyeOpen.style.display = 'none';
        eyeClosed.style.display = 'block';
    } else {
        botTokenInput.type = 'password';
        eyeOpen.style.display = 'block';
        eyeClosed.style.display = 'none';
    }
});
