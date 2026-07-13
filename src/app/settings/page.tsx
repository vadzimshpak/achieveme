import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensurePrivacySettings } from "@/lib/privacy";
import { SettingsForm } from "./SettingsForm";
import { PrivacySettings } from "./PrivacySettings";
import styles from "./settings.module.css";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [user, bannerPresets, privacy] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
    }),
    prisma.bannerPreset.findMany({
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true },
    }),
    ensurePrivacySettings(session.user.id),
  ]);

  if (!user) redirect("/login");

  const selectedBannerPresetId =
    user.bannerPresetId ?? bannerPresets[0]?.id ?? "classic";

  return (
    <main className={styles["page"]}>
      <h1 className={styles["page__title"]}>Настройки</h1>
      <SettingsForm
        userId={user.id}
        nickname={user.nickname}
        bio={user.bio}
        bannerPresets={bannerPresets}
        selectedBannerPresetId={selectedBannerPresetId}
      />
      <PrivacySettings
        whoCanMessage={privacy.whoCanMessage}
        whoCanComment={privacy.whoCanComment}
        whoCanViewProfile={privacy.whoCanViewProfile}
      />
    </main>
  );
}
