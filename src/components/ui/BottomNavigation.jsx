// src/components/ui/BottomNavigation.jsx
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Icon from "../AppIcon";

export default function BottomNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname || "";

  // Sama seperti Desktop: mapping aktif berdasarkan pathname
  const activeId = (() => {
    if (pathname === "/" || pathname.startsWith("/home-dashboard")) return "home";
    if (pathname.startsWith("/photo-diagnosis") || pathname.startsWith("/diagnosis-results")) return "diagnosis";
    if (pathname.startsWith("/farming-calendar")) return "calendar";
    if (pathname.startsWith("/community-alerts")) return "community";
    return "";
  })();

  const items = [
    { id: "home",      label: "Beranda",   path: "/home-dashboard",   icon: "Home" },
    { id: "diagnosis", label: "Diagnosis", path: "/photo-diagnosis",  icon: "Camera" },
    { id: "calendar",  label: "Kalender",  path: "/farming-calendar", icon: "Calendar" },
    { id: "community", label: "Komunitas", path: "/community-alerts", icon: "AlertTriangle" },
  ];

  const isActive = (id) => id === activeId;

  return (
    // hanya mobile
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-border bg-card/90 backdrop-blur supports-[backdrop-filter]:bg-card/70">
      <div className="mx-auto max-w-[420px] px-3">
        <ul className="grid grid-cols-4 gap-1 py-2 text-xs">
          {items.map((it) => {
            const active = isActive(it.id);
            return (
              <li key={it.id}>
                <button
                  onClick={() => navigate(it.path)}
                  className={`w-full flex flex-col items-center justify-center rounded-lg px-2 py-1 transition-smooth ${
                    active
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  }`}
                  aria-label={it.label}
                  title={it.label}
                >
                  <Icon name={it.icon} size={22} strokeWidth={active ? 2.4 : 2} className="mb-0.5" />
                  <span className={`font-medium ${active ? "font-semibold" : ""}`}>{it.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
