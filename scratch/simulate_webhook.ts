import fs from "fs";
import path from "path";

// Load env variables first BEFORE any other imports to initialize supabaseAdmin correctly
const envPath = path.resolve(__dirname, "../.env");
console.log("Loading env from:", envPath);
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf8");
  content.split(/\r?\n/).forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let value = match[2] || '';
      value = value.trim();
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      else if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      
      console.log(`Setting Env: ${match[1]} = ${value.substring(0, 10)}...`);
      process.env[match[1]] = value;
    }
  });
} else {
  console.error("Env file not found!");
}

console.log("process.env.SUPABASE_URL =", process.env.SUPABASE_URL);
console.log("process.env.SUPABASE_SERVICE_ROLE_KEY =", process.env.SUPABASE_SERVICE_ROLE_KEY ? "EXISTS" : "MISSING");

// Mock global fetch to intercept requests sent to Instagram Graph API
const originalFetch = global.fetch;
let mockFollowStatus = false;
let interceptLogs: string[] = [];

global.fetch = async (url: any, options: any) => {
  const urlStr = typeof url === "string" ? url : url.toString();
  interceptLogs.push(`[HTTP FETCH] ${options?.method || "GET"} ${urlStr}`);
  
  if (options?.body) {
    interceptLogs.push(`  Payload: ${options.body}`);
  }

  // 1. Mock Instagram DM send endpoint
  if (urlStr.includes("graph.instagram.com/v21.0/me/messages")) {
    return new Response(JSON.stringify({ message_id: "mock_msg_" + Math.random().toString(36).substr(2, 9) }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }

  // 2. Mock Instagram Follow check endpoint
  if (urlStr.includes("fields=is_user_follow_business")) {
    return new Response(
      JSON.stringify({
        is_user_follow_business: mockFollowStatus,
        id: "mock_user_id"
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  // 3. Mock Comment Reply endpoint
  if (urlStr.includes("/replies")) {
    return new Response(JSON.stringify({ id: "mock_reply_id" }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }

  // Fallback to original fetch for other endpoints
  return originalFetch(url, options);
};

// Helper to create mock NextJS requests
function createMockRequest(payload: any) {
  return new Request("http://localhost:3000/api/webhooks/instagram", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
}

const AUTOMATION_ID = "7143c317-44f2-499a-844a-f1586c017a34";
const POST_ID = "17901457140030211";
const IG_BUSINESS_ID = "17841448454313989";
const SENDER_ID = "999888777666"; // Simulated user ID

async function runTests() {
  // Dynamically import POST so that process.env is populated when Route module loads
  console.log("Dynamically importing POST handler...");
  const { POST } = await import("../app/api/webhooks/instagram/route");

  console.log("=========================================");
  console.log("STARTING WEBHOOK SIMULATION TEST");
  console.log("=========================================\n");

  // ----------------------------------------------------
  // SCENARIO 1: User comments on a post.
  // Expectation: Sends Initial DM with "Send Access" button (payload: send_access).
  // ----------------------------------------------------
  console.log("--- SCENARIO 1: User comments on post (Regardless of follow status) ---");
  interceptLogs = [];
  
  const commentPayload = {
    object: "instagram",
    entry: [
      {
        id: IG_BUSINESS_ID,
        time: 1781625002,
        changes: [
          {
            field: "comments",
            value: {
              id: "111222333444",
              from: {
                id: SENDER_ID,
                username: "tester_user"
              },
              text: "hello this is my comment",
              media: {
                id: POST_ID,
                media_product_type: "REELS"
              }
            }
          }
        ]
      }
    ]
  };

  let res = await POST(createMockRequest(commentPayload));
  console.log(`Response Status: ${res.status}`);
  console.log("Intercepted Calls:");
  interceptLogs.forEach(log => console.log(log));
  console.log("\n");

  // ----------------------------------------------------
  // SCENARIO 2: User clicks "Send Access" in DM, but they do NOT follow yet.
  // Expectation: Webhook runs follow check (sees false), and sends the follow-gate message
  // with "Visit Profile" and "I'm following ✅" (verify_follow_initial payload).
  // ----------------------------------------------------
  console.log("--- SCENARIO 2: User clicks 'Send Access' button but does NOT follow yet ---");
  interceptLogs = [];
  mockFollowStatus = false; // User does not follow yet

  const sendAccessPayload = {
    object: "instagram",
    entry: [
      {
        id: IG_BUSINESS_ID,
        messaging: [
          {
            sender: { id: SENDER_ID },
            recipient: { id: IG_BUSINESS_ID },
            postback: {
              payload: `send_access:${AUTOMATION_ID}:111222333444`
            }
          }
        ]
      }
    ]
  };

  res = await POST(createMockRequest(sendAccessPayload));
  console.log(`Response Status: ${res.status}`);
  console.log("Intercepted Calls:");
  interceptLogs.forEach(log => console.log(log));
  console.log("\n");

  // ----------------------------------------------------
  // SCENARIO 3: User follows the page and clicks "I'm following ✅".
  // Expectation: Webhook runs follow check (sees true), and delivers the Main DM directly.
  // ----------------------------------------------------
  console.log("--- SCENARIO 3: User follows page and clicks 'I'm following ✅' ---");
  interceptLogs = [];
  mockFollowStatus = true; // User followed!

  const followCheckPayload = {
    object: "instagram",
    entry: [
      {
        id: IG_BUSINESS_ID,
        messaging: [
          {
            sender: { id: SENDER_ID },
            recipient: { id: IG_BUSINESS_ID },
            postback: {
              payload: `verify_follow_initial:${AUTOMATION_ID}:111222333444`
            }
          }
        ]
      }
    ]
  };

  res = await POST(createMockRequest(followCheckPayload));
  console.log(`Response Status: ${res.status}`);
  console.log("Intercepted Calls:");
  interceptLogs.forEach(log => console.log(log));
  console.log("\n");

  // ----------------------------------------------------
  // SCENARIO 4: User is already a follower when they comment, then click "Send Access".
  // Expectation: Webhook runs follow check (sees true), and delivers the Main DM directly.
  // ----------------------------------------------------
  console.log("--- SCENARIO 4: User follows page already, clicks 'Send Access' directly ---");
  interceptLogs = [];
  mockFollowStatus = true; // User already followed

  res = await POST(createMockRequest(sendAccessPayload));
  console.log(`Response Status: ${res.status}`);
  console.log("Intercepted Calls:");
  interceptLogs.forEach(log => console.log(log));
  console.log("\n");
  
  console.log("=========================================");
  console.log("SIMULATION TEST COMPLETE");
  console.log("=========================================");
}

runTests().catch(console.error);
