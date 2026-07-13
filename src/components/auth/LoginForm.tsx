"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { loginAction } from "@/actions/auth";
import { HCaptchaField } from "@/components/captcha/HCaptchaField";
import { useHCaptchaForm } from "@/components/captcha/useHCaptchaForm";
import styles from "./auth-form.module.css";

type LoginFormProps = {
  hcaptchaSiteKey: string;
};

export function LoginForm({ hcaptchaSiteKey }: LoginFormProps) {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [state, formAction, pending] = useActionState(loginAction, {});
  const { captchaToken, setCaptchaToken, resetSignal, captchaRequired, canSubmit } = useHCaptchaForm(
    Boolean(state.error),
    hcaptchaSiteKey,
  );

  return (
    <form action={formAction} className={styles["auth-form"]}>
      <h1 className={styles["auth-form__title"]}>Вход в AchieveMe</h1>

      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <input type="hidden" name="hcaptchaToken" value={captchaToken} />

      {state.error && (
        <div className={`${styles["auth-form__message"]} ${styles["auth-form__message--error"]}`}>
          {state.error}
        </div>
      )}

      <div className={styles["auth-form__field"]}>
        <label htmlFor="email" className={styles["auth-form__label"]}>
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className={styles["auth-form__input"]}
          autoComplete="email"
        />
        {state.fieldErrors?.email && (
          <p className={styles["auth-form__error"]}>{state.fieldErrors.email[0]}</p>
        )}
      </div>

      <div className={styles["auth-form__field"]}>
        <label htmlFor="password" className={styles["auth-form__label"]}>
          Пароль
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className={styles["auth-form__input"]}
          autoComplete="current-password"
        />
      </div>

      {captchaRequired && (
        <HCaptchaField
          siteKey={hcaptchaSiteKey}
          onTokenChange={setCaptchaToken}
          resetSignal={resetSignal}
        />
      )}

      <button
        type="submit"
        className={styles["auth-form__submit"]}
        disabled={pending || !canSubmit}
      >
        {pending ? "Вход..." : "Войти"}
      </button>

      <p className={styles["auth-form__footer"]}>
        Нет аккаунта? <Link href="/register">Зарегистрироваться</Link>
      </p>
    </form>
  );
}
