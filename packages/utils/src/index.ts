export * from "./ocr";
export * from "./template-matcher";
export * from "./sync-queue";
export * from "./storage";
export * from "./secure-storage";
export * from "./offline-storage";

/**
 * Utility: cn() - Class Name merger for NativeWind (Tailwind for React Native)
 *
 * Phase 3 Addition:
 * Used by chat components and other screens to merge conditional class names.
 * Similar to clsx/classnames but optimized for React Native strings.
 *
 * Usage:
 *   className={cn(
 *     "text-base font-semibold",
 *     isActive && "text-ember",
 *     isDarkMode && "text-cream"
 *   )}
 *
 * Filters out falsy values (undefined, null, false) and joins with spaces.
 * Returns clean class string for NativeWind to process.
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Generate random ID for entities (CVs, messages, etc)
 * Used for optimistic UI updates before server response
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function retryAsync<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(delayMs * Math.pow(2, i)); // Exponential backoff
    }
  }
  throw new Error("Failed after retries");
}
