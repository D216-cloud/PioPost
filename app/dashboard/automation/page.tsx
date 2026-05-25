import { AutomationDashboard } from "@/components/automation/AutomationDashboard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Automation | PinPost",
  description: "Automate your Instagram DMs and engagement workflows.",
};

export default function AutomationPage() {
  return <AutomationDashboard />;
}
