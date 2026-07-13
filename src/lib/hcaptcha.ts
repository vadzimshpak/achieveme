export function getHCaptchaSiteKey(): string {
  return process.env.HCAPTCHA_SITEKEY?.trim() ?? "";
}

export function isHCaptchaEnabled(): boolean {
  return Boolean(getHCaptchaSiteKey() && process.env.HCAPTCHA_SECRET?.trim());
}

export async function verifyHCaptchaToken(
  token: string | null | undefined,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const secret = process.env.HCAPTCHA_SECRET?.trim();

  if (!secret || !getHCaptchaSiteKey()) {
    return { ok: true };
  }

  if (!token) {
    return { ok: false, error: "Подтвердите, что вы не робот" };
  }

  const response = await fetch("https://api.hcaptcha.com/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      secret,
      response: token,
    }),
  });

  if (!response.ok) {
    return { ok: false, error: "Не удалось проверить captcha" };
  }

  const result = (await response.json()) as { success?: boolean };

  if (!result.success) {
    return { ok: false, error: "Проверка captcha не пройдена. Попробуйте снова." };
  }

  return { ok: true };
}

export async function verifyHCaptchaFromFormData(
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const token = formData.get("hcaptchaToken");
  return verifyHCaptchaToken(typeof token === "string" ? token : null);
}
