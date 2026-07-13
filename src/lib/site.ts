export function getSiteName(): string {
  return process.env.SITE_NAME?.trim() || "AchieveMe";
}
