import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET single purchase request
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const purchaseRequest = await prisma.purchaseRequest.findUnique({
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
        vessel: {
          select: {
            id: true,
            name: true,
            imo: true,
          },
        },
        masterApprovedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        products: true,
      },
    });

    if (!purchaseRequest) {
      return NextResponse.json(
        { success: false, error: "Demande d'achat non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: purchaseRequest });
  } catch (error) {
    console.error("Error fetching purchase request:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la récupération de la demande d'achat" },
      { status: 500 }
    );
  }
}

// PUT update purchase request (including master approval and quotation)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { 
      masterApproved, 
      masterApprovedById, 
      category, 
      priority, 
      notes,
      customReference,
      products,
      // Quotation fields
      sentToQuotation,
      quotationSentById,
      quotationRemark,
      quotationProducts // Array of { id, quotedPrice, supplierName, remark }
    } = body;

    const updateData: Record<string, unknown> = {};

    // Handle master approval toggle
    if (masterApproved !== undefined) {
      updateData.masterApproved = masterApproved;
      if (masterApproved && masterApprovedById) {
        updateData.masterApprovedById = masterApprovedById;
        updateData.masterApprovedAt = new Date();
      } else if (!masterApproved) {
        updateData.masterApprovedById = null;
        updateData.masterApprovedAt = null;
      }
    }

    // Handle sending to quotation
    if (sentToQuotation !== undefined) {
      updateData.sentToQuotation = sentToQuotation;
      if (sentToQuotation) {
        updateData.quotationSentAt = new Date();
        if (quotationSentById) {
          updateData.quotationSentById = quotationSentById;
        }
      }
    }

    // Handle quotation remark
    if (quotationRemark !== undefined) {
      updateData.quotationRemark = quotationRemark;
    }

    if (category) updateData.category = category;
    if (priority) updateData.priority = priority;
    if (notes !== undefined) updateData.notes = notes;
    if (customReference !== undefined) updateData.customReference = customReference;

    // Update the purchase request
    const purchaseRequest = await prisma.purchaseRequest.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: {
          select: { name: true, email: true },
        },
        vessel: {
          select: { name: true },
        },
        masterApprovedBy: {
          select: { name: true, email: true },
        },
        quotationSentBy: {
          select: { name: true, email: true },
        },
        products: true,
      },
    });

    // If products are provided, update them
    if (products && Array.isArray(products)) {
      // Delete existing products
      await prisma.pRProduct.deleteMany({
        where: { purchaseRequestId: id },
      });

      // Create new products
      await prisma.pRProduct.createMany({
        data: products.map((p: { name: string; quantity: number; unit: string }) => ({
          purchaseRequestId: id,
          name: p.name,
          quantity: p.quantity,
          unit: p.unit,
        })),
      });
    }

    // If quotation products are provided, update them with quotation data
    if (quotationProducts && Array.isArray(quotationProducts)) {
      for (const qp of quotationProducts) {
        if (qp.id) {
          // Set wasUnavailable = true if unavailableReason is being set
          const wasUnavailable = qp.unavailableReason ? true : undefined;
          await prisma.pRProduct.update({
            where: { id: qp.id },
            data: {
              quotedPrice: qp.quotedPrice !== undefined ? qp.quotedPrice : undefined,
              supplierName: qp.supplierName !== undefined ? qp.supplierName : undefined,
              remark: qp.remark !== undefined ? qp.remark : undefined,
              unavailableReason: qp.unavailableReason !== undefined ? qp.unavailableReason : undefined,
              wasUnavailable: wasUnavailable,
            },
          });
        }
      }
      // Mark quotation as completed
      await prisma.purchaseRequest.update({
        where: { id },
        data: { quotationCompletedAt: new Date() },
      });
    }

    // Fetch updated purchase request with all relations
    const updatedPR = await prisma.purchaseRequest.findUnique({
      where: { id },
      include: {
        createdBy: { select: { name: true, email: true } },
        vessel: { select: { name: true } },
        masterApprovedBy: { select: { name: true, email: true } },
        quotationSentBy: { select: { name: true, email: true } },
        products: true,
      },
    });

    return NextResponse.json({ success: true, data: updatedPR });
  } catch (error) {
    console.error("Error updating purchase request:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la mise à jour de la demande d'achat" },
      { status: 500 }
    );
  }
}

// DELETE purchase request
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Delete products first
    await prisma.pRProduct.deleteMany({
      where: { purchaseRequestId: id },
    });

    await prisma.purchaseRequest.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Demande d'achat supprimée" });
  } catch (error) {
    console.error("Error deleting purchase request:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la suppression de la demande d'achat" },
      { status: 500 }
    );
  }
}
