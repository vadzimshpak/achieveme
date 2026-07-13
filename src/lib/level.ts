export function getXpForLevel(level: number): number {
  if (level <= 1) return 0;

  let total = 0;
  for (let i = 1; i < level; i++) {
    total += 100 * i;
  }
  return total;
}

export function calculateLevel(xp: number): number {
  let level = 1;

  while (getXpForLevel(level + 1) <= xp) {
    level++;
  }

  return level;
}

export function getLevelProgress(xp: number, level: number) {
  const currentLevelXp = getXpForLevel(level);
  const nextLevelXp = getXpForLevel(level + 1);
  const xpInLevel = xp - currentLevelXp;
  const xpNeeded = nextLevelXp - currentLevelXp;
  const percent = xpNeeded > 0 ? Math.round((xpInLevel / xpNeeded) * 100) : 100;

  return {
    current: xpInLevel,
    needed: xpNeeded,
    total: xp,
    percent: Math.min(100, Math.max(0, percent)),
    nextLevelXp,
  };
}

export async function applyXpReward(
  userId: string,
  xpReward: number,
  updateUser: (args: {
    where: { id: string };
    data: { xp: number; level: number };
  }) => Promise<unknown>,
  getUser: (id: string) => Promise<{ xp: number } | null>,
) {
  const user = await getUser(userId);
  if (!user) return null;

  const newXp = user.xp + xpReward;
  const newLevel = calculateLevel(newXp);

  await updateUser({
    where: { id: userId },
    data: { xp: newXp, level: newLevel },
  });

  return { xp: newXp, level: newLevel };
}
