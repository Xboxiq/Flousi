"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogoMark } from "@/presentation/components/layout/logo";

/**
 * Client-side redirect to the dashboard. (Static export cannot perform a
 * server redirect, so we route on the client and show a brief splash.)
 */
export default function Home() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-bg">
      <div className="flex items-center gap-3 opacity-80">
        <LogoMark />
        <span className="text-lg font-semibold tracking-tight text-fg">Flousi</span>
      </div>
    </div>
  );
}
