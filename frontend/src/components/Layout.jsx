import React from "react";
import { NavLink, Outlet } from "react-router-dom";

const navItems = [
  { to: "/", label: "Dashboard", code: "00" },
  { to: "/products", label: "Products", code: "01" },
  { to: "/customers", label: "Customers", code: "02" },
  { to: "/orders", label: "Orders", code: "03" },
];

export default function Layout() {
  return (
    <div className="min-h-screen bg-base text-ink">
      <div className="mx-auto flex min-h-screen max-w-7xl">
        <aside className="hidden w-60 shrink-0 border-r border-border bg-surface md:block">
          <div className="border-b border-border px-5 py-5">
            <p className="font-mono text-[11px] uppercase tracking-widest2 text-muted">Warehouse Ops</p>
            <h1 className="font-display text-3xl font-semibold leading-none text-ink">Manifest</h1>
          </div>
          <nav className="px-3 py-4">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `mb-1 flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary-light text-primary-dark"
                      : "text-muted hover:bg-base hover:text-ink"
                  }`
                }
              >
                <span className="font-mono text-[11px] text-muted">{item.code}</span>
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-auto px-5 py-4 text-xs text-muted">
            <p className="font-mono">v1.0.0</p>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 md:hidden">
            <h1 className="font-display text-2xl font-semibold">Manifest</h1>
          </header>
          <nav className="flex gap-1 overflow-x-auto border-b border-border bg-surface px-3 py-2 md:hidden">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ${
                    isActive ? "bg-primary-light text-primary-dark" : "text-muted"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
