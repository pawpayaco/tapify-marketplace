/**
 * Diagnostic endpoint to test tracking script installation
 * GET /api/test-tracking
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Return HTML page with tracking test
  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(`
<!DOCTYPE html>
<html>
<head>
  <title>Tapify Tracking Script Test</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      max-width: 900px;
      margin: 40px auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .card {
      background: white;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    h1 {
      color: #ff6fb3;
      margin-top: 0;
    }
    h2 {
      color: #333;
      border-bottom: 2px solid #ff6fb3;
      padding-bottom: 8px;
    }
    .status {
      padding: 12px;
      border-radius: 8px;
      margin: 12px 0;
      font-weight: bold;
    }
    .status.success {
      background: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }
    .status.error {
      background: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }
    .status.warning {
      background: #fff3cd;
      color: #856404;
      border: 1px solid #ffeaa7;
    }
    code {
      background: #f4f4f4;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'Monaco', 'Courier New', monospace;
      font-size: 13px;
    }
    pre {
      background: #2d2d2d;
      color: #f8f8f2;
      padding: 16px;
      border-radius: 8px;
      overflow-x: auto;
      font-size: 13px;
    }
    button {
      background: linear-gradient(135deg, #ff7a4a, #ff6fb3);
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: bold;
      cursor: pointer;
      font-size: 14px;
      margin-right: 8px;
    }
    button:hover {
      opacity: 0.9;
    }
    .log-entry {
      padding: 8px;
      margin: 4px 0;
      border-radius: 4px;
      font-family: monospace;
      font-size: 12px;
    }
    .log-entry.info {
      background: #e7f3ff;
      color: #004085;
    }
    .log-entry.success {
      background: #d4edda;
      color: #155724;
    }
    .log-entry.error {
      background: #f8d7da;
      color: #721c24;
    }
    #console-logs {
      max-height: 400px;
      overflow-y: auto;
      background: #f8f9fa;
      padding: 12px;
      border-radius: 8px;
      border: 1px solid #dee2e6;
    }
  </style>
</head>
<body>
  <h1>🔍 Tapify Tracking Script Diagnostics</h1>

  <div class="card">
    <h2>1. Script Installation Check</h2>
    <div id="script-status">Checking...</div>

    <h3>How to Install on Shopify:</h3>
    <p>Add this snippet to your theme's <code>theme.liquid</code> file, just before the closing <code>&lt;/body&gt;</code> tag:</p>
    <pre>&lt;script src="https://tapify-marketplace.vercel.app/api/tracking-script.js"&gt;&lt;/script&gt;</pre>

    <p><strong>Steps:</strong></p>
    <ol>
      <li>In Shopify Admin, go to <strong>Online Store → Themes</strong></li>
      <li>Click <strong>Actions → Edit code</strong> on your active theme</li>
      <li>Find <code>Layout/theme.liquid</code> in the left sidebar</li>
      <li>Scroll to the bottom, find <code>&lt;/body&gt;</code></li>
      <li>Paste the script tag above <code>&lt;/body&gt;</code></li>
      <li>Click <strong>Save</strong></li>
    </ol>
  </div>

  <div class="card">
    <h2>2. Attribution Storage Test</h2>
    <div id="storage-status">Checking...</div>
    <button onclick="testStorage()">Test Storage</button>
    <button onclick="clearStorage()">Clear Storage</button>
  </div>

  <div class="card">
    <h2>3. Cart Attribution Test</h2>
    <p>This simulates adding attribution to a Shopify cart.</p>
    <div id="cart-status"></div>
    <button onclick="testCartAttribution()">Test Cart API</button>
  </div>

  <div class="card">
    <h2>4. URL Parameters Test</h2>
    <div id="url-status">Checking...</div>
    <p>
      <strong>Test with this link:</strong><br>
      <a href="?ref=TEST_UID_12345&email=test@example.com&retailer_id=test-retailer-123" target="_blank">
        Click to test with sample parameters
      </a>
    </p>
  </div>

  <div class="card">
    <h2>5. Console Logs</h2>
    <div id="console-logs"></div>
    <button onclick="clearLogs()">Clear Logs</button>
  </div>

  <script>
    const logs = [];

    function addLog(message, type = 'info') {
      const timestamp = new Date().toLocaleTimeString();
      logs.push({ timestamp, message, type });

      const logsDiv = document.getElementById('console-logs');
      const logEntry = document.createElement('div');
      logEntry.className = 'log-entry ' + type;
      logEntry.textContent = '[' + timestamp + '] ' + message;
      logsDiv.appendChild(logEntry);
      logsDiv.scrollTop = logsDiv.scrollHeight;

      console.log('[Tapify Test]', message);
    }

    function clearLogs() {
      document.getElementById('console-logs').innerHTML = '';
      logs.length = 0;
      addLog('Logs cleared', 'info');
    }

    // Check if tracking script is loaded
    function checkScriptInstallation() {
      const scriptSrc = 'https://tapify-marketplace.vercel.app/api/tracking-script.js';
      const scripts = document.querySelectorAll('script[src*="tracking-script"]');

      const statusDiv = document.getElementById('script-status');

      if (scripts.length > 0) {
        statusDiv.innerHTML = '<div class="status success">✅ Tracking script found on this page</div>';
        addLog('Tracking script is loaded', 'success');
      } else {
        statusDiv.innerHTML = '<div class="status error">❌ Tracking script NOT found on this page</div>' +
          '<p><strong>Note:</strong> This is a test page. Check your Shopify store at <code>pawpayaco.com</code></p>';
        addLog('Tracking script not loaded on this test page (expected)', 'info');
      }
    }

    // Test sessionStorage and localStorage
    function testStorage() {
      try {
        // Test sessionStorage
        sessionStorage.setItem('tapify_test', 'working');
        const sessionTest = sessionStorage.getItem('tapify_test');
        sessionStorage.removeItem('tapify_test');

        // Test localStorage
        localStorage.setItem('tapify_test', 'working');
        const localTest = localStorage.getItem('tapify_test');
        localStorage.removeItem('tapify_test');

        if (sessionTest === 'working' && localTest === 'working') {
          document.getElementById('storage-status').innerHTML =
            '<div class="status success">✅ Storage working correctly</div>';
          addLog('sessionStorage and localStorage are working', 'success');
        } else {
          throw new Error('Storage test failed');
        }
      } catch (err) {
        document.getElementById('storage-status').innerHTML =
          '<div class="status error">❌ Storage error: ' + err.message + '</div>';
        addLog('Storage error: ' + err.message, 'error');
      }
    }

    function clearStorage() {
      sessionStorage.removeItem('tapify_ref');
      sessionStorage.removeItem('tapify_ref_added');
      sessionStorage.removeItem('tapify_ref_timestamp');
      sessionStorage.removeItem('tapify_retailer_email');
      sessionStorage.removeItem('tapify_retailer_id');

      localStorage.removeItem('tapify_ref');
      localStorage.removeItem('tapify_retailer_email');
      localStorage.removeItem('tapify_retailer_id');

      document.getElementById('storage-status').innerHTML =
        '<div class="status success">✅ Storage cleared</div>';
      addLog('All Tapify storage cleared', 'success');
    }

    // Test cart API (simulated)
    function testCartAttribution() {
      const statusDiv = document.getElementById('cart-status');
      statusDiv.innerHTML = '<div class="status warning">⚠️ Cannot test Shopify Cart API from this domain</div>' +
        '<p>The <code>/cart/update.js</code> endpoint only works on your Shopify store (pawpayaco.com)</p>' +
        '<p><strong>To test manually:</strong></p>' +
        '<ol>' +
        '<li>Visit <code>pawpayaco.com/products/any-product?ref=TEST123</code></li>' +
        '<li>Open browser console (F12)</li>' +
        '<li>Look for <code>[Tapify]</code> log messages</li>' +
        '<li>Add product to cart</li>' +
        '<li>Check cart with: <code>fetch("/cart.js").then(r => r.json()).then(console.log)</code></li>' +
        '<li>Verify <code>attributes</code> contains <code>ref: "TEST123"</code></li>' +
        '</ol>';

      addLog('Cart API test requires Shopify domain', 'info');
    }

    // Check URL parameters
    function checkURLParams() {
      const urlParams = new URLSearchParams(window.location.search);
      const ref = urlParams.get('ref');
      const email = urlParams.get('email');
      const retailerId = urlParams.get('retailer_id');

      const statusDiv = document.getElementById('url-status');
      let html = '';

      if (ref || email || retailerId) {
        html += '<div class="status success">✅ URL parameters detected:</div><ul>';
        if (ref) {
          html += '<li><strong>ref:</strong> ' + ref + '</li>';
          addLog('URL param ref: ' + ref, 'success');
        }
        if (email) {
          html += '<li><strong>email:</strong> ' + email + '</li>';
          addLog('URL param email: ' + email, 'success');
        }
        if (retailerId) {
          html += '<li><strong>retailer_id:</strong> ' + retailerId + '</li>';
          addLog('URL param retailer_id: ' + retailerId, 'success');
        }
        html += '</ul>';
      } else {
        html = '<div class="status warning">⚠️ No URL parameters found</div>' +
          '<p>Click the test link above to add parameters</p>';
        addLog('No URL parameters detected', 'info');
      }

      statusDiv.innerHTML = html;
    }

    // Run checks on page load
    window.addEventListener('DOMContentLoaded', () => {
      addLog('Diagnostic page loaded', 'info');
      checkScriptInstallation();
      testStorage();
      checkURLParams();
    });
  </script>
</body>
</html>
  `);
}
