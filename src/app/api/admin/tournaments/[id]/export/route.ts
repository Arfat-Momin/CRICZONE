import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";

/**
 * GET /api/admin/tournaments/[id]/export
 * Streams a CSV of all players for a tournament. Admin-only.
 */
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  // Auth guard
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const supabase = await createClient();

  const { data: tournament } = await supabase
    .from("tournaments")
    .select("name, slug")
    .eq("id", id)
    .maybeSingle();

  if (!tournament) {
    return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
  }

  const [playersRes, teamsRes, contactsRes] = await Promise.all([
    supabase.from("players").select("*").eq("tournament_id", id),
    supabase.from("teams").select("id, team_name").eq("tournament_id", id),
    supabase
      .from("player_contacts")
      .select("player_id, mobile_no")
      .eq("tournament_id", id),
  ]);

  const teamMap = new Map<string, string>();
  for (const t of teamsRes.data ?? []) teamMap.set(t.id, t.team_name);

  const mobileMap = new Map<string, string>();
  for (const c of contactsRes.data ?? []) mobileMap.set(c.player_id, c.mobile_no);

  const headers = [
    "Player ID",
    "Full Name",
    "First Name",
    "Surname",
    "Mobile",
    "Jersey No",
    "Jersey Size",
    "Category",
    "Current Team",
    "Status",
    "Base Price",
    "Selling Price",
    "Sold To Team",
    "Registered At",
  ];

  const lines: string[] = [headers.map(csvEscape).join(",")];

  const sortedPlayers = [...(playersRes.data ?? [])].sort((a, b) =>
    a.full_name.localeCompare(b.full_name),
  );

  for (const p of sortedPlayers) {
    const teamName =
      p.sold_to_team_id ? teamMap.get(p.sold_to_team_id) ?? "" : "";
    const row: unknown[] = [
      p.id,
      p.full_name,
      p.first_name ?? "",
      p.surname ?? "",
      mobileMap.get(p.id) ?? "",
      p.jersey_no ?? "",
      p.jersey_size ?? "",
      p.category ?? "",
      p.current_team ?? "",
      p.status,
      p.base_price,
      p.selling_price ?? 0,
      teamName,
      p.registered_at,
    ];
    lines.push(row.map(csvEscape).join(","));
  }

  const csv = "\uFEFF" + lines.join("\r\n");
  const safeName = tournament.name.replace(/[^a-zA-Z0-9_-]/g, "_");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${safeName}_players.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return '""';
  const s = String(v).replace(/"/g, '""');
  return `"${s}"`;
}