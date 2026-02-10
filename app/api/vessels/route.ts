import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET all vessels
export async function GET() {
  try {
    const vessels = await prisma.vessel.findMany({
      include: {
        _count: {
          select: { users: true, purchaseRequests: true, documents: true },
        },
        users: {
          where: { role: "CAPITAINE" },
          select: { name: true },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedVessels = vessels.map((vessel) => ({
      id: vessel.id,
      name: vessel.name,
      imo: vessel.imo,
      flag: vessel.flag,
      type: vessel.type,
      grossTonnage: vessel.grossTonnage,
      status: vessel.status,
      captain: vessel.users[0]?.name || "Non assigné",
      usersCount: vessel._count.users,
      purchaseRequestsCount: vessel._count.purchaseRequests,
      documentsCount: vessel._count.documents,
      createdAt: vessel.createdAt,
      updatedAt: vessel.updatedAt,
    }));

    return NextResponse.json({ success: true, data: formattedVessels });
  } catch (error) {
    console.error("Error fetching vessels:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la récupération des navires" },
      { status: 500 }
    );
  }
}

// POST create new vessel
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, imo, flag, type, grossTonnage, status } = body;

    if (!name || !imo) {
      return NextResponse.json(
        { success: false, error: "Nom et numéro IMO requis" },
        { status: 400 }
      );
    }

    // Check if IMO already exists
    const existingVessel = await prisma.vessel.findUnique({
      where: { imo },
    });

    if (existingVessel) {
      return NextResponse.json(
        { success: false, error: "Ce numéro IMO existe déjà" },
        { status: 400 }
      );
    }

    const vessel = await prisma.vessel.create({
      data: {
        name,
        imo,
        flag: flag || null,
        type: type || null,
        grossTonnage: grossTonnage ? parseFloat(grossTonnage) : null,
        status: status || "ACTIVE",
      },
    });

    return NextResponse.json({ success: true, data: vessel }, { status: 201 });
  } catch (error) {
    console.error("Error creating vessel:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la création du navire" },
      { status: 500 }
    );
  }
}
