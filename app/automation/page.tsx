import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { AutomationDashboard } from "@/components/automation/AutomationDashboard";

export default async function AutomationPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  return <AutomationDashboard />;
}
