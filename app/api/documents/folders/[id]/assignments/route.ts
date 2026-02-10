import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Assignment = {
  id: string;
  folderId: string;
  targetType: string;
  targetId: string;
};

// GET folder assignments
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const assignments = await prisma.folderAssignment.findMany({
      where: { folderId: id },
    });

    // Enrich with target names
    const enrichedAssignments = await Promise.all(
      assignments.map(async (assignment: Assignment) => {
        let targetName = "Unknown";
        
        if (assignment.targetType === "vessel") {
          const vessel = await prisma.vessel.findUnique({
            where: { id: assignment.targetId },
            select: { name: true },
          });
          targetName = vessel?.name || "Unknown Vessel";
        } else if (assignment.targetType === "user") {
          const user = await prisma.user.findUnique({
            where: { id: assignment.targetId },
            select: { name: true },
          });
          targetName = user?.name || "Unknown User";
        } else if (assignment.targetType === "company") {
          targetName = "Company Internal";
        }

        return {
          type: assignment.targetType,
          targetId: assignment.targetId,
          targetName,
        };
      })
    );

    return NextResponse.json({ success: true, data: enrichedAssignments });
  } catch (error) {
    console.error("Error fetching folder assignments:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la récupération des assignations" },
      { status: 500 }
    );
  }
}

// POST add assignment to folder
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { type, targetId } = body;

    if (!type || !targetId) {
      return NextResponse.json(
        { success: false, error: "Type et cible requis" },
        { status: 400 }
      );
    }

    // Check if folder exists
    const folder = await prisma.documentFolder.findUnique({
      where: { id: id },
      select: { id: true },
    });

    if (!folder) {
      return NextResponse.json(
        { success: false, error: "Dossier non trouvé" },
        { status: 404 }
      );
    }

    // Check if assignment already exists
    const existingAssignment = await prisma.folderAssignment.findUnique({
      where: {
        folderId_targetType_targetId: {
          folderId: id,
          targetType: type,
          targetId: targetId,
        },
      },
    });

    if (existingAssignment) {
      return NextResponse.json(
        { success: false, error: "Cette assignation existe déjà" },
        { status: 400 }
      );
    }

    // Create assignment
    await prisma.folderAssignment.create({
      data: {
        folderId: id,
        targetType: type,
        targetId: targetId,
      },
    });

    // Get target name for response
    let targetName = "Unknown";
    if (type === "vessel") {
      const vessel = await prisma.vessel.findUnique({
        where: { id: targetId },
        select: { name: true },
      });
      targetName = vessel?.name || "Unknown Vessel";
    } else if (type === "user") {
      const user = await prisma.user.findUnique({
        where: { id: targetId },
        select: { name: true },
      });
      targetName = user?.name || "Unknown User";
    } else if (type === "company") {
      targetName = "Company Internal";
    }

    return NextResponse.json(
      { 
        success: true, 
        data: { type, targetId, targetName } 
      }, 
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating folder assignment:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: `Erreur lors de la création de l'assignation: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// DELETE remove assignment from folder
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const targetId = searchParams.get("targetId");

    if (!type || !targetId) {
      return NextResponse.json(
        { success: false, error: "Type et cible requis" },
        { status: 400 }
      );
    }

    await prisma.folderAssignment.deleteMany({
      where: {
        folderId: id,
        targetType: type,
        targetId: targetId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting folder assignment:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la suppression de l'assignation" },
      { status: 500 }
    );
  }
}
