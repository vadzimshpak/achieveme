import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getProfileByNickname } from "@/lib/profile";
import { getFriendRelationStatus, getFriendsList } from "@/lib/friendship";
import { canCommentOnProfile, canViewProfile } from "@/lib/privacy";
import { getHCaptchaSiteKey } from "@/lib/hcaptcha";
import { ProfilePage } from "@/components/profile/ProfilePage";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ nickname: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { nickname } = await params;
  return {
    title: `${nickname} — AchieveMe`,
  };
}

export default async function ProfileRoute({ params }: PageProps) {
  const { nickname } = await params;
  const session = await auth();
  const profile = await getProfileByNickname(nickname);

  if (!profile) {
    notFound();
  }

  const isOwner = session?.user?.id === profile.user.id;
  const viewerUserId = session?.user?.id;

  const [canViewFullProfile, canComment, friendStatus, friends] = await Promise.all([
    canViewProfile(profile.user.id, viewerUserId),
    canCommentOnProfile(profile.user.id, viewerUserId),
    viewerUserId
      ? getFriendRelationStatus(viewerUserId, profile.user.id)
      : Promise.resolve("none" as const),
    isOwner && viewerUserId ? getFriendsList(viewerUserId) : Promise.resolve([]),
  ]);

  const hcaptchaSiteKey = getHCaptchaSiteKey();

  return (
    <ProfilePage
      profile={profile}
      isOwner={isOwner}
      currentUserId={viewerUserId}
      isLoggedIn={!!session?.user}
      canViewFullProfile={canViewFullProfile}
      friendStatus={friendStatus}
      friends={friends}
      canComment={canComment}
      hcaptchaSiteKey={hcaptchaSiteKey}
    />
  );
}
