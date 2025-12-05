const axios = require('axios');
const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const BASE_WIDGET_PREFIX = 'GR-C-Categ-';
const OUTPUT_DIR = path.join(__dirname, 'output');
const MAX_RUNTIME_MS = parseInt(process.env.MAX_RUNTIME_SECONDS || '21000') * 1000; // 默认5.8小时，留点buffer

// Parse command line arguments
// Usage: node fetch-category.js [startHex] [endHex] [concurrency]
const args = process.argv.slice(2);
const START_HEX = args[0] || '00000000';
const END_HEX = args[1] || 'ffffffff';
const CONCURRENCY = parseInt(args[2]) || 50;

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Create an axios instance with a custom agent to manage connections
const httpsAgent = new https.Agent({ 
  keepAlive: true,
  maxSockets: CONCURRENCY,
  maxFreeSockets: 10,
  timeout: 60000 // 60 seconds
});

const axiosInstance = axios.create({
  httpsAgent: httpsAgent,
  timeout: 10000,
  validateStatus: () => true // Handle status codes manually
});

async function fetchWidget(widgetId) {
  const config = {
    method: 'get',
    maxBodyLength: Infinity,
    url: `https://www.safeway.com/abs/pub/xapi/wcax/pathway/search?request-id=1201764933828443125&url=https://www.safeway.com&search-uid=&q=&rows=300&start=0&channel=instore&storeid=3132&sort=&widget-id=${widgetId}&dvid=web-4.1search&uuid=null&pgm=abs&includeOffer=true&banner=safeway`,
    headers: { 
      'accept': 'application/json, text/plain, */*', 
      'accept-language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7', 
      'cache-control': 'no-cache', 
      'dnt': '1', 
      'ocp-apim-subscription-key': 'e914eec9448c4d5eb672debf5011cf8f', 
      'pragma': 'no-cache', 
      'priority': 'u=1, i', 
      'referer': 'https://www.safeway.com/home/produce.html', 
      'sec-ch-ua': '"Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"', 
      'sec-ch-ua-mobile': '?0', 
      'sec-ch-ua-platform': '"macOS"', 
      'sec-fetch-dest': 'empty', 
      'sec-fetch-mode': 'cors', 
      'sec-fetch-site': 'same-origin', 
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 
    }
  };

  try {
    const response = await axiosInstance.request(config);
    return response.data;
  } catch (error) {
    // console.error(`Error fetching ${widgetId}:`, error.message);
    return null;
  }
}

async function saveResult(widgetId, data, stats) {
  if (data && data.response && data.response.miscInfo && data.response.miscInfo.filter) {
    const filePath = path.join(OUTPUT_DIR, `${widgetId}.json`);
    const content = JSON.stringify(data, null, 2);
    
    try {
      await fs.promises.writeFile(filePath, content);
      stats.successfulWidgets.push(widgetId);
      stats.foundCount++;
      console.log(`\n[FOUND] Saved ${widgetId} (Total found: ${stats.foundCount})`);
    } catch (err) {
      console.error(`\n[ERROR] Failed to save ${widgetId}: ${err.message}`);
    }
  }
}

async function saveProgress(stats, lastProcessedHex) {
  const progressFile = path.join(OUTPUT_DIR, 'progress.json');
  const progress = {
    startHex: START_HEX,
    endHex: END_HEX,
    lastProcessedHex: lastProcessedHex,
    processedCount: stats.processedCount,
    foundCount: stats.foundCount,
    successfulWidgets: stats.successfulWidgets,
    startTime: stats.startTime,
    lastUpdateTime: new Date().toISOString(),
    elapsedSeconds: Math.floor((Date.now() - stats.startTimeMs) / 1000),
    avgRate: (stats.processedCount / ((Date.now() - stats.startTimeMs) / 1000)).toFixed(2)
  };
  
  try {
    await fs.promises.writeFile(progressFile, JSON.stringify(progress, null, 2));
  } catch (err) {
    console.error(`Failed to save progress: ${err.message}`);
  }
}

async function saveSummary(stats, lastProcessedHex, reason = 'completed') {
  const summaryFile = path.join(OUTPUT_DIR, 'summary.txt');
  const elapsed = (Date.now() - stats.startTimeMs) / 1000;
  const hours = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  const seconds = Math.floor(elapsed % 60);
  
  const summary = `
╔════════════════════════════════════════════════════════╗
║           SAFEWAY CATEGORY SCAN SUMMARY                ║
╚════════════════════════════════════════════════════════╝

📊 Scan Statistics:
   Start Range:        ${START_HEX}
   End Range:          ${END_HEX}
   Last Processed:     ${lastProcessedHex}
   Stop Reason:        ${reason}

⏱️  Time Statistics:
   Started:            ${stats.startTime}
   Duration:           ${hours}h ${minutes}m ${seconds}s
   Avg Rate:           ${(stats.processedCount / elapsed).toFixed(2)} req/s

✅ Results:
   Total Processed:    ${stats.processedCount.toLocaleString()}
   Widgets Found:      ${stats.foundCount}
   Success Rate:       ${((stats.foundCount / stats.processedCount) * 100).toFixed(4)}%

🎯 Found Widgets:
${stats.successfulWidgets.length > 0 ? stats.successfulWidgets.map(w => `   - ${w}`).join('\n') : '   (none found)'}

═══════════════════════════════════════════════════════════
`;

  try {
    await fs.promises.writeFile(summaryFile, summary);
    console.log(summary);
  } catch (err) {
    console.error(`Failed to save summary: ${err.message}`);
  }
}

async function main() {
  const startInt = parseInt(START_HEX, 16);
  const endInt = Math.min(parseInt(END_HEX, 16), 4294967295);
  
  console.log(`╔════════════════════════════════════════════════════════╗`);
  console.log(`║           Starting Safeway Category Scan              ║`);
  console.log(`╚════════════════════════════════════════════════════════╝`);
  console.log(`Range:       ${START_HEX} (${startInt}) → ${END_HEX} (${endInt})`);
  console.log(`Total IDs:   ${(endInt - startInt + 1).toLocaleString()}`);
  console.log(`Concurrency: ${CONCURRENCY}`);
  console.log(`Output:      ${OUTPUT_DIR}`);
  console.log(`Max Runtime: ${(MAX_RUNTIME_MS / 1000 / 3600).toFixed(1)} hours`);
  console.log(`═══════════════════════════════════════════════════════════\n`);

  // Statistics
  const stats = {
    processedCount: 0,
    foundCount: 0,
    successfulWidgets: [],
    startTime: new Date().toISOString(),
    startTimeMs: Date.now()
  };

  let currentInt = startInt;
  const activePromises = new Set();
  let shouldStop = false;
  let lastProcessedHex = START_HEX;
  
  // 定期检查时间限制
  const timeCheckInterval = setInterval(() => {
    const elapsed = Date.now() - stats.startTimeMs;
    if (elapsed >= MAX_RUNTIME_MS) {
      console.log(`\n\n⏰ Approaching time limit (${(elapsed/1000/3600).toFixed(2)}h), gracefully stopping...`);
      shouldStop = true;
      clearInterval(timeCheckInterval);
    }
  }, 10000); // 每10秒检查一次

  // 定期保存进度（每30秒）
  const progressInterval = setInterval(async () => {
    await saveProgress(stats, lastProcessedHex);
  }, 30000);

  try {
    while (currentInt <= endInt && !shouldStop) {
      // Fill the pool
      while (activePromises.size < CONCURRENCY && currentInt <= endInt && !shouldStop) {
        const currentHex = currentInt.toString(16).toLowerCase();
        const paddedHex = currentHex.padStart(8, '0');
        const widgetId = `${BASE_WIDGET_PREFIX}${paddedHex}`;
        
        lastProcessedHex = paddedHex;
        
        // Create promise
        const p = fetchWidget(widgetId)
          .then(data => saveResult(widgetId, data, stats))
          .catch(() => {}) // Swallow errors in loop
          .finally(() => {
            activePromises.delete(p);
            stats.processedCount++;
            
            if (stats.processedCount % 100 === 0) {
              const elapsed = (Date.now() - stats.startTimeMs) / 1000;
              const rate = (stats.processedCount / elapsed).toFixed(1);
              const remaining = endInt - currentInt;
              const etaSeconds = remaining / parseFloat(rate);
              const etaHours = (etaSeconds / 3600).toFixed(1);
              const progress = ((currentInt - startInt) / (endInt - startInt) * 100).toFixed(2);
              
              // 在 GitHub Actions 中，每1000次输出一次完整的日志行
              if (stats.processedCount % 1000 === 0) {
                console.log(
                  `\n[${new Date().toISOString()}] ` +
                  `Progress: ${paddedHex} | ` +
                  `Found: ${stats.foundCount} | ` +
                  `Processed: ${stats.processedCount.toLocaleString()} (${progress}%) | ` +
                  `Rate: ${rate} req/s | ` +
                  `ETA: ${etaHours}h`
                );
              } else {
                process.stdout.write(
                  `\r📍 ${paddedHex} | ` +
                  `✅ Found: ${stats.foundCount} | ` +
                  `📊 Processed: ${stats.processedCount.toLocaleString()} (${progress}%) | ` +
                  `⚡ ${rate} req/s | ` +
                  `⏳ ETA: ${etaHours}h | ` +
                  `🔄 Active: ${activePromises.size}`.padEnd(20)
                );
              }
            }
          });
          
        activePromises.add(p);
        currentInt++;
      }

      // Wait for at least one promise to resolve if full
      if (activePromises.size >= CONCURRENCY) {
        await Promise.race(activePromises);
      }
    }

    // Wait for remaining promises
    console.log(`\n\n⏳ Waiting for remaining ${activePromises.size} requests to complete...`);
    await Promise.all(activePromises);
    
  } finally {
    clearInterval(timeCheckInterval);
    clearInterval(progressInterval);
    
    // Final progress save
    await saveProgress(stats, lastProcessedHex);
    
    // Save summary
    const stopReason = shouldStop ? 'time limit reached' : 'range completed';
    await saveSummary(stats, lastProcessedHex, stopReason);
    
    console.log(`\n✨ Scan finished!`);
    console.log(`📁 Results saved to: ${OUTPUT_DIR}`);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
