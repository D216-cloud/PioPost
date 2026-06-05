import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect } from "next/navigation";
import { WelcomeOpenerStudio } from "@/components/welcome-opener/WelcomeOpenerStudio";

export default async function WelcomeOpenerPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  return <WelcomeOpenerStudio />;
}
