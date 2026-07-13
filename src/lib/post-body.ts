export function extractPlainTextFromPostBody(body: unknown, maxLength = 400): string {
  if (!Array.isArray(body)) return "";

  const parts: string[] = [];

  for (const block of body) {
    if (!block || typeof block !== "object") continue;
    const content = (block as { content?: unknown[] }).content;
    if (!Array.isArray(content)) continue;

    for (const item of content) {
      if (!item || typeof item !== "object") continue;
      const text = (item as { text?: string }).text;
      if (typeof text === "string" && text.trim()) {
        parts.push(text.trim());
      }
    }
  }

  const joined = parts.join(" ");
  if (joined.length <= maxLength) return joined;
  return `${joined.slice(0, maxLength)}…`;
}
