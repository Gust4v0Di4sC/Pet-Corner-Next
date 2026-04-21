export function sanitizeRedirectPath(nextPath: string | null | undefined, fallbackPath: string): string {
  if (!nextPath) {
    return fallbackPath;
  }

  if (!nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return fallbackPath;
  }

  return nextPath;
}
