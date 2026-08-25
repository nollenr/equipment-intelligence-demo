"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { personaForRole, type DemoRole } from "../src/persona";

interface PersonaSwitcherProperties {
  role: DemoRole;
}

export function PersonaSwitcher({ role }: PersonaSwitcherProperties) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const persona = personaForRole(role);

  async function selectRole(nextRole: DemoRole) {
    if (nextRole === role) {
      setIsOpen(false);
      return;
    }
    setIsSaving(true);
    try {
      const response = await fetch("/api/persona", {
        body: JSON.stringify({ role: nextRole }),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Persona could not be changed.");
      }
      setIsOpen(false);
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="persona-switcher">
      <button
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className="persona-trigger"
        disabled={isSaving}
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <span className="persona-avatar">{persona.initials}</span>
        <span className="persona-copy">
          <strong>{persona.label}</strong>
          <small>{isSaving ? "Switching…" : "Change persona"}</small>
        </span>
        <span className="persona-chevron" aria-hidden="true">⌄</span>
      </button>
      {isOpen ? (
        <div className="persona-menu" role="menu">
          <span className="persona-menu-heading">Demo persona</span>
          {(["field-tech", "fleet-engineer"] as const).map((candidateRole) => {
            const candidate = personaForRole(candidateRole);
            const isSelected = candidateRole === role;
            return (
              <button
                className={isSelected ? "persona-menu-option selected" : "persona-menu-option"}
                disabled={isSaving}
                key={candidateRole}
                onClick={() => selectRole(candidateRole)}
                role="menuitemradio"
                aria-checked={isSelected}
                type="button"
              >
                <span>{candidate.initials}</span>
                <span>
                  <strong>{candidate.label}</strong>
                  <small>{candidate.detail}</small>
                </span>
                <i aria-hidden="true">{isSelected ? "✓" : ""}</i>
              </button>
            );
          })}
          <p>Persona changes apply across the entire demo.</p>
        </div>
      ) : null}
    </div>
  );
}
