const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'app', 'api', 'webhooks', 'instagram', 'route.ts');
const content = fs.readFileSync(filePath, 'utf-8');
const lines = content.split('\n');

console.log(`Original file: ${lines.length} lines`);

// Keep lines 1-367 (getInstagramUserProfile end) 
// Skip lines 368-826 (welcome opener/flow functions + interfaces)
// Keep lines 827-end (POST handler + comment handler)
const keepBefore = lines.slice(0, 367); // lines 1-367 (0-indexed: 0-366)
const keepAfter = lines.slice(826);     // lines 827+ (0-indexed: 826+)

// In keepAfter, fix the POST handler DM routing section
// We need to:
// 1. Remove welcome_opener_click and welcome_flow_click postback handlers
// 2. Remove the entire welcome opener/flow routing in the text message handler
// 3. Replace fallback with simple ignore

let afterContent = keepAfter.join('\n');

// Fix 1: Remove welcome opener and flow postback handling, keep only check_follow
afterContent = afterContent.replace(
  /          if \(payload\.startsWith\("welcome_opener_click:"\)\) \{\n            const label = payload\.replace\("welcome_opener_click:", ""\);\n            await handleWelcomeOpenerButtonClick\(senderId, label, igBusinessId\);\n          \} else if \(payload\.startsWith\("welcome_flow_click:"\)\) \{\n            await handleWelcomeFlowButtonClick\(senderId, payload, igBusinessId\);\n          \} else if \(payload\.startsWith\("check_follow:"\)\)/,
  '          if (payload.startsWith("check_follow:"))'
);

// Fix 2: Replace the entire else block for DM routing (welcome opener/flow) with a simple log
// Find the big else block that starts with "            const { data: igAccount } = await supabaseAdmin"
// and ends with the fallback to handleWelcomeOpenerMessage
afterContent = afterContent.replace(
  /          \} else \{\n            const \{ data: igAccount \} = await supabaseAdmin[\s\S]*?if \(!routed\) \{\n              \/\/ Fallback\n              await handleWelcomeOpenerMessage\(senderId, rawMessageText, igBusinessId\);\n            \}\n          \}/,
  `          } else {\n            console.log(\`[Webhook] ℹ️ DM from user \${senderId} does not match any handler. Ignoring.\`);\n          }`
);

const result = keepBefore.join('\n') + '\n' + afterContent;
const resultLines = result.split('\n');
console.log(`New file: ${resultLines.length} lines`);

fs.writeFileSync(filePath, result, 'utf-8');
console.log('Done!');
