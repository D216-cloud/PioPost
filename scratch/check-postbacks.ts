import { supabaseAdmin } from "../lib/supabase-admin";

async function main() {
  console.log("Searching for postback verification logs...");
  const { data, error } = await supabaseAdmin
    .from("automation_logs")
    .select("*")
    .ilike("comment_text", "%Postback%")
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error("Error fetching postback logs:", error);
    return;
  }

  console.log("Postback logs:", JSON.stringify(data, null, 2));
}

main().catch(console.error);
