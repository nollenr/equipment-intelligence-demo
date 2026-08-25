export const DEMO_ROLE_COOKIE = "nextera_demo_role";

export type DemoRole = "field-tech" | "fleet-engineer";

export function normalizeDemoRole(value: string | null | undefined): DemoRole {
  return value === "fleet-engineer" ? "fleet-engineer" : "field-tech";
}

export function personaForRole(role: DemoRole) {
  return role === "fleet-engineer"
    ? {
        detail: "Engineering-restricted access",
        initials: "FE",
        label: "Fleet engineer",
      }
    : {
        detail: "Site-scoped access",
        initials: "FT",
        label: "Field technician",
      };
}
