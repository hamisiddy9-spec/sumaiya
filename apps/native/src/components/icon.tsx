import React from "react";
import * as Icons from "lucide-react-native";

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

// A few names the app uses that don't map 1:1 to a lucide PascalCase name.
const ALIASES: Record<string, keyof typeof Icons> = {
  "file-text": "FileText",
  settings: "Settings",
  "log-out": "LogOut",
  "chevron-right": "ChevronRight",
  "chevron-left": "ChevronLeft",
  "chevron-down": "ChevronDown",
  "arrow-left": "ArrowLeft",
  "arrow-right": "ArrowRight",
  "alert-circle": "AlertCircle",
  "alert-triangle": "AlertTriangle",
  "trash-2": "Trash2",
  "eye-off": "EyeOff",
  "check-circle": "CircleCheck",
  "help-circle": "CircleHelp",
  "external-link": "ExternalLink",
  "refresh-cw": "RefreshCw",
  "more-vertical": "EllipsisVertical",
  "more-horizontal": "Ellipsis",
  sparkles: "Sparkles",
  wand: "Wand2",
  briefcase: "Briefcase",
  mail: "Mail",
  x: "X",
  check: "Check",
};

/** "eye-off" -> "EyeOff", "home" -> "Home" */
function toPascal(name: string): string {
  return name
    .split(/[-_ ]/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join("");
}

export function Icon({ name, size = 24, color = "currentColor", strokeWidth = 2 }: IconProps) {
  const key = ALIASES[name] ?? (toPascal(name) as keyof typeof Icons);
  const Cmp = (Icons[key] ?? Icons.CircleHelp) as React.ComponentType<{
    size?: number;
    color?: string;
    strokeWidth?: number;
  }>;
  return <Cmp size={size} color={color} strokeWidth={strokeWidth} />;
}
