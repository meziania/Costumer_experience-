"use client";

import { SessionProvider } from "next-auth/react";
import { usePathname } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import "../admin.css";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return (
    <SessionProvider>
      {path === "/admin/login" ? children : <AdminShell>{children}</AdminShell>}
    </SessionProvider>
  );
}
