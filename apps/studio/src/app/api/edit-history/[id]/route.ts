import { NextRequest, NextResponse } from "next/server";
import { getEditHistory } from "@/lib/db";
import type { EditHistoryVM } from "@/lib/types";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const auth = req.headers.get("x-studio-passphrase");
  if (auth !== process.env.STUDIO_PASSPHRASE) {
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
