import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get("q");

  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("products")
      .select("name, slug")
      .eq("status", "published")
      .ilike("name", `%${q}%`)
      .limit(5);

    return NextResponse.json(data ?? []);
  } catch {
    return NextResponse.json([]);
  }
}