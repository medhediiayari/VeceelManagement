import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET all permissions
export async function GET() {
  try {
    const permissions = await prisma.permission.findMany({
      orderBy: [{ module: "asc" }, { action: "asc" }],
    });

    // Group permissions by module
    const groupedPermissions = permissions.reduce((acc, perm) => {
      if (!acc[perm.module]) {
        acc[perm.module] = [];
      }
      acc[perm.module].push(perm);
      return acc;
    }, {} as Record<string, typeof permissions>);

    return NextResponse.json({ 
      success: true, 
      data: permissions,
      grouped: groupedPermissions,
    });
  } catch (error) {
    console.error("Error fetching permissions:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la récupération des permissions" },
      { status: 500 }
    );
  }
}
