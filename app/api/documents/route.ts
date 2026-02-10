import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, isVesselRole } from "@/lib/auth";

// GET all documents
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get("folderId");
    const vesselId = searchParams.get("vesselId");
    
    // Get current user for access control
    const currentUser = await getCurrentUser(request);

    let whereClause: Record<string, unknown> = {};
    if (folderId) whereClause.folderId = folderId;
    if (vesselId) whereClause.vesselId = vesselId;
    
    // Vessel roles can see documents that are either:
    // 1. In folders they can access (folder assigned to their vessel or user)
    // 2. Have their vessel as vesselId  
    // 3. Have document assignments for their vessel/user
    if (currentUser && isVesselRole(currentUser.role) && currentUser.vesselId) {
      whereClause = {
        OR: [
          { vesselId: currentUser.vesselId },
          { 
            folder: {
              OR: [
                { vesselId: currentUser.vesselId },
                { assignments: { some: { targetType: "vessel", targetId: currentUser.vesselId } } },
                { assignments: { some: { targetType: "user", targetId: currentUser.id } } },
              ]
            }
          },
          { assignments: { some: { targetType: "vessel", targetId: currentUser.vesselId } } },
          { assignments: { some: { targetType: "user", targetId: currentUser.id } } },
        ],
        ...(folderId && { folderId }),
      };
    }

    const documents = await prisma.document.findMany({
      where: whereClause,
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
          },
        },
        folder: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        vessel: {
          select: {
            id: true,
            name: true,
          },
        },
        notes: true,
        assignments: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Format to match the frontend expectations with enriched assignments
    const formattedDocuments = await Promise.all(documents.map(async (doc) => {
      const enrichedAssignments = await Promise.all(
        doc.assignments.map(async (assignment) => {
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
        id: doc.id,
        name: doc.name,
        type: doc.type,
        mimeType: doc.mimeType,
        size: doc.size,
        path: doc.path,
        url: doc.path, // URL for preview - same as path for file access
        status: doc.status,
        expirationDate: doc.expirationDate,
        spreadsheetData: doc.spreadsheetData,
        folderId: doc.folderId,
        folder: doc.folder,
        uploadedBy: doc.uploadedBy,
        uploadedAt: doc.createdAt,
        vessel: doc.vessel,
        notes: doc.notes,
        assignments: enrichedAssignments,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      };
    }));

    return NextResponse.json({ success: true, data: formattedDocuments });
  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la récupération des documents" },
      { status: 500 }
    );
  }
}

// POST create new document
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, type, mimeType, size, path, folderId, vesselId, uploadedById, status, expirationDate, spreadsheetData } = body;

    if (!name || !type || !mimeType || !path || !folderId || !uploadedById) {
      return NextResponse.json(
        { success: false, error: "Nom, type, mimeType, chemin, dossier et créateur requis" },
        { status: 400 }
      );
    }

    const document = await prisma.document.create({
      data: {
        name,
        type,
        mimeType,
        size: typeof size === 'number' ? size : parseInt(size) || 0,
        path,
        folderId,
        vesselId: vesselId || null,
        uploadedById,
        status: status || "ACTIVE",
        expirationDate: expirationDate ? new Date(expirationDate) : null,
        // Note: spreadsheetData will work after running: npx prisma generate
      },
      include: {
        uploadedBy: {
          select: { id: true, name: true },
        },
        folder: {
          select: { id: true, name: true, color: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: document }, { status: 201 });
  } catch (error) {
    console.error("Error creating document:", error);
    const errorMessage = error instanceof Error ? error.message : "Erreur lors de la création du document";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
