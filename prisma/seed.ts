import "dotenv/config";
import { readFile } from "fs/promises";
import path from "path";
import { hash } from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient, Role } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const SPHERES = [
  { name: "Здоровье", description: "Физическое и ментальное здоровье", sortOrder: 1 },
  { name: "Карьера", description: "Работа и профессиональный рост", sortOrder: 2 },
  { name: "Образование", description: "Обучение и развитие навыков", sortOrder: 3 },
  { name: "Спорт", description: "Физическая активность и спортивные цели", sortOrder: 4 },
  { name: "Творчество", description: "Творческие проекты и хобби", sortOrder: 5 },
];

const BANNER_PRESETS = [
  { id: "classic", name: "Классический", file: "banners/classic.svg", sortOrder: 1 },
  { id: "sunset", name: "Закат", file: "banners/sunset.svg", sortOrder: 2 },
  { id: "forest", name: "Лес", file: "banners/forest.svg", sortOrder: 3 },
  { id: "ocean", name: "Океан", file: "banners/ocean.svg", sortOrder: 4 },
  { id: "night", name: "Ночное небо", file: "banners/night.svg", sortOrder: 5 },
];

async function createDefaultImage(filename: string) {
  const filePath = path.join(process.cwd(), "public", filename);
  const data = await readFile(filePath);
  const mimeType = filename.endsWith(".svg") ? "image/svg+xml" : "application/octet-stream";

  return prisma.storedImage.create({
    data: { data, mimeType },
  });
}

async function seedBannerPresets() {
  for (const preset of BANNER_PRESETS) {
    const existing = await prisma.bannerPreset.findUnique({ where: { id: preset.id } });

    if (!existing) {
      const image = await createDefaultImage(preset.file);
      await prisma.bannerPreset.create({
        data: {
          id: preset.id,
          name: preset.name,
          sortOrder: preset.sortOrder,
          imageId: image.id,
        },
      });
    } else {
      await prisma.bannerPreset.update({
        where: { id: preset.id },
        data: { name: preset.name, sortOrder: preset.sortOrder },
      });
    }
  }
}

async function main() {
  await seedBannerPresets();

  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@example.com";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "admin123";
  const passwordHash = await hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash,
      nickname: "admin",
      role: Role.ADMIN,
      bio: "Администратор AchieveMe",
      bannerPresetId: "classic",
    },
  });

  const demoPasswordHash = await hash("demo123", 12);
  const existingDemo = await prisma.user.findUnique({ where: { email: "demo@example.com" } });

  let demo;
  if (!existingDemo) {
    const avatarImage = await createDefaultImage("default-avatar.svg");

    demo = await prisma.user.create({
      data: {
        email: "demo@example.com",
        passwordHash: demoPasswordHash,
        nickname: "demo",
        bio: "Hello all",
        xp: 340,
        level: 3,
        avatarImageId: avatarImage.id,
        bannerPresetId: "classic",
      },
    });
  } else {
    demo = existingDemo;
    if (!existingDemo.bannerPresetId) {
      await prisma.user.update({
        where: { id: existingDemo.id },
        data: { bannerPresetId: "classic" },
      });
    }
  }

  await prisma.user.updateMany({
    where: { bannerPresetId: null },
    data: { bannerPresetId: "classic" },
  });

  for (const sphere of SPHERES) {
    const existing = await prisma.lifeSphere.findUnique({ where: { name: sphere.name } });

    if (!existing) {
      const iconImage = await createDefaultImage("default-sphere-icon.svg");
      await prisma.lifeSphere.create({
        data: {
          ...sphere,
          iconImageId: iconImage.id,
        },
      });
    } else {
      await prisma.lifeSphere.update({
        where: { name: sphere.name },
        data: { description: sphere.description, sortOrder: sphere.sortOrder },
      });
    }
  }

  const healthSphere = await prisma.lifeSphere.findUnique({ where: { name: "Здоровье" } });
  const careerSphere = await prisma.lifeSphere.findUnique({ where: { name: "Карьера" } });

  if (healthSphere && careerSphere) {
    const achievementTemplates = [
      {
        sphereId: healthSphere.id,
        title: "Первая пробежка",
        description: "Пробежал 5 км без остановки",
        xpReward: 15,
      },
      {
        sphereId: healthSphere.id,
        title: "Ранний подъём",
        description: "Встал в 6:00 семь дней подряд",
        xpReward: 10,
      },
      {
        sphereId: careerSphere.id,
        title: "Первый проект",
        description: "Завершил первый pet-project",
        xpReward: 20,
      },
    ];

    for (const achievement of achievementTemplates) {
      const existing = await prisma.achievementTemplate.findFirst({
        where: { sphereId: achievement.sphereId, title: achievement.title },
      });
      if (!existing) {
        const iconImage = await createDefaultImage("default-achievement-icon.svg");
        await prisma.achievementTemplate.create({
          data: { ...achievement, iconImageId: iconImage.id },
        });
      }
    }

    const achTemplates = await prisma.achievementTemplate.findMany({
      where: { sphereId: { in: [healthSphere.id, careerSphere.id] } },
    });

    const existingUserAchievements = await prisma.userAchievement.count({
      where: { userId: demo.id },
    });

    if (existingUserAchievements === 0) {
      const unlockedTitles = new Set(["Первая пробежка", "Первый проект"]);
      for (const template of achTemplates) {
        if (unlockedTitles.has(template.title)) {
          await prisma.userAchievement.create({
            data: { userId: demo.id, achievementTemplateId: template.id },
          });
        }
      }
    }

    const earlyRise = achTemplates.find((t) => t.title === "Ранний подъём");
    if (earlyRise) {
      await prisma.userCurrentGoal.upsert({
        where: {
          userId_sphereId: { userId: demo.id, sphereId: healthSphere.id },
        },
        update: { achievementTemplateId: earlyRise.id },
        create: {
          userId: demo.id,
          sphereId: healthSphere.id,
          achievementTemplateId: earlyRise.id,
        },
      });
    }

    const firstRun = achTemplates.find((t) => t.title === "Первая пробежка");
    const firstProject = achTemplates.find((t) => t.title === "Первый проект");

    const existingPosts = await prisma.post.count();
    if (existingPosts === 0 && firstRun && earlyRise && firstProject) {
      await prisma.post.createMany({
        data: [
          {
            authorId: demo.id,
            achievementTemplateId: firstRun.id,
            title: "5 км без остановки!",
            type: "PROGRESS",
            body: [
              {
                type: "paragraph",
                content: [{ type: "text", text: "Сегодня пробежал 5 км впервые без пауз. Ноги горят, но чувство победы того стоит." }],
              },
            ],
          },
          {
            authorId: demo.id,
            achievementTemplateId: earlyRise.id,
            title: "Неделя ранних подъёмов",
            type: "PROGRESS",
            body: [
              {
                type: "paragraph",
                content: [{ type: "text", text: "Пятый день подряд встаю в 6:00. Это моя текущая цель — держу темп." }],
              },
            ],
          },
          {
            authorId: demo.id,
            achievementTemplateId: firstProject.id,
            title: "Pet-project готов к релизу",
            type: "APPROVAL_REQUEST",
            body: [
              {
                type: "paragraph",
                content: [{ type: "text", text: "Завершил pet-project и выкатил его в прод. Прошу подтвердить достижение." }],
              },
            ],
          },
        ],
      });
    }

    const postVoteCount = await prisma.postVote.count();
    if (postVoteCount === 0) {
      const admin = await prisma.user.findFirst({ where: { role: Role.ADMIN } });
      const demoPosts = await prisma.post.findMany({
        where: { authorId: demo.id },
        orderBy: { createdAt: "asc" },
        take: 3,
      });

      if (admin && demoPosts.length > 0) {
        await prisma.postVote.createMany({
          data: [
            { userId: admin.id, postId: demoPosts[0]!.id, value: "LIKE" },
            { userId: admin.id, postId: demoPosts[1]?.id ?? demoPosts[0]!.id, value: "LIKE" },
            { userId: admin.id, postId: demoPosts[2]?.id ?? demoPosts[0]!.id, value: "DISLIKE" },
          ],
          skipDuplicates: true,
        });
      }
    }

    const approvalPost = await prisma.post.findFirst({
      where: { authorId: demo.id, type: "APPROVAL_REQUEST" },
    });

    if (approvalPost && approvalPost.moderationStatus === "NONE") {
      await prisma.post.update({
        where: { id: approvalPost.id },
        data: { moderationStatus: "PENDING" },
      });
    }
  }

  console.log("Seed completed:");
  console.log(`  Admin: ${adminEmail} / ${adminPassword}`);
  console.log("  Demo: demo@example.com / demo123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
