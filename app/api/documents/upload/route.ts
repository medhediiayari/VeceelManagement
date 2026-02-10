import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

// Helper to determine file type from mime type
function getFileTypeFromMime(mimeType: string): string {
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.startsWith("image/")) return "image";
  if (
    mimeType.includes("spreadsheet") ||
    mimeType.includes("excel") ||
    mimeType === "text/csv"
  )
    return "excel";
  if (mimeType.includes("word") || mimeType.includes("document")) return "word";
  return "other";
}

// POST upload file
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folderId = formData.get("folderId") as string;
    const uploadedById = formData.get("uploadedById") as string;
    const vesselId = formData.get("vesselId") as string | null;

    if (!file || !folderId || !uploadedById) {
      return NextResponse.json(
        { success: false, error: "Fichier, dossier et créateur requis" },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const uniqueFilename = `${timestamp}_${sanitizedName}`;
    const filePath = path.join(uploadsDir, uniqueFilename);
    const publicPath = `/uploads/${uniqueFilename}`;

    // Write file to disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Fetch user name to preserve it
    const user = await prisma.user.findUnique({
      where: { id: uploadedById },
      select: { name: true },
    });

    // Get folder to inherit vesselId if not provided
    const folder = await prisma.documentFolder.findUnique({
      where: { id: folderId },
      select: { vesselId: true },
    });
    
    // Use provided vesselId or inherit from folder
    const documentVesselId = vesselId || folder?.vesselId || null;

    // Create document record in database
    const document = await prisma.document.create({
      data: {
        name: file.name,
        type: getFileTypeFromMime(file.type),
        mimeType: file.type,
        size: file.size,
        path: publicPath,
        folderId,
        vesselId: documentVesselId,
        uploadedById,
        uploadedByName: user?.name || null,
        status: "ACTIVE",
      },
      include: {
        uploadedBy: {
          select: { id: true, name: true },
        },
        folder: {
          select: { id: true, name: true, color: true },
        },
        notes: true,
      },
    });

    // Format response to match frontend expectations
    const formattedDocument = {
      id: document.id,
      name: document.name,
      type: document.type,
      mimeType: document.mimeType,
      size: document.size,
      path: document.path,
      folderId: document.folderId,
      folder: document.folder,
      uploadedBy: document.uploadedBy?.name || "Unknown",
      uploadedAt: document.createdAt,
      notes: document.notes,
    };

    return NextResponse.json(
      { success: true, data: formattedDocument },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error uploading document:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Erreur lors de l'upload du document";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
