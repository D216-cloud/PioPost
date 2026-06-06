import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect } from "next/navigation";
import { WelcomeFlowStudio } from "@/components/welcome-flow/WelcomeFlowStudio";

export default async function WelcomeFlowPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  return <WelcomeFlowStudio />;
}
