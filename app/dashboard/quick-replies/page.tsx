import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect } from "next/navigation";
import { QuickRepliesStudio } from "@/components/quick-replies/QuickRepliesStudio";

export default async function QuickRepliesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  return <QuickRepliesStudio />;
}