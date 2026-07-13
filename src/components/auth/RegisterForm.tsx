"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction } from "@/actions/auth";
import { HCaptchaField } from "@/components/captcha/HCaptchaField";
import { useHCaptchaForm } from "@/components/captcha/useHCaptchaForm";
import styles from "./auth-form.module.css";

type RegisterFormProps = {
  hcaptchaSiteKey: string;
};

export function RegisterForm({ hcaptchaSiteKey }: RegisterFormProps) {
  const [state, formAction, pending] = useActionState(registerAction, {});
  const hasError = Boolean(state.error || state.fieldErrors);
  const { captchaToken, setCaptchaToken, resetSignal, captchaRequired, canSubmit } = useHCaptchaForm(
    hasError,
    hcaptchaSiteKey,
  );

  return (
    <form action={formAction} className={styles["auth-form"]}>
      <h1 className={styles["auth-form__title"]}>Регистрация</h1>

      <input type="hidden" name="hcaptchaToken" value={captchaToken} />

      {state.error && (
        <div className={`${styles["auth-form__message"]} ${styles["auth-form__message--error"]}`}>
          {state.error}
        </div>
      )}

      <div className={styles["auth-form__field"]}>
        <label htmlFor="nickname" className={styles["auth-form__label"]}>
          Никнейм
        </label>
        <input
          id="nickname"
          name="nickname"
          type="text"
          required
          minLength={3}
          maxLength={32}
          pattern="[a-zA-Z0-9_]+"
          className={styles["auth-form__input"]}
          autoComplete="username"
        />
        {state.fieldErrors?.nickname && (
          <p className={styles["auth-form__error"]}>{state.fieldErrors.nickname[0]}</p>
        )}
      </div>

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
          minLength={6}
          className={styles["auth-form__input"]}
          autoComplete="new-password"
        />
        {state.fieldErrors?.password && (
          <p className={styles["auth-form__error"]}>{state.fieldErrors.password[0]}</p>
        )}
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
        {pending ? "Регистрация..." : "Зарегистрироваться"}
      </button>

      <p className={styles["auth-form__footer"]}>
        Уже есть аккаунт? <Link href="/login">Войти</Link>
      </p>
    </form>
  );
}
