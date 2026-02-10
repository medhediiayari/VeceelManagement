import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, isVesselRole } from "@/lib/auth";

// GET all document folders
export async function GET(request: NextRequest) {
  try {
    // Get current user for access control
    const currentUser = await getCurrentUser(request);
    
    // Build where clause for vessel role filtering
    let whereClause: Record<string, unknown> = {};
    if (currentUser && isVesselRole(currentUser.role) && currentUser.vesselId) {
      // Vessel roles can see folders that are either:
      // 1. Created specifically for their vessel (vesselId)
      // 2. Assigned to their vessel via FolderAssignment
      // 3. Assigned to the user specifically via FolderAssignment
      whereClause = {
        OR: [
          { vesselId: currentUser.vesselId },
          { 
            assignments: { 
              some: { 
                targetType: "vessel",
                targetId: currentUser.vesselId 
              } 
            } 
          },
          { 
            assignments: { 
              some: { 
                targetType: "user",
                targetId: currentUser.id 
              } 
            } 
          },
        ]
      };
    }
    
    const folders = await prisma.documentFolder.findMany({
      where: whereClause,
      include: {
        _count: {
          select: { documents: true },
        },
        createdBy: {
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
        assignments: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Fetch target names for assignments
    const formattedFolders = await Promise.all(folders.map(async (folder) => {
      const enrichedAssignments = await Promise.all(
        folder.assignments.map(async (assignment) => {
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

      return {
        id: folder.id,
        name: folder.name,
        color: folder.color,
        documentsCount: folder._count.documents,
        createdBy: folder.createdBy,
        createdByName: folder.createdByName,
        vesselId: folder.vesselId,
        vessel: folder.vessel,
        assignments: enrichedAssignments,
        createdAt: folder.createdAt,
        updatedAt: folder.updatedAt,
      };
    }));

    return NextResponse.json({ success: true, data: formattedFolders });
  } catch (error) {
    console.error("Error fetching folders:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la récupération des dossiers" },
      { status: 500 }
    );
  }
}

// POST create new folder
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, color, createdById, vesselId } = body;

    if (!name || !createdById) {
      return NextResponse.json(
        { success: false, error: "Nom et créateur requis" },
        { status: 400 }
      );
    }

    // Fetch user name to preserve it
    const user = await prisma.user.findUnique({
      where: { id: createdById },
      select: { name: true },
    });

    const folder = await prisma.documentFolder.create({
      data: {
        name,
        color: color || "#3b82f6",
        createdById,
        createdByName: user?.name || null,
        vesselId: vesselId || null,
      },
      include: {
        createdBy: {
          select: { name: true },
        },
        vessel: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: folder }, { status: 201 });
  } catch (error) {
    console.error("Error creating folder:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la création du dossier" },
      { status: 500 }
    );
  }
}
