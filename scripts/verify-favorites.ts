import { prisma } from "@/lib/prisma";

async function verifyFavorites() {
  try {
    const demoUser = await prisma.user.findUnique({
      where: { email: "demo@devstash.io" },
    });

    if (!demoUser) {
      console.error("Demo user not found");
      process.exit(1);
    }

    const favItems = await prisma.item.findMany({
      where: { userId: demoUser.id, isFavorite: true },
      select: { title: true },
    });

    const favCollections = await prisma.collection.findMany({
      where: { userId: demoUser.id, isFavorite: true },
      select: { name: true },
    });

    console.log("✅ Verification Results:");
    console.log(`📌 Favorited Items (${favItems.length}):`);
    favItems.forEach((item) => console.log(`   - ${item.title}`));
    console.log(`📌 Favorited Collections (${favCollections.length}):`);
    favCollections.forEach((collection) =>
      console.log(`   - ${collection.name}`)
    );
  } catch (error) {
    console.error("Error verifying favorites:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyFavorites();
