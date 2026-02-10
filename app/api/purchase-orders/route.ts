import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET all purchase orders
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const creatorId = searchParams.get("creatorId"); // Filter by PR creator (for crew view)

    const whereClause: Record<string, unknown> = {};

    // If creatorId is provided, filter by the original PR creator
    if (creatorId) {
      whereClause.purchaseRequest = {
        createdById: creatorId,
      };
    }

    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where: whereClause,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        purchaseRequest: {
          select: {
            id: true,
            reference: true,
            category: true,
            priority: true,
            vesselName: true,
            createdByName: true,
            createdById: true,
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
            vessel: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        products: {
          include: {
            prProduct: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: purchaseOrders });
  } catch (error) {
    console.error("Error fetching purchase orders:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la récupération des bons de commande" },
      { status: 500 }
    );
  }
}

// POST create a new purchase order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { purchaseRequestId, createdById, notes, products } = body;

    console.log("Creating BC with data:", JSON.stringify({ purchaseRequestId, createdById, notes, productCount: products?.length }, null, 2));
    console.log("Products:", JSON.stringify(products, null, 2));

    if (!purchaseRequestId) {
      return NextResponse.json(
        { success: false, error: "L'ID de la demande d'achat est requis" },
        { status: 400 }
      );
    }

    if (!products || !Array.isArray(products) || products.length === 0) {
      return NextResponse.json(
        { success: false, error: "Les produits sont requis" },
        { status: 400 }
      );
    }

    // Check if PR exists
    const purchaseRequest = await prisma.purchaseRequest.findUnique({
      where: { id: purchaseRequestId },
    });

    if (!purchaseRequest) {
      return NextResponse.json(
        { success: false, error: "Demande d'achat non trouvée" },
        { status: 404 }
      );
    }

    // Check if a PO already exists for this PR
    const existingPO = await prisma.purchaseOrder.findFirst({
      where: { purchaseRequestId },
    });

    if (existingPO) {
      return NextResponse.json(
        { success: false, error: "Un bon de commande existe déjà pour cette demande d'achat" },
        { status: 400 }
      );
    }

    // Generate reference
    const year = new Date().getFullYear();
    const lastPO = await prisma.purchaseOrder.findFirst({
      where: {
        reference: { startsWith: `BC-${year}` },
      },
      orderBy: { reference: "desc" },
    });

    let nextNumber = 1;
    if (lastPO) {
      const lastNumber = parseInt(lastPO.reference.split("-")[2]);
      nextNumber = lastNumber + 1;
    }
    const reference = `BC-${year}-${String(nextNumber).padStart(3, "0")}`;

    // Create purchase order with products
    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        reference,
        purchaseRequestId,
        createdById: createdById || null,
        notes: notes || null,
        products: {
          create: products.map((p: {
            name: string;
            originalQuantity: number;
            validatedQuantity: number;
            unit: string;
            quotedPrice?: number | string | null;
            supplierName?: string | null;
            remark?: string | null;
            prProductId?: string | null;
          }) => ({
            name: String(p.name),
            originalQuantity: Number(p.originalQuantity) || 0,
            validatedQuantity: Number(p.validatedQuantity) || 0,
            unit: String(p.unit),
            quotedPrice: p.quotedPrice != null ? Number(p.quotedPrice) : null,
            supplierName: p.supplierName || null,
            remark: p.remark || null,
            prProductId: p.prProductId || null,
          })),
        },
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        purchaseRequest: {
          select: {
            id: true,
            reference: true,
            createdById: true,
            createdBy: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        products: true,
      },
    });

    return NextResponse.json({ success: true, data: purchaseOrder }, { status: 201 });
  } catch (error) {
    console.error("Error creating purchase order:", error);
    const errorMessage = error instanceof Error ? error.message : "Erreur lors de la création du bon de commande";
    return NextResponse.json(
      { success: false, error: errorMessage, details: String(error) },
      { status: 500 }
    );
  }
}
