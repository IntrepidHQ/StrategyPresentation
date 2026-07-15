// ============================================================
//  SP Studio — Edit History API
//  apps/studio/src/app/api/edit-history/[id]/route.ts
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { isStudioAuthorized } from "@/lib/auth";
import { getEditHistory } from "@/lib/db";
import type { EditHistoryVM } from "@/lib/types";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  if (!isStudioAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const records = await getEditHistory(id);

  const edits: EditHistoryVM[] = records.map((r) => ({
    id: r.id,
    prompt: r.prompt,
    tokensUsed: r.tokens_used,
    createdAt: r.created_at,
  }));

  return NextResponse.json({ edits });
}
