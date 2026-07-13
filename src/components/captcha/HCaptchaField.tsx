"use client";

import HCaptcha from "@hcaptcha/react-hcaptcha";
import { useEffect, useRef } from "react";
import styles from "./hcaptcha-field.module.css";

type HCaptchaFieldProps = {
  siteKey: string;
  onTokenChange: (token: string) => void;
  resetSignal?: number;
};

export function HCaptchaField({ siteKey, onTokenChange, resetSignal = 0 }: HCaptchaFieldProps) {
  const captchaRef = useRef<HCaptcha>(null);

  useEffect(() => {
    captchaRef.current?.resetCaptcha();
    onTokenChange("");
  }, [resetSignal, onTokenChange]);

  if (!siteKey) return null;

  return (
    <div className={styles["hcaptcha-field"]}>
      <HCaptcha
        ref={captchaRef}
        sitekey={siteKey}
        onVerify={onTokenChange}
        onExpire={() => onTokenChange("")}
        onError={() => onTokenChange("")}
      />
    </div>
  );
}
