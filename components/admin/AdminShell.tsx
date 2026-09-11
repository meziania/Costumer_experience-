"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const item = (href: string, label: string) => (
    <Link href={href} className={path === href ? "is-active" : ""}>
      {label}
    </Link>
  );

  return (
    <div className="admin-root">
      <div className="admin-layout">
        <aside className="admin-side">
          <div className="admin-brand">
            <img src="/assets/logo-mark.svg" alt="" width={32} height={32} />
            <div>
              <strong>CX Admin</strong>
              <span>atelier</span>
            </div>
          </div>
          <nav className="admin-nav">
            {item("/admin", "Projets")}
            {item("/admin/clients", "Clients")}
            {item("/admin/leads", "Leads")}
          </nav>
          <button type="button" className="admin-logout" onClick={() => signOut({ callbackUrl: "/admin/login" })}>
            Déconnexion
          </button>
        </aside>
        <div className="admin-main">{children}</div>
      </div>
    </div>
  );
}
