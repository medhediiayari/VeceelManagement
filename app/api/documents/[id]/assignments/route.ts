import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET document assignments
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const assignments = await prisma.documentAssignment.findMany({
      where: { documentId: id },
    });

    // Enrich with target names
    const enrichedAssignments = await Promise.all(
      assignments.map(async (assignment) => {
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
    console.error("Error fetching document assignments:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la récupération des assignations" },
      { status: 500 }
    );
  }
}

// POST add assignment to document
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

    // Check if assignment already exists
    const existingAssignment = await prisma.documentAssignment.findUnique({
      where: {
        documentId_targetType_targetId: {
          documentId: id,
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
    await prisma.documentAssignment.create({
      data: {
        documentId: id,
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
    console.error("Error creating document assignment:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la création de l'assignation" },
      { status: 500 }
    );
  }
}

// DELETE remove assignment from document
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

    await prisma.documentAssignment.deleteMany({
      where: {
        documentId: id,
        targetType: type,
        targetId: targetId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting document assignment:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la suppression de l'assignation" },
      { status: 500 }
    );
  }
}
