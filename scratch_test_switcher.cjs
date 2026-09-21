const { spawn } = require('child_process');
const fs = require('fs');

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9222',
  '--window-size=1536,776',
  '--disable-gpu',
  'http://localhost:5173/'
]);

setTimeout(async () => {
  try {
    const res = await fetch('http://127.0.0.1:9222/json');
    const tabs = await res.json();
    const wsUrl = tabs[0]?.webSocketDebuggerUrl;

    if (wsUrl) {
      const ws = new WebSocket(wsUrl);
      ws.addEventListener('open', () => {
        ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
        ws.send(JSON.stringify({ id: 2, method: 'Page.enable' }));
        
        // Open switcher list
        setTimeout(() => {
          ws.send(JSON.stringify({
            id: 3,
            method: 'Runtime.evaluate',
            params: {
              expression: `(() => {
                const btn = document.querySelector('.switcher-label');
                if (btn) btn.click();
              })()`
            }
          }));
        }, 800);

        // Take screenshot
        setTimeout(() => {
          ws.send(JSON.stringify({
            id: 4,
            method: 'Page.captureScreenshot',
            params: { format: 'png' }
          }));
        }, 1500);
      });

      ws.addEventListener('message', (event) => {
        const data = JSON.parse(event.data);
        if (data.id === 4) {
          const base64 = data.result?.data;
          if (base64) {
            fs.writeFileSync('scratch_versions_view.png', Buffer.from(base64, 'base64'));
            console.log('Saved scratch_versions_view.png, size:', Buffer.byteLength(base64, 'base64'));
          }
          chrome.kill();
          process.exit(0);
        }
      });
    }
  } catch (err) {
    console.error('Error:', err);
    chrome.kill();
    process.exit(1);
  }
}, 2000);
