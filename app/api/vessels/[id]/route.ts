import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET single vessel
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const vessel = await prisma.vessel.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
          },
        },
        _count: {
          select: { purchaseRequests: true, documents: true },
        },
      },
    });

    if (!vessel) {
      return NextResponse.json(
        { success: false, error: "Navire non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: vessel });
  } catch (error) {
    console.error("Error fetching vessel:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la récupération du navire" },
      { status: 500 }
    );
  }
}

// PUT update vessel
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, imo, flag, type, grossTonnage, status } = body;

    const vessel = await prisma.vessel.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(imo && { imo }),
        ...(flag !== undefined && { flag: flag || null }),
        ...(type !== undefined && { type: type || null }),
        ...(grossTonnage !== undefined && { grossTonnage: grossTonnage ? parseFloat(String(grossTonnage)) : null }),
        ...(status && { status }),
      },
    });

    return NextResponse.json({ success: true, data: vessel });
  } catch (error) {
    console.error("Error updating vessel:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la mise à jour du navire" },
      { status: 500 }
    );
  }
}

// DELETE vessel
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if vessel has related records
    const vessel = await prisma.vessel.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            purchaseRequests: true,
            documents: true,
            users: true,
          },
        },
      },
    });

    if (!vessel) {
      return NextResponse.json(
        { success: false, error: "Navire non trouvé" },
        { status: 404 }
      );
    }

    // Delete related records first (cascade manually)
    await prisma.$transaction(async (tx) => {
      // Unlink users from the vessel (don't delete them)
      await tx.user.updateMany({
        where: { vesselId: id },
        data: { vesselId: null },
      });

      // Delete purchase requests (PRProducts will cascade delete automatically)
      await tx.purchaseRequest.deleteMany({
        where: { vesselId: id },
      });

      // Get all folders belonging to this vessel
      const vesselFolders = await tx.documentFolder.findMany({
        where: { vesselId: id },
        select: { id: true },
      });
      const folderIds = vesselFolders.map(f => f.id);

      // Delete documents linked directly to this vessel
      // First get document IDs
      const vesselDocuments = await tx.document.findMany({
        where: { vesselId: id },
        select: { id: true },
      });
      const vesselDocIds = vesselDocuments.map(d => d.id);

      // Delete notes and assignments for vessel documents
      if (vesselDocIds.length > 0) {
        await tx.fileNote.deleteMany({
          where: { documentId: { in: vesselDocIds } },
        });
        await tx.documentAssignment.deleteMany({
          where: { documentId: { in: vesselDocIds } },
        });
      }
      await tx.document.deleteMany({
        where: { vesselId: id },
      });

      // Delete documents inside folders belonging to this vessel
      if (folderIds.length > 0) {
        const folderDocuments = await tx.document.findMany({
          where: { folderId: { in: folderIds } },
          select: { id: true },
        });
        const folderDocIds = folderDocuments.map(d => d.id);

        if (folderDocIds.length > 0) {
          await tx.fileNote.deleteMany({
            where: { documentId: { in: folderDocIds } },
          });
          await tx.documentAssignment.deleteMany({
            where: { documentId: { in: folderDocIds } },
          });
        }
        await tx.document.deleteMany({
          where: { folderId: { in: folderIds } },
        });

        // Delete folder assignments
        await tx.folderAssignment.deleteMany({
          where: { folderId: { in: folderIds } },
        });
      }

      // Delete folders
      await tx.documentFolder.deleteMany({
        where: { vesselId: id },
      });

      // Finally delete the vessel
      await tx.vessel.delete({
        where: { id },
      });
    });

    return NextResponse.json({ success: true, message: "Navire et données associées supprimés" });
  } catch (error) {
    console.error("Error deleting vessel:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la suppression du navire" },
      { status: 500 }
    );
  }
}
