import { RegisterForm } from "@/components/auth/RegisterForm";
import { getHCaptchaSiteKey } from "@/lib/hcaptcha";
import styles from "@/components/auth/auth-form.module.css";

export default function RegisterPage() {
  const hcaptchaSiteKey = getHCaptchaSiteKey();

  return (
    <div className={styles["auth-page"]}>
      <RegisterForm hcaptchaSiteKey={hcaptchaSiteKey} />
    </div>
  );
}
