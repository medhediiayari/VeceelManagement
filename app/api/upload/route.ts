import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: "Aucun fichier fourni" },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), "public", "uploads", "products");
    await mkdir(uploadDir, { recursive: true });

    const uploadedUrls: string[] = [];

    for (const file of files) {
      // Validate file type
      const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
      if (!validTypes.includes(file.type)) {
        continue; // Skip invalid files
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 8);
      const extension = file.name.split(".").pop() || "jpg";
      const filename = `${timestamp}-${randomId}.${extension}`;

      // Write file
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filePath = path.join(uploadDir, filename);
      await writeFile(filePath, buffer);

      // Add URL to result
      uploadedUrls.push(`/uploads/products/${filename}`);
    }

    if (uploadedUrls.length === 0) {
      return NextResponse.json(
        { success: false, error: "Aucune image valide trouvée" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, urls: uploadedUrls });
  } catch (error) {
    console.error("Error uploading files:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de l'upload des fichiers" },
      { status: 500 }
    );
  }
}
