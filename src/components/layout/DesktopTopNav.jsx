// src/components/layout/DesktopTopNav.jsx
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Icon from "../AppIcon";

export default function DesktopTopNav({ showBack = false, title, subtitle }) {
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname || "";

  // Tentukan id tab yang aktif berdasarkan pathname
  const activeId = (() => {
    if (pathname === "/" || pathname.startsWith("/home-dashboard")) return "home";
    if (pathname.startsWith("/photo-diagnosis") || pathname.startsWith("/diagnosis-results")) return "diagnosis";
    if (pathname.startsWith("/farming-calendar")) return "calendar";
    if (pathname.startsWith("/community-alerts")) return "community";
    if (pathname.startsWith("/diagnosis-history")) return "history";
    return "";
  })();

  const items = [
    { id: "home",      label: "Beranda",   path: "/home-dashboard",   icon: "Home" },
    { id: "diagnosis", label: "Diagnosis", path: "/photo-diagnosis",  icon: "Camera" },
    { id: "calendar",  label: "Kalender",  path: "/farming-calendar", icon: "Calendar" },
    { id: "community", label: "Komunitas", path: "/community-alerts", icon: "AlertTriangle" },
    { id: "history",   label: "Riwayat",   path: "/diagnosis-history",icon: "History" },
  ];

  const isActive = (id) => id === activeId;

  return (
    <header className="hidden md:block sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur">
      <div className="mx-auto max-w-screen-xl px-4 md:px-6 lg:px-8">
        <div className="flex h-14 items-center gap-3">
          {showBack && (
            <button
              onClick={() => navigate(-1)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted"
              aria-label="Kembali"
              title="Kembali"
            >
              <Icon name="ArrowLeft" size={20} />
            </button>
          )}

          <div className="flex items-center gap-2 pr-4 border-r border-border">
            <span className="text-sm font-semibold">AI Tani Kupang</span>
            <span className="hidden lg:inline text-xs text-muted-foreground">Web</span>
          </div>

          <nav className="flex-1">
            <ul className="flex items-center gap-2">
              {items.map((it) => (
                <li key={it.id}>
                  <button
                    onClick={() => navigate(it.path)}
                    className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted ${
                      isActive(it.id)
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-muted-foreground"
                    }`}
                    aria-current={isActive(it.id) ? "page" : undefined}
                    title={it.label}
                  >
                    <Icon name={it.icon} size={16} />
                    <span className="hidden sm:inline">{it.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {(title || subtitle) && (
            <div className="ml-auto hidden lg:block text-right">
              {title && <div className="text-sm font-semibold text-foreground">{title}</div>}
              {subtitle && <div className="text-xs text-muted-foreground">{subtitle}</div>}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
