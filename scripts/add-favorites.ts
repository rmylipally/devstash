import { prisma } from "@/lib/prisma";

async function addFavorites() {
  try {
    // Get demo user
    const demoUser = await prisma.user.findUnique({
      where: { email: "demo@devstash.io" },
    });

    if (!demoUser) {
      console.error("Demo user not found");
      process.exit(1);
    }

    console.log(`Found demo user: ${demoUser.name} (${demoUser.id})`);

    // Get all items for demo user
    const allItems = await prisma.item.findMany({
      where: { userId: demoUser.id },
      orderBy: { createdAt: "asc" },
    });

    // Get all collections for demo user
    const allCollections = await prisma.collection.findMany({
      where: { userId: demoUser.id },
      orderBy: { createdAt: "asc" },
    });

    console.log(`Total items: ${allItems.length}`);
    console.log(`Total collections: ${allCollections.length}`);

    // Calculate 1/3 to mark as favorite
    const itemsToFavorite = Math.ceil(allItems.length / 3);
    const collectionsToFavorite = Math.ceil(allCollections.length / 3);

    console.log(
      `Marking ${itemsToFavorite} items (~1/3) as favorite...`
    );
    console.log(
      `Marking ${collectionsToFavorite} collections (~1/3) as favorite...`
    );

    // Mark items as favorite
    const itemsToUpdate = allItems.slice(0, itemsToFavorite);
    for (const item of itemsToUpdate) {
      await prisma.item.update({
        where: { id: item.id },
        data: { isFavorite: true },
      });
    }

    // Mark collections as favorite
    const collectionsToUpdate = allCollections.slice(0, collectionsToFavorite);
    for (const collection of collectionsToUpdate) {
      await prisma.collection.update({
        where: { id: collection.id },
        data: { isFavorite: true },
      });
    }

    console.log(`✅ Successfully marked ${itemsToUpdate.length} items as favorite`);
    console.log(`✅ Successfully marked ${collectionsToUpdate.length} collections as favorite`);
    console.log(
      `Total favorites: ${itemsToUpdate.length + collectionsToUpdate.length}`
    );
  } catch (error) {
    console.error("Error adding favorites:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

addFavorites();
