import Link from "next/link";
import { cookies } from "next/headers";
import type { ReactNode } from "react";

import { normalizeDemoRole, DEMO_ROLE_COOKIE } from "../src/persona";
import { PersonaSwitcher } from "./persona-switcher";

interface ProductShellProperties {
  activeSection: "fleet" | "investigations";
  children: ReactNode;
}

function FleetIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M4 5.5h6v5H4zM14 5.5h6v5h-6zM4 14h6v5H4zM14 14h6v5h-6z" />
    </svg>
  );
}

function PulseIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M3 12h4l2.1-5 4.2 10 2.1-5H21" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M5 4.5h9.5A2.5 2.5 0 0 1 17 7v12H7.5A2.5 2.5 0 0 1 5 16.5zM17 7h2v12h-2" />
    </svg>
  );
}

export async function ProductShell({ activeSection, children }: ProductShellProperties) {
  const cookieStore = await cookies();
  const role = normalizeDemoRole(cookieStore.get(DEMO_ROLE_COOKIE)?.value);
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="product-mark" href="/fleet" aria-label="Equipment Intelligence home">
          <span className="mark-glyph">
            <span />
            <span />
            <span />
          </span>
          <span>
            <strong>Equipment</strong>
            <small>Intelligence</small>
          </span>
        </Link>

        <nav className="primary-nav" aria-label="Primary navigation">
          <span className="nav-heading">Workspace</span>
          <Link className={activeSection === "fleet" ? "nav-item active" : "nav-item"} href="/fleet">
            <FleetIcon />
            Fleet overview
          </Link>
          <Link className={activeSection === "investigations" ? "nav-item active" : "nav-item"} href="/incidents">
            <PulseIcon />
            Investigations
          </Link>
          <span className="nav-item nav-item-muted">
            <BookIcon />
            Knowledge
            <small>Soon</small>
          </span>
        </nav>

        <div className="sidebar-status">
          <span className="connection-dot" />
          <span>
            <strong>System healthy</strong>
            <small>CockroachDB connected</small>
          </span>
        </div>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <div className="environment-pill">
            <span />
            Concept demo
          </div>
          <div className="topbar-context">
            <span className="synthetic-label">Synthetic operational data</span>
            <span className="topbar-divider" />
            <PersonaSwitcher role={role} />
          </div>
        </header>

        <main className="main-content">{children}</main>

        <footer className="demo-disclaimer">
          Facility names are based on public information. All assets, manufacturers, fault codes, measurements,
          documents, incidents, analyses, and recommendations shown are synthetic.
        </footer>
      </div>
    </div>
  );
}
