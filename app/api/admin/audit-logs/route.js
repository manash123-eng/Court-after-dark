import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import AuditLog from "@/models/AuditLog";
import { getSessionUser } from "@/lib/auth";

export async function GET(request) {
  const session = getSessionUser();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }
  await connectDB();

  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");
  const entityType = searchParams.get("entityType");
  const limit = parseInt(searchParams.get("limit") || "100", 10);

  const query = {};
  if (action && action !== "All") query.action = action;
  if (entityType && entityType !== "All") query.entityType = entityType;

  const logs = await AuditLog.find(query)
    .sort({ createdAt: -1 })
    .limit(limit);

  return NextResponse.json({ logs });
}
