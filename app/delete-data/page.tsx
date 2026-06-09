import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Trash2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Delete My Data | StartProfile",
  description: "Request deletion of your account data and connected platform information.",
};

export default function DeleteDataPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-8 py-24 space-y-16 animate-in fade-in duration-700">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[13px] font-black uppercase tracking-widest text-slate-300 transition-colors hover:text-slate-900"
        >
          <ArrowLeft size={16} />
          Back Home
        </Link>

        <div className="space-y-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <Trash2 size={32} />
          </div>
          <h1 className="text-[48px] font-bold leading-tight tracking-tight text-slate-900">Delete My Data</h1>
          <p className="text-[18px] font-medium text-slate-400">
            Use this page to request removal of your account data and any connected platform information we store.
          </p>
        </div>

        <div className="space-y-8 text-[16px] leading-relaxed text-slate-600">
          <section className="space-y-4">
            <h2 className="text-[22px] font-bold text-slate-900">What will be deleted</h2>
            <p>
              We will delete your profile details, saved settings, connected social account references, and other
              data tied to your StartProfile account where deletion is technically possible.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-[22px] font-bold text-slate-900">How to request deletion</h2>
            <p>
              Send an email to support@startprofile.com with the subject line "Delete my data" and include the email
              address associated with your account. We will review and process your request as quickly as possible.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-[22px] font-bold text-slate-900">What happens next</h2>
            <p>
              Once the request is verified, we will remove the requested data and confirm completion by email. Some
              records may be retained when required for legal, security, or billing purposes.
            </p>
          </section>
        </div>

        <div className="rounded-3xl border border-slate-100 bg-slate-50 p-8">
          <p className="text-[14px] font-medium leading-relaxed text-slate-500">
            If you need help with a deletion request, contact support@startprofile.com.
          </p>
        </div>
      </div>
    </div>
  );
}