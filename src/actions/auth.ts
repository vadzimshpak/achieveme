"use server";

import { hash } from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/lib/auth";
import { verifyHCaptchaFromFormData } from "@/lib/hcaptcha";
import { Role } from "@/generated/prisma/client";
import { AuthError } from "next-auth";

const registerSchema = z.object({
  email: z.string().email("Некорректный email"),
  password: z.string().min(6, "Пароль должен быть не менее 6 символов"),
  nickname: z
    .string()
    .min(3, "Никнейм должен быть не менее 3 символов")
    .max(32, "Никнейм должен быть не более 32 символов")
    .regex(/^[a-zA-Z0-9_]+$/, "Никнейм может содержать только буквы, цифры и _"),
});

export type AuthFormState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function registerAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const captcha = await verifyHCaptchaFromFormData(formData);
  if (!captcha.ok) return { error: captcha.error };

  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    nickname: formData.get("nickname"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { email, password, nickname } = parsed.data;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { nickname }] },
  });

  if (existing) {
    return { error: "Пользователь с таким email или никнеймом уже существует" };
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  const role = adminEmail && email === adminEmail ? Role.ADMIN : Role.USER;
  const passwordHash = await hash(password, 12);

  await prisma.user.create({
    data: {
      email,
      passwordHash,
      nickname,
      role,
      privacySettings: {
        create: {},
      },
    },
  });

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: `/id/${nickname}`,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Не удалось войти после регистрации" };
    }
    throw error;
  }

  return {};
}

export async function loginAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const captcha = await verifyHCaptchaFromFormData(formData);
  if (!captcha.ok) return { error: captcha.error };

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const callbackUrl = (formData.get("callbackUrl") as string) || "/";

  if (!email || !password) {
    return { error: "Заполните все поля" };
  }

  try {
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      return { error: "Неверный email или пароль" };
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      redirect(`/id/${user.nickname}`);
    }

    redirect(callbackUrl);
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Неверный email или пароль" };
    }
    throw error;
  }
}

export async function logoutAction() {
  const { signOut } = await import("@/lib/auth");
  await signOut({ redirectTo: "/" });
}
