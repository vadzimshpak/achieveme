import Link from "next/link";
import Image from "next/image";
import { LevelBadge } from "./LevelBadge";
import { XpProgressBar } from "./XpProgressBar";
import { ProfileFriendButton } from "./ProfileFriendButton";
import { ProfileMessageButton } from "./ProfileMessageButton";
import type { FriendRelationStatus } from "@/lib/friendship";
import { userAvatarSrc } from "@/lib/image-urls";
import { formatDate } from "@/lib/utils";
import styles from "./profile-header.module.css";

type ProfileHeaderProps = {
  userId: string;
  nickname: string;
  level: number;
  levelProgress: {
    current: number;
    needed: number;
    total: number;
    percent: number;
  };
  createdAt: Date;
  isOwner: boolean;
  isLoggedIn: boolean;
  friendStatus: FriendRelationStatus;
};

export function ProfileHeader({
  userId,
  nickname,
  level,
  levelProgress,
  createdAt,
  isOwner,
  isLoggedIn,
  friendStatus,
}: ProfileHeaderProps) {
  return (
    <header className={styles["profile-header"]}>
      <div className={styles["profile-header__avatar"]}>
        <Image
          src={userAvatarSrc(userId)}
          alt={nickname}
          width={184}
          height={184}
          className={styles["profile-header__avatar-img"]}
        />
      </div>

      <div className={styles["profile-header__info"]}>
        <h1 className={styles["profile-header__nickname"]}>{nickname}</h1>
        <p className={styles["profile-header__meta"]}>
          Участник с {formatDate(createdAt)}
        </p>
      </div>

      <div className={styles["profile-header__stats"]}>
        <LevelBadge level={level} />
        <XpProgressBar {...levelProgress} />
        <div className={styles["profile-header__actions"]}>
          {isOwner ? (
            <Link href="/settings" className={styles["profile-header__edit-btn"]}>
              Редактировать профиль
            </Link>
          ) : (
            isLoggedIn && (
              <>
                <ProfileFriendButton targetUserId={userId} initialStatus={friendStatus} />
                {friendStatus === "friends" && (
                  <ProfileMessageButton targetUserId={userId} isLoggedIn={isLoggedIn} />
                )}
              </>
            )
          )}
        </div>
      </div>
    </header>
  );
}
