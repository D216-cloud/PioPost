import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { ScheduleEditor } from "@/components/schedule/ScheduleEditor";

export default async function SchedulePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  return <ScheduleEditor />;
}
