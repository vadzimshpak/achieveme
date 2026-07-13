import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ChatPageClient } from "@/components/chat/ChatPageClient";
import styles from "@/components/chat/chat-page.module.css";

export default async function ChatPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <Suspense
      fallback={<div className={styles["chat-page__empty"]}>Загрузка чата...</div>}
    >
      <ChatPageClient />
    </Suspense>
  );
}
