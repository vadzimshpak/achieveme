import { ProfileHeader } from "./ProfileHeader";
import { ProfileSummary } from "./ProfileSummary";
import { ProfileCurrentGoal } from "./ProfileCurrentGoal";
import { ProfileActivity } from "./ProfileActivity";
import { ProfileSidebar } from "./ProfileSidebar";
import { ProfileComments } from "./ProfileComments";
import { ProfileRestricted } from "./ProfileRestricted";
import { bannerPresetSrc } from "@/lib/image-urls";
import type { FriendListItem, FriendRelationStatus } from "@/lib/friendship";
import styles from "./profile-page.module.css";

type ProfilePageProps = {
  profile: NonNullable<Awaited<ReturnType<typeof import("@/lib/profile").getProfileByNickname>>>;
  isOwner: boolean;
  currentUserId?: string;
  isLoggedIn: boolean;
  canViewFullProfile: boolean;
  friendStatus: FriendRelationStatus;
  friends: FriendListItem[];
  canComment: boolean;
  hcaptchaSiteKey: string;
};

export function ProfilePage({
  profile,
  isOwner,
  currentUserId,
  isLoggedIn,
  canViewFullProfile,
  friendStatus,
  friends,
  canComment,
  hcaptchaSiteKey,
}: ProfilePageProps) {
  const { user, levelProgress, recentAchievementsCount, recentActivity, currentGoals, stats } =
    profile;
  const lastActivity = user.userAchievements[0]?.unlockedAt ?? null;
  const topAchievements = user.userAchievements.slice(0, 4).map((a) => ({
    id: a.achievementTemplate.id,
    title: a.achievementTemplate.title,
    description: a.achievementTemplate.description,
  }));

  const bannerPresetId = user.bannerPresetId ?? "classic";

  if (!canViewFullProfile && !isOwner) {
    return (
      <ProfileRestricted
        userId={user.id}
        nickname={user.nickname}
        isLoggedIn={isLoggedIn}
        friendStatus={friendStatus}
      />
    );
  }

  return (
    <div className={styles["profile-page"]}>
      <div
        key={bannerPresetId}
        className={styles["profile-page__bg"]}
        style={{ backgroundImage: `url(${bannerPresetSrc(bannerPresetId)})` }}
      />
      <div className={styles["profile-page__overlay"]} />

      <div className={styles["profile-page__content"]}>
        <div className={styles["profile-container"]}>
          <ProfileHeader
            userId={user.id}
            nickname={user.nickname}
            level={user.level}
            levelProgress={levelProgress}
            createdAt={user.createdAt}
            isOwner={isOwner}
            isLoggedIn={isLoggedIn}
            friendStatus={friendStatus}
          />

          <div className={styles["profile-grid"]}>
            <main className={styles["profile-grid__main"]}>
              <ProfileSummary bio={user.bio} />
              <div id="spheres">
                <ProfileCurrentGoal goals={currentGoals} />
                <ProfileActivity
                  recentActivity={recentActivity}
                  recentAchievementsCount={recentAchievementsCount}
                />
              </div>
              <ProfileComments
                profileUserId={user.id}
                comments={user.commentsOnProfile}
                currentUserId={currentUserId}
                profileOwnerId={user.id}
                isLoggedIn={isLoggedIn && canComment}
                canComment={canComment}
                hcaptchaSiteKey={hcaptchaSiteKey}
              />
            </main>

            <div className={styles["profile-grid__sidebar"]}>
              <ProfileSidebar
                stats={stats}
                lastActivity={lastActivity}
                topAchievements={topAchievements}
                friends={friends}
                isOwner={isOwner}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
