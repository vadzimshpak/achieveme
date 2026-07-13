export const DEFAULT_AVATAR = "/default-avatar.svg";
export const DEFAULT_BANNER = "/default-banner.svg";
export const DEFAULT_SPHERE_ICON = "/default-sphere-icon.svg";
export const DEFAULT_ACHIEVEMENT_ICON = "/default-achievement-icon.svg";

export function userAvatarSrc(userId: string) {
  return `/api/images/user/${userId}/avatar`;
}

export function bannerPresetSrc(presetId: string) {
  return `/api/images/banner-preset/${presetId}`;
}

export function sphereIconSrc(sphereId: string) {
  return `/api/images/sphere/${sphereId}`;
}

export function achievementIconSrc(achievementTemplateId: string) {
  return `/api/images/achievement-template/${achievementTemplateId}`;
}

export function defaultAchievementIconSrc() {
  return "/api/images/default/achievement-icon";
}

/** SVG, blob и API-иконки не проходят через оптимизатор Next.js Image */
export function achievementImageUnoptimized(src: string) {
  return (
    src.startsWith("blob:") ||
    src.endsWith(".svg") ||
    src.includes("/api/images/achievement-template/") ||
    src.includes("/api/images/default/achievement-icon")
  );
}
