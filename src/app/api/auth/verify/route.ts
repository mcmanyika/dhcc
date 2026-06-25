import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  const admin = await verifyAdminToken(
    request.headers.get("authorization")
  );

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ authorized: true, email: admin.email });
}
