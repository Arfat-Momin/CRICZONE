import Link from "next/link";
import { LoginForm } from "@/components/admin/LoginForm";

export const metadata = {
  title: "Admin Login · CRICZONE",
};

type SearchParams = Promise<{ next?: string; error?: string }>;

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-[#FDFCF0] p-6">
      <div className="w-full max-w-md rounded-2xl border border-[#1B4332]/10 bg-white p-8 shadow-xl">
        <div className="mb-6 text-center">
          <Link href="/" className="text-sm font-semibold text-[#2D6A4F] hover:underline">
            &larr; Back to CRICZONE
          </Link>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-[#1B4332]">
            Admin Panel
          </h1>
          <p className="mt-1 text-sm text-[#2D6A4F]/70">
            Sign in with your CRICZONE admin credentials.
          </p>
        </div>

        {params.error === "forbidden" && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-[#C1121F]/30 bg-[#C1121F]/10 px-4 py-2 text-sm font-medium text-[#C1121F]"
          >
            This account is not authorized for admin access.
          </div>
        )}
        {params.error === "auth_callback_error" && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-[#C1121F]/30 bg-[#C1121F]/10 px-4 py-2 text-sm font-medium text-[#C1121F]"
          >
            Sign-in link expired or invalid. Try again.
          </div>
        )}

        <LoginForm nextPath={params.next ?? "/admin/dashboard"} />
      </div>
    </main>
  );
}