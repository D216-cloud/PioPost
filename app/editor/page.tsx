import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { DashboardClient } from "@/components/DashboardClient";

export default async function EditorPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <DashboardClient userName={session.user.name ?? "Creator"} />
    </div>
  );
}
