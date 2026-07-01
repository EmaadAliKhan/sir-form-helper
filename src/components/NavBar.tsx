"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";

const baseLinks = [
  { href: "/", label: "Select Voter" },
  { href: "/forms", label: "Drafts" },
  { href: "/settings", label: "Settings" },
] as const;

export function NavBar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const { session, isAdminUser, logout } = useAuth();

  const navLinks = [
    ...baseLinks,
    ...(isAdminUser
      ? [
          { href: "/admin/users", label: "Users" },
          { href: "/admin/calibrate", label: "Calibrate PDF" },
        ]
      : []),
  ];

  if (!session) return null;

  function isActive(href: string): boolean {
    const path = pathname.replace(/\/$/, "") || "/";
    const target = href.replace(/\/$/, "") || "/";
    if (target === "/") return path === "/";
    return path === target || path.startsWith(`${target}/`);
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="min-w-0 shrink">
            <span className="block text-base font-semibold text-slate-900 sm:text-lg">
              SIR Enumeration
            </span>
            <span className="block truncate text-xs text-slate-500 sm:text-sm">
              Sanathnagar Self-Enumeration Assistant
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive(link.href)
                    ? "bg-slate-100 text-blue-700"
                    : "text-slate-700 hover:bg-slate-50 hover:text-blue-600"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <span className="hidden max-w-[8rem] truncate text-sm text-slate-600 sm:inline">
              {session.username}
            </span>
            <button
              type="button"
              onClick={logout}
              className="hidden min-h-9 items-center rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 sm:inline-flex"
            >
              Sign out
            </button>

            <button
              type="button"
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 md:hidden"
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav
            id="mobile-nav"
            className="mt-3 flex flex-col gap-1 border-t border-slate-100 pt-3 md:hidden"
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`min-h-11 rounded-lg px-3 py-2.5 text-sm font-medium ${
                  isActive(link.href)
                    ? "bg-slate-100 text-blue-700"
                    : "text-slate-700 hover:bg-slate-50 hover:text-blue-600"
                }`}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                logout();
              }}
              className="min-h-11 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50"
            >
              Sign out ({session.username})
            </button>
          </nav>
        )}
      </div>
    </header>
  );
}
