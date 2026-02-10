import { NextRequest, NextResponse } from "next/server";
import { validateSession, getRedirectPath } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("session_token")?.value;

    if (!token) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      );
    }

    const sessionResult = await validateSession(token);

    if (!sessionResult.valid || !sessionResult.user) {
      // Clear invalid cookie
      const response = NextResponse.json(
        { authenticated: false },
        { status: 401 }
      );
      response.cookies.set("session_token", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 0,
        path: "/",
      });
      return response;
    }

    // Get full user data with vessel
    const user = await prisma.user.findUnique({
      where: { id: sessionResult.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        vesselId: true,
        vessel: {
          select: {
            id: true,
            name: true,
            imo: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      user,
      redirectPath: getRedirectPath(user.role),
    });
  } catch (error) {
    console.error("Session check error:", error);
    return NextResponse.json(
      { authenticated: false, error: "Erreur de session" },
      { status: 500 }
    );
  }
}
