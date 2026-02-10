import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyPRChange } from "./events/route";

// GET all purchase requests
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vesselId = searchParams.get("vesselId");
    const createdById = searchParams.get("createdById");
    const masterApproved = searchParams.get("masterApproved");

    const whereClause: Record<string, unknown> = {};
    if (vesselId) whereClause.vesselId = vesselId;
    if (createdById) whereClause.createdById = createdById;
    if (masterApproved !== null) whereClause.masterApproved = masterApproved === "true";

    const purchaseRequests = await prisma.purchaseRequest.findMany({
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
        masterApprovedBy: {
          select: {
            id: true,
            name: true,
          },
        },
        quotationSentBy: {
          select: {
            id: true,
            name: true,
          },
        },
        vessel: {
          select: {
            id: true,
            name: true,
          },
        },
        products: {
          include: {
            poProducts: {
              select: {
                validatedQuantity: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedRequests = purchaseRequests.map((pr) => ({
      id: pr.id,
      reference: pr.reference,
      customReference: pr.customReference,
      category: pr.category,
      priority: pr.priority,
      notes: pr.notes,
      vesselName: pr.vesselName,
      createdByName: pr.createdByName,
      createdBy: pr.createdBy,
      masterApproved: pr.masterApproved,
      masterApprovedBy: pr.masterApprovedBy,
      masterApprovedAt: pr.masterApprovedAt,
      // Quotation fields
      sentToQuotation: pr.sentToQuotation,
      quotationSentAt: pr.quotationSentAt,
      quotationSentBy: pr.quotationSentBy,
      quotationCompletedAt: pr.quotationCompletedAt,
      quotationRemark: pr.quotationRemark,
      vessel: pr.vessel,
      products: pr.products.map((p) => ({
        id: p.id,
        name: p.name,
        quantity: p.quantity,
        unit: p.unit,
        reference: p.reference,
        rob: p.rob,
        images: p.images,
        quotedPrice: p.quotedPrice,
        supplierName: p.supplierName,
        remark: p.remark,
        unavailableReason: p.unavailableReason,
        wasUnavailable: p.wasUnavailable,
        orderedQuantity: p.poProducts.reduce((sum, po) => sum + po.validatedQuantity, 0),
      })),
      createdAt: pr.createdAt,
      updatedAt: pr.updatedAt,
    }));

    return NextResponse.json({ success: true, data: formattedRequests });
  } catch (error) {
    console.error("Error fetching purchase requests:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la récupération des demandes d'achat" },
      { status: 500 }
    );
  }
}

// POST create new purchase request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { category, priority, notes, customReference, createdById, vesselId, products } = body;

    if (!category || !createdById || !vesselId || !products || products.length === 0) {
      return NextResponse.json(
        { success: false, error: "Catégorie, créateur, navire et produits requis" },
        { status: 400 }
      );
    }

    // Fetch user and vessel names to preserve them
    const [user, vessel] = await Promise.all([
      prisma.user.findUnique({ where: { id: createdById }, select: { name: true } }),
      prisma.vessel.findUnique({ where: { id: vesselId }, select: { name: true } }),
    ]);

    // Generate reference number
    const count = await prisma.purchaseRequest.count();
    const year = new Date().getFullYear();
    const reference = `PR-${year}-${String(count + 1).padStart(3, "0")}`;

    const purchaseRequest = await prisma.purchaseRequest.create({
      data: {
        reference,
        customReference: customReference || null,
        category,
        priority: priority || "MEDIUM",
        notes: notes || null,
        createdById,
        createdByName: user?.name || null,
        vesselId,
        vesselName: vessel?.name || null,
        products: {
          create: products.map((p: { name: string; quantity: number; unit: string; reference?: string; rob?: number | null; images?: string[] }) => ({
            name: String(p.name),
            quantity: Number(p.quantity) || 1,
            unit: String(p.unit),
            reference: p.reference || null,
            rob: p.rob != null ? Number(p.rob) : null,
            images: Array.isArray(p.images) ? p.images : [],
          })),
        },
      },
      include: {
        createdBy: {
          select: { name: true, email: true },
        },
        vessel: {
          select: { name: true },
        },
        products: true,
      },
    });

    // Notify all connected clients about the new PR
    notifyPRChange();

    return NextResponse.json({ success: true, data: purchaseRequest }, { status: 201 });
  } catch (error) {
    console.error("Error creating purchase request:", error);
    const errorMessage = error instanceof Error ? error.message : "Erreur lors de la création de la demande d'achat";
    return NextResponse.json(
      { success: false, error: errorMessage, details: String(error) },
      { status: 500 }
    );
  }
}
