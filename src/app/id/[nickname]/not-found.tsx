import Link from "next/link";

export default function NotFound() {
  return (
    <main style={{ textAlign: "center", padding: "80px 24px" }}>
      <h1 style={{ color: "#fff", fontSize: 48, marginBottom: 16 }}>404</h1>
      <p style={{ color: "#8f98a0", marginBottom: 24 }}>Профиль не найден</p>
      <Link href="/" style={{ color: "#66c0f4" }}>
        На главную
      </Link>
    </main>
  );
}
