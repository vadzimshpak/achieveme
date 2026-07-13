import Link from "next/link";
import Image from "next/image";
import type { FriendListItem } from "@/lib/friendship";
import { LevelBadge } from "./LevelBadge";
import { userAvatarSrc } from "@/lib/image-urls";
import styles from "./profile-sidebar.module.css";

type ProfileFriendsListProps = {
  friends: FriendListItem[];
};

export function ProfileFriendsList({ friends }: ProfileFriendsListProps) {
  return (
    <div className={styles["profile-sidebar__section"]}>
      <h3 className={styles["profile-sidebar__title"]}>
        Друзья <span className={styles["profile-sidebar__title-count"]}>({friends.length})</span>
      </h3>
      {friends.length === 0 ? (
        <p className={styles["profile-sidebar__friends-empty"]}>Пока нет друзей</p>
      ) : (
        <ul className={styles["profile-sidebar__friends-list"]}>
          {friends.map((friend) => (
            <li key={friend.id}>
              <Link href={`/id/${friend.nickname}`} className={styles["profile-sidebar__friend"]}>
                <Image
                  src={userAvatarSrc(friend.id)}
                  alt={friend.nickname}
                  width={28}
                  height={28}
                  className={styles["profile-sidebar__friend-avatar"]}
                />
                <span className={styles["profile-sidebar__friend-name"]}>{friend.nickname}</span>
                <LevelBadge level={friend.level} compact />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
