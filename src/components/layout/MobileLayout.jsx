// src/components/layout/MobileLayout.jsx
import React from "react";
import { Outlet, NavLink } from "react-router-dom";
import BottomNavigation from "../ui/BottomNavigation";
import Icon from "../AppIcon";
import ErrorBoundary from "../ErrorBoundary";

const linkBase =
  "inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-smooth";
const linkIdle =
  "text-muted-foreground hover:text-foreground hover:bg-muted/60";
const linkActive =
  "text-foreground bg-muted";

export default function MobileLayout() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      {/* Top navigation: hanya desktop/tablet */}
      <header className="hidden md:block sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="mx-auto w-full max-w-screen-xl px-6">
          <div className="h-14 flex items-center justify-between">
            <div className="flex items-center gap-2 px-2 py-1 rounded-lg">
              <span className="text-base font-semibold">AI Tani Kupang</span>
              <span className="text-xs text-muted-foreground">Web</span>
            </div>
            <nav className="flex items-center gap-1">
              {[
                { to: "/home-dashboard", label: "Beranda",    icon: "Home" },
                { to: "/photo-diagnosis", label: "Diagnosis",  icon: "Camera" },
                { to: "/farming-calendar",label: "Kalender",   icon: "Calendar" },
                { to: "/community-alerts",label: "Komunitas",  icon: "Users" },
                { to: "/diagnosis-history",label: "Riwayat",   icon: "History" },
              ].map((it) => (
                <NavLink
                  key={it.to}
                  to={it.to}
                  className={({ isActive }) =>
                    `${linkBase} ${isActive ? linkActive : linkIdle}`
                  }
                >
                  <Icon name={it.icon} size={18} />
                  {it.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Konten */}
      <main className="mx-auto w-full px-4 md:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-screen-sm md:max-w-3xl lg:max-w-6xl py-4 md:py-8">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </div>
      </main>

      {/* Bottom nav: hanya mobile */}
      <div className="md:hidden">
        <BottomNavigation />
      </div>
    </div>
  );
}
