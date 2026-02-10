import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { NextRequest } from "next/server";

// User role type
type UserRole = "ADMIN" | "CSO" | "DPA" | "OPS" | "FINANCE" | "COMPTABILITE" | "DIRECTION_TECHNIQUE" | "DIRECTION_GENERALE" | "CAPITAINE" | "CHIEF_MATE" | "CHEF_MECANICIEN" | "SECOND" | "YOTNA" | "COMMERCIAL";

// Salt rounds for bcrypt
const SALT_ROUNDS = 12;

// Vessel roles that require vessel-based filtering
export const VESSEL_ROLES: UserRole[] = ["CAPITAINE", "CHIEF_MATE", "CHEF_MECANICIEN", "SECOND", "YOTNA"];

// Check if a role is a vessel role
export function isVesselRole(role: string): boolean {
  return VESSEL_ROLES.includes(role as UserRole);
}

// Get current user from request
export async function getCurrentUser(request: NextRequest): Promise<{
  id: string;
  email: string;
  name: string;
  role: UserRole;
  vesselId: string | null;
} | null> {
  const token = request.cookies.get("session_token")?.value;
  if (!token) return null;
  
  const sessionResult = await validateSession(token);
  if (!sessionResult.valid || !sessionResult.user) return null;
  
  return sessionResult.user;
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

// Compare password with hash
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

// Authenticate user
export async function authenticateUser(
  email: string,
  password: string
): Promise<{
  success: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    vesselId: string | null;
  };
  error?: string;
}> {
  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        role: true,
        vesselId: true,
        status: true,
      },
    });

    if (!user) {
      return { success: false, error: "Utilisateur non trouvé" };
    }

    if (user.status !== 'ACTIVE') {
      return { success: false, error: "Compte désactivé" };
    }

    const isValid = await verifyPassword(password, user.password);

    if (!isValid) {
      return { success: false, error: "Mot de passe incorrect" };
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        vesselId: user.vesselId,
      },
    };
  } catch (error) {
    console.error("Authentication error:", error);
    return { success: false, error: "Erreur d'authentification" };
  }
}

// Create session for user
export async function createSession(
  userId: string,
  expiresInDays: number = 7
): Promise<string> {
  const token = generateSessionToken();
  const expires = new Date();
  expires.setDate(expires.getDate() + expiresInDays);

  await prisma.session.create({
    data: {
      userId,
      sessionToken: token,
      expires,
    },
  });

  return token;
}

// Validate session token
export async function validateSession(token: string): Promise<{
  valid: boolean;
  userId?: string;
  user?: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    vesselId: string | null;
  };
}> {
  const session = await prisma.session.findUnique({
    where: { sessionToken: token },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          vesselId: true,
          status: true,
        },
      },
    },
  });

  if (!session) {
    return { valid: false };
  }

  if (session.expires < new Date()) {
    // Session expired, delete it
    await prisma.session.delete({ where: { id: session.id } });
    return { valid: false };
  }

  if (session.user.status !== 'ACTIVE') {
    return { valid: false };
  }

  return {
    valid: true,
    userId: session.userId,
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
      vesselId: session.user.vesselId,
    },
  };
}

// Delete session (logout)
export async function deleteSession(token: string): Promise<void> {
  await prisma.session.deleteMany({
    where: { sessionToken: token },
  });
}

// Delete all sessions for user
export async function deleteAllUserSessions(userId: string): Promise<void> {
  await prisma.session.deleteMany({
    where: { userId },
  });
}

// Generate secure session token
function generateSessionToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 64; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Role-based authorization helpers
export function canAccessAdmin(role: UserRole): boolean {
  return role === "ADMIN";
}

export function canAccessCSO(role: UserRole): boolean {
  return role === "ADMIN" || role === "CSO";
}

export function canAccessVessel(role: UserRole): boolean {
  return role === "CAPITAINE" || role === "CHEF_MECANICIEN";
}

export function canCreatePurchaseRequest(role: UserRole): boolean {
  return role === "CAPITAINE" || role === "CHEF_MECANICIEN";
}

export function canApprovePurchaseRequest(role: UserRole): boolean {
  return role === "ADMIN";
}

export function canManageDocuments(role: UserRole): boolean {
  return role === "ADMIN" || role === "CSO";
}

export function canManageUsers(role: UserRole): boolean {
  return role === "ADMIN";
}

export function canManageVessels(role: UserRole): boolean {
  return role === "ADMIN";
}

// Get redirect path based on user role
export function getRedirectPath(role: UserRole): string {
  switch (role) {
    case "ADMIN":
      return "/dashboard";
    case "CSO":
      return "/cso";
    case "CAPITAINE":
      return "/capitaine";
    case "CHEF_MECANICIEN":
      return "/chef-mecanicien";
    default:
      return "/dashboard";
  }
}
