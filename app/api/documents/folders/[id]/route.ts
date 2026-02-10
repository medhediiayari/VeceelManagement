import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET single folder
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const folder = await prisma.documentFolder.findUnique({
      where: { id },
      include: {
        _count: {
          select: { documents: true },
        },
        createdBy: {
          select: { name: true },
        },
        documents: {
          select: {
            id: true,
            name: true,
            fileType: true,
            createdAt: true,
          },
        },
      },
    });

    if (!folder) {
      return NextResponse.json(
        { success: false, error: "Dossier non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: folder });
  } catch (error) {
    console.error("Error fetching folder:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la récupération du dossier" },
      { status: 500 }
    );
  }
}

// PUT update folder
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, color, description, vesselId } = body;

    const folder = await prisma.documentFolder.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(color && { color }),
        ...(description !== undefined && { description }),
        vesselId: vesselId || null,
      },
      include: {
        vessel: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: folder });
  } catch (error) {
    console.error("Error updating folder:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la mise à jour du dossier" },
      { status: 500 }
    );
  }
}

// DELETE folder
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // First delete all documents in the folder
    await prisma.document.deleteMany({
      where: { folderId: id },
    });

    // Then delete the folder
    await prisma.documentFolder.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Dossier supprimé" });
  } catch (error) {
    console.error("Error deleting folder:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la suppression du dossier" },
      { status: 500 }
    );
  }
}
