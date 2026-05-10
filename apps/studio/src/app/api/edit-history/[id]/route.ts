// ============================================================
//  SP Studio — Edit History API
//  apps/studio/src/app/api/edit-history/[id]/route.ts
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getEditHistory } from "@/lib/db";
import type { EditHistoryVM } from "@/lib/types";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const auth = req.headers.get("x-studio-passphrase");
  if (auth !== process.env.STUDIO_PASSPHRASE) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const records = await getEditHistory(params.id);

  const edits: EditHistoryVM[] = records.map((r) => ({
    id: r.id,
    prompt: r.prompt,
    tokensUsed: r.tokens_used,
    createdAt: r.created_at,
  }));

  return NextResponse.json({ edits });
}
