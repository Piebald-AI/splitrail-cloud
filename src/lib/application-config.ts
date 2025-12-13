import { type ApplicationType, Applications } from "@/types";

/**
 * Unified configuration for all supported applications.
 * This is the single source of truth for application metadata.
 */

export const APPLICATION_CONFIG: Record<
  ApplicationType,
  {
    id: ApplicationType;
    label: string;
  }
> = {
  claude_code: {
    id: "claude_code",
    label: "Claude Code",
  },
  codex_cli: {
    id: "codex_cli",
    label: "Codex CLI",
  },
  gemini_cli: {
    id: "gemini_cli",
    label: "Gemini CLI",
  },
  qwen_code: {
    id: "qwen_code",
    label: "Qwen Code",
  },
  cline: {
    id: "cline",
    label: "Cline",
  },
  roo_code: {
    id: "roo_code",
    label: "Roo Code",
  },
  kilo_code: {
    id: "kilo_code",
    label: "Kilo Code",
  },
  copilot: {
    id: "copilot",
    label: "Copilot",
  },
  open_code: {
    id: "open_code",
    label: "OpenCode",
  },
  pi_agent: {
    id: "pi_agent",
    label: "Pi Agent",
  },
  piebald: {
    id: "piebald",
    label: "Piebald",
  },
};

/**
 * Array of all applications in order.
 * Use this for iteration and default selections.
 * Derived from the Applications constant in @/types.
 */
export const ALL_APPLICATIONS: ApplicationType[] = [...Applications];

/**
 * Map of application IDs to display labels.
 * Use this for quick label lookups.
 */
export const APPLICATION_LABELS: Record<ApplicationType, string> =
  Object.fromEntries(
    Object.entries(APPLICATION_CONFIG).map(([id, config]) => [id, config.label])
  ) as Record<ApplicationType, string>;

/**
 * Array of application dropdown items for UI rendering.
 * Use this in dropdowns and selection components.
 */
export const APPLICATION_OPTIONS = Object.values(APPLICATION_CONFIG).map(
  (config) => ({
    value: config.id,
    label: config.label,
  })
);

/**
 * Get the display label for an application ID.
 */
export function getApplicationLabel(appId: ApplicationType): string {
  return APPLICATION_CONFIG[appId]?.label ?? appId;
}

/**
 * Get the application code (ID) from a display name.
 * Returns null if no matching application is found.
 */
export function getApplicationCode(
  displayName: string
): ApplicationType | null {
  const entry = Object.entries(APPLICATION_LABELS).find(
    ([, name]) => name === displayName
  );
  return entry ? (entry[0] as ApplicationType) : null;
}
