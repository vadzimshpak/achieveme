import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { getUserById } from "@/lib/profile";
import { userAvatarSrc } from "@/lib/image-urls";
import { logoutAction } from "@/actions/auth";
import { NotificationBell } from "./NotificationBell";
import { getSiteName } from "@/lib/site";
import styles from "./site-header.module.css";

export async function SiteHeader() {
  const session = await auth();
  const user = session?.user?.id ? await getUserById(session.user.id) : null;
  const siteName = getSiteName();

  return (
    <header className={styles["site-header"]}>
      <div className={styles["site-header__inner"]}>
        <Link href="/" className={styles["site-header__logo"]}>
          {siteName}
        </Link>

        <nav className={styles["site-header__nav"]}>
          {user && (
            <>
              <Link href="/achievements" className={styles["site-header__link"]}>
                Достижения
              </Link>
              <Link href="/chat" className={styles["site-header__link"]}>
                Чат
              </Link>
            </>
          )}
          {session?.user?.role === "ADMIN" && (
            <Link href="/admin" className={styles["site-header__link"]}>
              Админ
            </Link>
          )}
        </nav>

        <div className={styles["site-header__user"]}>
          {user ? (
            <>
              <NotificationBell />
              <Link href={`/id/${user.nickname}`}>
                <Image
                  src={userAvatarSrc(user.id)}
                  alt={user.nickname}
                  width={32}
                  height={32}
                  className={styles["site-header__avatar"]}
                />
              </Link>
              <Link
                href={`/id/${user.nickname}`}
                className={styles["site-header__nickname"]}
              >
                {user.nickname}
              </Link>
              <form action={logoutAction}>
                <button type="submit" className={styles["site-header__logout"]}>
                  Выйти
                </button>
              </form>
            </>
          ) : (
            <Link href="/login" className={styles["site-header__login"]}>
              Войти
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
