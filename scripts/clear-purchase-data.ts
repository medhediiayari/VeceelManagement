import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function clearPurchaseData() {
  console.log("🗑️  Suppression de toutes les données d'achat...")

  try {
    // 1. Supprimer les produits des bons de commande
    const deletedPOProducts = await prisma.pOProduct.deleteMany({})
    console.log(`   ✓ ${deletedPOProducts.count} produits BC supprimés`)

    // 2. Supprimer les bons de commande
    const deletedPOs = await prisma.purchaseOrder.deleteMany({})
    console.log(`   ✓ ${deletedPOs.count} bons de commande supprimés`)

    // 3. Supprimer les produits des demandes d'achat
    const deletedPRProducts = await prisma.pRProduct.deleteMany({})
    console.log(`   ✓ ${deletedPRProducts.count} produits PR supprimés`)

    // 4. Supprimer les demandes d'achat
    const deletedPRs = await prisma.purchaseRequest.deleteMany({})
    console.log(`   ✓ ${deletedPRs.count} demandes d'achat supprimées`)

    console.log("\n✅ Toutes les données d'achat ont été supprimées avec succès!")
  } catch (error) {
    console.error("❌ Erreur lors de la suppression:", error)
  } finally {
    await prisma.$disconnect()
  }
}

clearPurchaseData()
