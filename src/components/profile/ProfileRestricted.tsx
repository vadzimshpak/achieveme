import Image from "next/image";
import type { FriendRelationStatus } from "@/lib/friendship";
import { userAvatarSrc } from "@/lib/image-urls";
import { ProfileFriendButton } from "./ProfileFriendButton";
import { ProfileMessageButton } from "./ProfileMessageButton";
import styles from "./profile-restricted.module.css";

type ProfileRestrictedProps = {
  userId: string;
  nickname: string;
  isLoggedIn: boolean;
  friendStatus: FriendRelationStatus;
};

export function ProfileRestricted({
  userId,
  nickname,
  isLoggedIn,
  friendStatus,
}: ProfileRestrictedProps) {
  return (
    <div className={styles["profile-restricted"]}>
      <div className={styles["profile-restricted__card"]}>
        <Image
          src={userAvatarSrc(userId)}
          alt={nickname}
          width={96}
          height={96}
          className={styles["profile-restricted__avatar"]}
        />
        <h1 className={styles["profile-restricted__nickname"]}>{nickname}</h1>
        <p className={styles["profile-restricted__text"]}>Профиль скрыт настройками конфиденциальности</p>

        <div className={styles["profile-restricted__actions"]}>
          {isLoggedIn && (
            <>
              <ProfileFriendButton targetUserId={userId} initialStatus={friendStatus} />
              {friendStatus === "friends" && (
                <ProfileMessageButton targetUserId={userId} isLoggedIn={isLoggedIn} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
