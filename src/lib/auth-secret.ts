const authSecret = process.env.AUTH_SECRET;

if (!authSecret) {
  throw new Error(
    "AUTH_SECRET не задан. Добавьте его в .env (см. .env.example). " +
      "Сгенерировать: openssl rand -base64 32",
  );
}

export { authSecret };
