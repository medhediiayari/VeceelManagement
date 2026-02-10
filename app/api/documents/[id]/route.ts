import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET single document
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        uploadedBy: {
          select: { id: true, name: true },
        },
        folder: {
          select: { id: true, name: true, color: true },
        },
        vessel: {
          select: { id: true, name: true },
        },
      },
    });

    if (!document) {
      return NextResponse.json(
        { success: false, error: "Document non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: document });
  } catch (error) {
    console.error("Error fetching document:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la récupération du document" },
      { status: 500 }
    );
  }
}

// PUT update document
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, status, expiryDate, folderId, vesselId } = body;

    const document = await prisma.document.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
        ...(expiryDate !== undefined && { expiryDate: expiryDate ? new Date(expiryDate) : null }),
        ...(folderId !== undefined && { folderId }),
        ...(vesselId !== undefined && { vesselId }),
      },
    });

    return NextResponse.json({ success: true, data: document });
  } catch (error) {
    console.error("Error updating document:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la mise à jour du document" },
      { status: 500 }
    );
  }
}

// DELETE document
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.document.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Document supprimé" });
  } catch (error) {
    console.error("Error deleting document:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la suppression du document" },
      { status: 500 }
    );
  }
}
