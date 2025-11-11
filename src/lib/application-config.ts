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
  gemini_cli: {
    id: "gemini_cli",
    label: "Gemini CLI",
  },
  codex_cli: {
    id: "codex_cli",
    label: "Codex CLI",
  },
  cline: {
    id: "cline",
    label: "Cline",
  },
  kilo_code: {
    id: "kilo_code",
    label: "Kilo Code",
  },
  roo_code: {
    id: "roo_code",
    label: "Roo Code",
  },
  qwen_code: {
    id: "qwen_code",
    label: "Qwen Code",
  },
  copilot: {
    id: "copilot",
    label: "GitHub Copilot",
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
