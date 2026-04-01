import { Request, Response, NextFunction } from "express";

const SUPABASE_URL = "https://azxhcalksgudjemwjekd.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." +
  "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6eGhjYWxrc2d1ZGplbXdqZWtkIiwi" +
  "cm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MDIwNzQsImV4cCI6MjA5MDE3ODA3NH0." +
  "8W-p9qUIxiVoD1452BDb8iIYrSScM9RbfRqMLtTRS58";

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers["authorization"];
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid Authorization header" });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: SUPABASE_ANON_KEY,
      },
    });

    if (!response.ok) {
      res.status(401).json({ error: "Invalid or expired token" });
      return;
    }

    const user = (await response.json()) as { id: string };
    req.userId = user.id;
    next();
  } catch {
    res.status(401).json({ error: "Token validation failed" });
  }
}
