"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/Logo";


function useRelogio() {
  const [hora, setHora] = useState("");
  useEffect(() => {
    const fmt = () =>
      new Date().toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZoneName: "short",
      });
    setHora(fmt());
    const id = setInterval(() => setHora(fmt()), 1000);
    return () => clearInterval(id);
  }, []);
  return hora;
}


const NAV_ITEMS = [
  {
    href:  "/",
    label: "Mapa",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
        <line x1="9" y1="3" x2="9" y2="18"/>
        <line x1="15" y1="6" x2="15" y2="21"/>
      </svg>
    ),
  },
  {
    href:  "/cameras",
    label: "Câmeras",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M23 7l-7 5 7 5V7z"/>
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
      </svg>
    ),
  },
  {
    href:  "/focos",
    label: "Focos",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2C12 2 7 8 7 13a5 5 0 0 0 10 0c0-5-5-11-5-11z"/>
        <path d="M12 12c0 0-2 2.5-2 4a2 2 0 0 0 4 0c0-1.5-2-4-2-4z"/>
      </svg>
    ),
  },
  {
    href:  "/frota",
    label: "Frota",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
        <path d="M2 17l10 5 10-5"/>
        <path d="M2 12l10 5 10-5"/>
      </svg>
    ),
  },
] as const;

function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1">
      {NAV_ITEMS.map(({ href, label, icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            style={{
              display:        "flex",
              alignItems:     "center",
              gap:            6,
              padding:        "6px 12px",
              borderRadius:   8,
              fontSize:       13,
              fontWeight:     active ? 600 : 500,
              fontFamily:     "var(--font-display)",
              color:          active ? "#EF4444" : "var(--text-secondary)",
              background:     active ? "rgba(239,68,68,0.10)" : "transparent",
              border:         active ? "1px solid rgba(239,68,68,0.20)" : "1px solid transparent",
              textDecoration: "none",
              transition:     "all 0.15s ease",
              whiteSpace:     "nowrap",
            }}
            onMouseEnter={(e) => {
              if (!active) {
                (e.currentTarget as HTMLElement).style.color      = "var(--text-primary)";
                (e.currentTarget as HTMLElement).style.background = "var(--bg-elevated)";
              }
            }}
            onMouseLeave={(e) => {
              if (!active) {
                (e.currentTarget as HTMLElement).style.color      = "var(--text-secondary)";
                (e.currentTarget as HTMLElement).style.background = "transparent";
              }
            }}
          >
            <span style={{ opacity: active ? 1 : 0.7 }}>{icon}</span>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Evita hydration mismatch
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="w-9 h-9" />;

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Alternar tema"
      style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        border: "1px solid var(--border)",
        background: "var(--bg-elevated)",
        color: "var(--text-secondary)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition: "background 0.2s, color 0.2s",
        flexShrink: 0,
      }}
    >
      {isDark ? (
        /* Ícone sol */
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4"/>
          <line x1="12" y1="2"  x2="12" y2="4"/>
          <line x1="12" y1="20" x2="12" y2="22"/>
          <line x1="4.22" y1="4.22"  x2="5.64" y2="5.64"/>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
          <line x1="2"  y1="12" x2="4"  y2="12"/>
          <line x1="20" y1="12" x2="22" y2="12"/>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>
      ) : (
        /* Ícone lua */
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      )}
    </button>
  );
}

export default function Header() {
  const hora = useRelogio();

  return (
    <header
      style={{
        position:  "fixed",
        top:       20,
        left:      "50%",
        transform: "translateX(-50%)",
        width:     "calc(100% - 80px)",
        maxWidth:  1360,
        height:    72,
        zIndex:    50,
        display:        "flex",
        alignItems:     "center",
        padding:        "0 32px",
        background:     "var(--header-bg)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border:       "1px solid var(--border)",
        borderRadius: 20,
        boxShadow:    "0 8px 32px rgba(0,0,0,0.25)",
        transition:   "background 0.3s ease, box-shadow 0.3s ease",
      }}
    >
      {/* ── Logo ── */}
      <div className="shrink-0">
        <Logo />
      </div>

      {/* ── Navegação — centralizada ── */}
      <div className="flex-1 flex justify-center">
        <NavLinks />
      </div>

      {/* ── Direita — relógio + toggle ── */}
      <div className="flex items-center gap-4 shrink-0">
        <div className="text-right">
          <p
            className="text-sm font-semibold tabular-nums leading-none"
            style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
          >
            {hora}
          </p>
          <p className="text-xs leading-none mt-0.5" style={{ color: "var(--text-muted)" }}>
            {new Date().toLocaleDateString("pt-BR", {
              weekday: "short",
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>

        <ThemeToggle />
      </div>
    </header>
  );
}
