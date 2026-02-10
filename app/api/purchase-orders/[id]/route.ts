import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET single purchase order
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id },
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
            notes: true,
            vesselName: true,
            createdByName: true,
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
    });

    if (!purchaseOrder) {
      return NextResponse.json(
        { success: false, error: "Bon de commande non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: purchaseOrder });
  } catch (error) {
    console.error("Error fetching purchase order:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la récupération du bon de commande" },
      { status: 500 }
    );
  }
}

// PUT update purchase order
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, notes, products } = body;

    const updateData: Record<string, unknown> = {};

    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    // Update basic purchase order info
    const purchaseOrder = await prisma.purchaseOrder.update({
      where: { id },
      data: updateData,
    });

    // If products are provided, update them
    if (products && Array.isArray(products)) {
      for (const p of products) {
        await prisma.pOProduct.update({
          where: { id: p.id },
          data: {
            validatedQuantity: p.validatedQuantity,
            quotedPrice: p.quotedPrice,
            supplierName: p.supplierName,
            remark: p.remark,
          },
        });
      }
    }

    // Fetch updated purchase order
    const updatedPO = await prisma.purchaseOrder.findUnique({
      where: { id },
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

    return NextResponse.json({ success: true, data: updatedPO });
  } catch (error) {
    console.error("Error updating purchase order:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la mise à jour du bon de commande" },
      { status: 500 }
    );
  }
}

// DELETE purchase order
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.purchaseOrder.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting purchase order:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la suppression du bon de commande" },
      { status: 500 }
    );
  }
}
