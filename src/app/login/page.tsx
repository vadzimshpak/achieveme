import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { getHCaptchaSiteKey } from "@/lib/hcaptcha";
import styles from "@/components/auth/auth-form.module.css";

export default function LoginPage() {
  const hcaptchaSiteKey = getHCaptchaSiteKey();

  return (
    <div className={styles["auth-page"]}>
      <Suspense>
        <LoginForm hcaptchaSiteKey={hcaptchaSiteKey} />
      </Suspense>
    </div>
  );
}
