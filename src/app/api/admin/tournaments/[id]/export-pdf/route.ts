import { NextResponse, type NextRequest } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";

export const runtime = "nodejs";

/**
 * GET /api/admin/tournaments/[id]/export-pdf
 * Streams a PDF of final squads for the tournament. Admin-only.
 */
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const supabase = await createClient();

  const { data: tournament } = await supabase
    .from("tournaments")
    .select("name, venue, auction_start_at, status")
    .eq("id", id)
    .maybeSingle();

  if (!tournament) {
    return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
  }

  const [teamsRes, playersRes] = await Promise.all([
    supabase
      .from("teams")
      .select("id, team_name, captain_name, points_remaining, max_players")
      .eq("tournament_id", id)
      .order("team_name", { ascending: true }),
    supabase
      .from("players")
      .select("id, full_name, category, sold_to_team_id, selling_price, status")
      .eq("tournament_id", id),
  ]);

  const teams = teamsRes.data ?? [];
  const players = playersRes.data ?? [];

  // ---------- Build PDF ----------
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold);

  const A4_W = 595;
  const A4_H = 842;
  const MARGIN = 40;
  const FOREST = rgb(0.106, 0.263, 0.196);
  const GREEN = rgb(0.176, 0.416, 0.31);
  const RED = rgb(0.757, 0.071, 0.122);
  const GRAY = rgb(0.35, 0.35, 0.35);
  const LIGHT = rgb(0.85, 0.85, 0.85);

  let page = pdf.addPage([A4_W, A4_H]);
  let y = A4_H - MARGIN;

  function sanitize(s: string): string {
    return s.replace(/[^\x20-\x7E\u00A0-\u00FF]/g, "");
  }

  function ensureSpace(needed: number) {
    if (y - needed < MARGIN + 20) {
      page = pdf.addPage([A4_W, A4_H]);
      y = A4_H - MARGIN;
    }
  }

  // Title
  page.drawText("CRICZONE", {
    x: MARGIN,
    y,
    size: 22,
    font: boldFont,
    color: FOREST,
  });
  y -= 26;
  page.drawText(sanitize(tournament.name), {
    x: MARGIN,
    y,
    size: 14,
    font: boldFont,
    color: GREEN,
  });
  y -= 18;

  const metaParts: string[] = [];
  if (tournament.venue) metaParts.push(`Venue: ${tournament.venue}`);
  if (tournament.auction_start_at) {
    const d = new Date(tournament.auction_start_at);
    metaParts.push(`Date: ${d.toLocaleDateString()}`);
  }
  metaParts.push(`Status: ${tournament.status}`);
  page.drawText(sanitize(metaParts.join(" · ")), {
    x: MARGIN,
    y,
    size: 9,
    font,
    color: GRAY,
  });
  y -= 10;
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: A4_W - MARGIN, y },
    thickness: 1,
    color: LIGHT,
  });
  y -= 24;

  // Totals
  const totalSold = players.filter((p) => p.status === "sold").length;
  const totalSpent = players
    .filter((p) => p.status === "sold")
    .reduce((sum, p) => sum + (p.selling_price ?? 0), 0);
  page.drawText(
    sanitize(
      `Teams: ${teams.length}  ·  Sold players: ${totalSold}  ·  Total spent: ${totalSpent} pts`,
    ),
    { x: MARGIN, y, size: 10, font: boldFont, color: FOREST },
  );
  y -= 26;

  if (teams.length === 0) {
    page.drawText("No teams configured for this tournament.", {
      x: MARGIN,
      y,
      size: 11,
      font,
      color: GRAY,
    });
  } else {
    for (const team of teams) {
      ensureSpace(60);

      // Team header
      page.drawText(sanitize(team.team_name), {
        x: MARGIN,
        y,
        size: 13,
        font: boldFont,
        color: FOREST,
      });
      y -= 16;

      const subParts: string[] = [];
      if (team.captain_name) subParts.push(`Captain: ${team.captain_name}`);
      subParts.push(`Points left: ${team.points_remaining}`);
      page.drawText(sanitize(subParts.join("  ·  ")), {
        x: MARGIN,
        y,
        size: 9,
        font,
        color: GRAY,
      });
      y -= 16;

      const squad = players
        .filter((p) => p.sold_to_team_id === team.id)
        .sort((a, b) => (b.selling_price ?? 0) - (a.selling_price ?? 0));

      if (squad.length === 0) {
        page.drawText("- No players purchased -", {
          x: MARGIN + 10,
          y,
          size: 10,
          font,
          color: GRAY,
        });
        y -= 14;
      } else {
        for (let i = 0; i < squad.length; i++) {
          const p = squad[i];
          if (!p) continue;
          ensureSpace(16);

          const line = `${i + 1}. ${p.full_name}${
            p.category ? `  (${p.category})` : ""
          }`;
          page.drawText(sanitize(line), {
            x: MARGIN + 10,
            y,
            size: 10,
            font,
            color: rgb(0.15, 0.15, 0.15),
          });

          const priceText = `${p.selling_price ?? 0} pts`;
          page.drawText(priceText, {
            x: A4_W - MARGIN - 60,
            y,
            size: 10,
            font: boldFont,
            color: RED,
          });
          y -= 14;
        }
      }

      y -= 10;
      // Separator
      ensureSpace(4);
      page.drawLine({
        start: { x: MARGIN, y },
        end: { x: A4_W - MARGIN, y },
        thickness: 0.5,
        color: LIGHT,
      });
      y -= 22;
    }
  }

  // Footer on each page
  const pages = pdf.getPages();
  const totalPages = pages.length;
  pages.forEach((p, idx) => {
    p.drawText(
      sanitize(`Generated by CRICZONE · Page ${idx + 1} of ${totalPages}`),
      {
        x: MARGIN,
        y: 20,
        size: 8,
        font,
        color: GRAY,
      },
    );
  });

  const bytes = await pdf.save();
  const safeName = tournament.name.replace(/[^a-zA-Z0-9_-]/g, "_");

  return new NextResponse(new Uint8Array(bytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeName}_squads.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}