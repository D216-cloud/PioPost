"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PostEditor } from "@/components/editor/PostEditor";

export default function EditorPage() {
  const { data: session, status } = useSession();
  const loading = status === "loading";
  const user = session?.user;
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!loading && !user && !redirecting) {
      setRedirecting(true);
      router.push("/login");
    }
  }, [user, loading, router, redirecting]);

  if (loading || redirecting || (!loading && !user)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fafc]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#0096d6] border-t-transparent" />
      </div>
    );
  }

  return <PostEditor />;
}
