"use client";

import { useEffect, useState } from "react";

export function useHCaptchaForm(hasError: boolean, siteKey: string) {
  const [captchaToken, setCaptchaToken] = useState("");
  const [resetSignal, setResetSignal] = useState(0);
  const captchaRequired = Boolean(siteKey);

  useEffect(() => {
    if (hasError) {
      setCaptchaToken("");
      setResetSignal((current) => current + 1);
    }
  }, [hasError]);

  const canSubmit = !captchaRequired || captchaToken.length > 0;

  return {
    captchaToken,
    setCaptchaToken,
    resetSignal,
    captchaRequired,
    canSubmit,
  };
}
