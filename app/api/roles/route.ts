import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET all roles
export async function GET() {
  try {
    const roles = await prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: {
              select: {
                id: true,
                name: true,
                description: true,
                module: true,
                action: true,
              },
            },
          },
        },
        _count: {
          select: { permissions: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedRoles = roles.map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: role.permissions.map((rp) => rp.permission),
      permissionsCount: role._count.permissions,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    }));

    return NextResponse.json({ success: true, data: formattedRoles });
  } catch (error) {
    console.error("Error fetching roles:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la récupération des rôles" },
      { status: 500 }
    );
  }
}

// POST create new role
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, permissionIds } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: "Nom du rôle requis" },
        { status: 400 }
      );
    }

    const role = await prisma.role.create({
      data: {
        name,
        description: description || null,
        permissions: permissionIds && permissionIds.length > 0
          ? {
              create: permissionIds.map((permId: string) => ({
                permission: { connect: { id: permId } },
              })),
            }
          : undefined,
      },
      include: {
        permissions: {
          include: {
            permission: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    return NextResponse.json({ 
      success: true, 
      data: {
        ...role,
        permissions: role.permissions.map((rp) => rp.permission),
      }
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating role:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la création du rôle" },
      { status: 500 }
    );
  }
}
