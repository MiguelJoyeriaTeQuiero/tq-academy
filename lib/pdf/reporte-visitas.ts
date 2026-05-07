import { jsPDF } from "jspdf";

// ── Brand colors [R, G, B] ─────────────────────────────────────────────────
type RGB = [number, number, number];
const C: Record<string, RGB> = {
  ink:   [0, 85, 127],
  deep:  [0, 59, 88],
  sky:   [0, 153, 242],
  gold:  [200, 161, 100],
  gold2: [139, 106, 53],
  cream: [232, 227, 223],
  paper: [244, 241, 237],
  white: [255, 255, 255],
  gray:  [100, 100, 100],
  lgray: [200, 200, 200],
  ok:    [16, 185, 129],
  inc:   [217, 119, 6],
  na:    [148, 163, 184],
  red:   [220, 38, 38],
};

const PW = 210;   // page width mm
const PH = 297;   // page height mm
const ML = 18;    // left margin
const MR = 18;    // right margin
const MB = 14;    // bottom margin
const CW = PW - ML - MR; // content width = 174mm

function fc(doc: jsPDF, c: RGB) { doc.setFillColor(c[0], c[1], c[2]); }
function tc(doc: jsPDF, c: RGB) { doc.setTextColor(c[0], c[1], c[2]); }
function dc(doc: jsPDF, c: RGB) { doc.setDrawColor(c[0], c[1], c[2]); }

function fmt(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

// ── Page header (drawn on every page) ─────────────────────────────────────
function drawHeader(doc: jsPDF, sub = ""): void {
  fc(doc, C.deep);
  doc.rect(0, 0, PW, 15, "F");
  fc(doc, C.gold);
  doc.rect(0, 15, PW, 1, "F");

  tc(doc, C.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("TQ ACADEMY · Joyería Te Quiero", ML, 7);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text("Gestión de Visitas a Tienda", ML, 12);

  if (sub) {
    doc.setTextColor(200, 220, 235);
    doc.setFontSize(7);
    doc.text(sub, PW - MR, 9, { align: "right" });
  }
}

// ── Page footer ────────────────────────────────────────────────────────────
function drawFooter(doc: jsPDF, page: number): void {
  dc(doc, C.lgray);
  doc.setLineWidth(0.25);
  doc.line(ML, PH - 11, PW - MR, PH - 11);
  tc(doc, C.lgray);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text("TQ Academy · Joyería Te Quiero", ML, PH - 6);
  doc.text(`Pág. ${page}`, PW - MR, PH - 6, { align: "right" });
}

// ── KPI box ────────────────────────────────────────────────────────────────
function kpiBox(
  doc: jsPDF,
  x: number, y: number, w: number, h: number,
  label: string, value: string, accent: RGB,
): void {
  fc(doc, C.paper);
  doc.rect(x, y, w, h, "F");
  fc(doc, accent);
  doc.rect(x, y, 2.5, h, "F");

  tc(doc, accent);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(value, x + w / 2, y + h * 0.5, { align: "center", baseline: "middle" });

  tc(doc, C.gray);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.text(label.toUpperCase(), x + w / 2, y + h - 3.5, { align: "center" });
}

// ══════════════════════════════════════════════════════════════════════════
// REPORTE GENERAL
// ══════════════════════════════════════════════════════════════════════════

export interface ReporteGeneralData {
  desde: string;
  hasta: string;
  generado_en: string;
  stats: {
    total_visitas: number;
    completadas: number;
    en_curso: number;
    tiendas_visitadas: number;
    total_incidencias: number;
    pct_ok_global: number | null;
  };
  por_tienda: {
    nombre: string;
    isla: string;
    total_visitas: number;
    completadas: number;
    pct_ok_promedio: number | null;
    total_incidencias: number;
    ultima_visita: string | null;
    seguimientos_pendientes: number;
  }[];
  top_incidencias: { item_texto: string; count: number }[];
}

export function generarReporteGeneral(data: ReporteGeneralData): ArrayBuffer {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const sub = `${fmt(data.desde)} — ${fmt(data.hasta)}`;

  drawHeader(doc);
  let y = 23;

  // Title
  tc(doc, C.ink);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Informe de Visitas a Tienda", ML, y);
  y += 8;
  tc(doc, C.gray);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Resumen global · ${sub}`, ML, y);
  y += 5;
  doc.setFontSize(7.5);
  doc.text(`Generado: ${new Date(data.generado_en).toLocaleString("es-ES")}`, ML, y);
  y += 8;

  // Gold separator
  fc(doc, C.gold);
  doc.rect(ML, y, CW, 0.7, "F");
  y += 7;

  // KPI row (4 boxes)
  const kw = (CW - 12) / 4;
  const kh = 22;
  const kg = 4;
  kpiBox(doc, ML + 0 * (kw + kg), y, kw, kh, "Total visitas",    String(data.stats.total_visitas),      C.ink);
  kpiBox(doc, ML + 1 * (kw + kg), y, kw, kh, "Tiendas visitadas", String(data.stats.tiendas_visitadas),  C.sky);
  kpiBox(doc, ML + 2 * (kw + kg), y, kw, kh, "Incidencias",       String(data.stats.total_incidencias),  data.stats.total_incidencias > 0 ? C.inc : C.ok);
  kpiBox(doc, ML + 3 * (kw + kg), y, kw, kh, "% OK global",
    data.stats.pct_ok_global !== null ? `${Math.round(data.stats.pct_ok_global)}%` : "—",
    data.stats.pct_ok_global === null ? C.gray
      : data.stats.pct_ok_global >= 80 ? C.ok
      : C.inc,
  );
  y += kh + 10;

  // ── Stores table ───────────────────────────────────────────────────────
  // col widths must sum to CW = 174
  const COLS = [46, 22, 16, 18, 20, 26, 26];
  const HDRS = ["Tienda", "Isla", "Visitas", "% OK", "Incidencias", "Última visita", "Seguimiento"];
  const ROW_H = 7.5;

  function tableHeader() {
    fc(doc, C.ink);
    doc.rect(ML, y, CW, ROW_H, "F");
    tc(doc, C.white);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    let x = ML + 2;
    HDRS.forEach((h, i) => { doc.text(h, x, y + 5); x += COLS[i]; });
    y += ROW_H;
  }

  tableHeader();

  data.por_tienda.forEach((t, idx) => {
    if (y + ROW_H > PH - MB - 12) {
      drawFooter(doc, doc.getNumberOfPages());
      doc.addPage();
      drawHeader(doc, sub);
      y = 25;
      tableHeader();
    }

    fc(doc, idx % 2 === 0 ? C.paper : C.white);
    doc.rect(ML, y, CW, ROW_H, "F");
    dc(doc, C.cream);
    doc.setLineWidth(0.2);
    doc.line(ML, y + ROW_H, ML + CW, y + ROW_H);

    const vals = [
      t.nombre.length > 24 ? t.nombre.slice(0, 22) + "…" : t.nombre,
      t.isla.length > 12   ? t.isla.slice(0, 10)   + "…" : t.isla,
      String(t.total_visitas),
      t.pct_ok_promedio !== null ? `${Math.round(t.pct_ok_promedio)}%` : "—",
      String(t.total_incidencias),
      t.ultima_visita ? fmt(t.ultima_visita) : "—",
      t.seguimientos_pendientes > 0 ? `${t.seguimientos_pendientes} pend.` : "—",
    ];

    let x = ML + 2;
    vals.forEach((v, i) => {
      tc(doc, C.ink);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      if (i === 3 && t.pct_ok_promedio !== null) {
        tc(doc, t.pct_ok_promedio >= 80 ? C.ok : t.pct_ok_promedio >= 60 ? C.inc : C.red);
        doc.setFont("helvetica", "bold");
      } else if (i === 4 && t.total_incidencias > 0) {
        tc(doc, C.inc);
      } else if (i === 6 && t.seguimientos_pendientes > 0) {
        tc(doc, C.gold2);
        doc.setFont("helvetica", "bold");
      }
      doc.text(v, x, y + 5);
      x += COLS[i];
    });
    y += ROW_H;
  });

  y += 10;

  // ── Top incidencias ────────────────────────────────────────────────────
  if (data.top_incidencias.length > 0) {
    if (y + 50 > PH - MB - 12) {
      drawFooter(doc, doc.getNumberOfPages());
      doc.addPage();
      drawHeader(doc, sub);
      y = 25;
    }

    tc(doc, C.ink);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Incidencias más frecuentes", ML, y);
    y += 4;
    fc(doc, C.gold);
    doc.rect(ML, y, CW, 0.5, "F");
    y += 6;

    data.top_incidencias.slice(0, 10).forEach((inc, i) => {
      if (y + 8 > PH - MB - 12) {
        drawFooter(doc, doc.getNumberOfPages());
        doc.addPage();
        drawHeader(doc, sub);
        y = 25;
      }

      fc(doc, i % 2 === 0 ? C.paper : C.white);
      doc.rect(ML, y - 1, CW, 8, "F");

      // Rank badge
      fc(doc, C.inc);
      doc.rect(ML, y - 1, 8, 8, "F");
      tc(doc, C.white);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.text(String(i + 1), ML + 4, y + 3, { align: "center", baseline: "middle" });

      // Text
      tc(doc, C.ink);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      const label = inc.item_texto.length > 72 ? inc.item_texto.slice(0, 70) + "…" : inc.item_texto;
      doc.text(label, ML + 12, y + 3, { baseline: "middle" });

      // Count
      tc(doc, C.inc);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text(`${inc.count}×`, PW - MR, y + 3, { align: "right", baseline: "middle" });

      y += 8;
    });
  }

  drawFooter(doc, doc.getNumberOfPages());
  return doc.output("arraybuffer") as ArrayBuffer;
}

// ══════════════════════════════════════════════════════════════════════════
// REPORTE POR TIENDA
// ══════════════════════════════════════════════════════════════════════════

export interface ReporteTiendaData {
  tienda: { nombre: string; isla: string };
  desde: string;
  hasta: string;
  generado_en: string;
  stats: {
    total_visitas: number;
    completadas: number;
    total_incidencias: number;
    pct_ok_promedio: number | null;
  };
  visitas: {
    fecha_visita: string;
    estado: string;
    plantilla_nombre: string;
    notas_generales: string | null;
    requiere_seguimiento: boolean;
    proxima_visita: string | null;
    stats: {
      ok: number;
      incidencias: number;
      no_aplica: number;
      sin_responder: number;
      total: number;
      pct_ok: number | null;
    };
    secciones: {
      nombre: string;
      items: { texto: string; estado: string | null; notas: string | null }[];
    }[];
  }[];
}

export function generarReporteTienda(data: ReporteTiendaData): ArrayBuffer {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const sub = `${data.tienda.nombre} · ${fmt(data.desde)} — ${fmt(data.hasta)}`;

  drawHeader(doc);
  let y = 23;

  // Title block
  tc(doc, C.ink);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Informe de Visitas a Tienda", ML, y);
  y += 9;
  doc.setFontSize(13);
  doc.text(data.tienda.nombre, ML, y);
  y += 7;
  tc(doc, C.gray);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`${data.tienda.isla} · Periodo: ${fmt(data.desde)} — ${fmt(data.hasta)}`, ML, y);
  y += 5;
  doc.setFontSize(7.5);
  doc.text(`Generado: ${new Date(data.generado_en).toLocaleString("es-ES")}`, ML, y);
  y += 8;

  fc(doc, C.gold);
  doc.rect(ML, y, CW, 0.7, "F");
  y += 7;

  // KPI row (4 boxes)
  const kw = (CW - 9) / 4;
  const kh = 20;
  const kg = 3;
  kpiBox(doc, ML + 0 * (kw + kg), y, kw, kh, "Visitas",       String(data.stats.total_visitas),      C.ink);
  kpiBox(doc, ML + 1 * (kw + kg), y, kw, kh, "Completadas",   String(data.stats.completadas),         C.ok);
  kpiBox(doc, ML + 2 * (kw + kg), y, kw, kh, "Incidencias",   String(data.stats.total_incidencias),
    data.stats.total_incidencias > 0 ? C.inc : C.ok);
  kpiBox(doc, ML + 3 * (kw + kg), y, kw, kh, "% OK promedio",
    data.stats.pct_ok_promedio !== null ? `${Math.round(data.stats.pct_ok_promedio)}%` : "—",
    data.stats.pct_ok_promedio === null ? C.gray
      : data.stats.pct_ok_promedio >= 80 ? C.ok
      : C.inc,
  );
  y += kh + 10;

  if (data.visitas.length === 0) {
    tc(doc, C.gray);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("No hay visitas registradas en el periodo seleccionado.", ML, y);
    drawFooter(doc, 1);
    return doc.output("arraybuffer") as ArrayBuffer;
  }

  tc(doc, C.ink);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(`Detalle de visitas (${data.visitas.length})`, ML, y);
  y += 9;

  // ── Each visit ─────────────────────────────────────────────────────────
  for (const v of data.visitas) {
    const isComp = v.estado === "completada";

    if (y + 32 > PH - MB - 12) {
      drawFooter(doc, doc.getNumberOfPages());
      doc.addPage();
      drawHeader(doc, sub);
      y = 25;
    }

    // Visit header bar
    fc(doc, isComp ? ([220, 252, 231] as RGB) : ([224, 242, 254] as RGB));
    doc.rect(ML, y, CW, 11, "F");
    fc(doc, isComp ? C.ok : C.sky);
    doc.rect(ML, y, 3, 11, "F");

    tc(doc, isComp ? ([21, 128, 61] as RGB) : C.ink);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(`${fmt(v.fecha_visita)}  ·  ${v.plantilla_nombre}`, ML + 6, y + 7);

    tc(doc, isComp ? ([21, 128, 61] as RGB) : C.sky);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text(isComp ? "COMPLETADA" : "EN CURSO", PW - MR, y + 7, { align: "right" });
    y += 13;

    // Stats mini-row
    const sw = CW / 4;
    const miniStats = [
      { l: "OK",          val: String(v.stats.ok),           c: C.ok },
      { l: "Incidencias", val: String(v.stats.incidencias),  c: v.stats.incidencias > 0 ? C.inc : C.gray },
      { l: "No aplica",   val: String(v.stats.no_aplica),    c: C.na },
      {
        l: "% OK",
        val: v.stats.pct_ok !== null ? `${Math.round(v.stats.pct_ok)}%` : "—",
        c: v.stats.pct_ok === null ? C.gray : v.stats.pct_ok >= 80 ? C.ok : C.inc,
      },
    ];
    miniStats.forEach(({ l, val, c }, i) => {
      fc(doc, C.paper);
      doc.rect(ML + i * sw, y, sw - 1, 10, "F");
      tc(doc, c);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(val, ML + i * sw + sw / 2, y + 5.5, { align: "center", baseline: "middle" });
      tc(doc, C.gray);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.text(l, ML + i * sw + sw / 2, y + 9, { align: "center" });
    });
    y += 13;

    // ── Checklist sections ────────────────────────────────────────────────
    for (const sec of v.secciones) {
      if (y + 7 > PH - MB - 12) {
        drawFooter(doc, doc.getNumberOfPages());
        doc.addPage();
        drawHeader(doc, sub);
        y = 25;
      }

      // Section header
      fc(doc, C.cream);
      doc.rect(ML, y, CW, 7, "F");
      tc(doc, C.ink);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.text(sec.nombre, ML + 3, y + 4.8);

      const sOk  = sec.items.filter((i) => i.estado === "ok").length;
      const sInc = sec.items.filter((i) => i.estado === "incidencia").length;
      tc(doc, C.gray);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.text(
        `${sOk} OK · ${sInc} inc. · ${sec.items.length} ítems`,
        PW - MR, y + 4.8, { align: "right" },
      );
      y += 7;

      for (const item of sec.items) {
        const noteLines: string[] = item.notas
          ? (doc.splitTextToSize(`↳ ${item.notas}`, CW - 22) as string[])
          : [];
        const rowH = 6 + noteLines.length * 3.8;

        if (y + rowH > PH - MB - 12) {
          drawFooter(doc, doc.getNumberOfPages());
          doc.addPage();
          drawHeader(doc, sub);
          y = 25;
        }

        fc(doc, C.white);
        doc.rect(ML, y, CW, rowH, "F");

        // Left accent by estado
        const ec: RGB =
          item.estado === "ok"         ? C.ok  :
          item.estado === "incidencia" ? C.inc :
          item.estado === "no_aplica"  ? C.na  :
          C.lgray;
        fc(doc, ec);
        doc.rect(ML, y, 1.5, rowH, "F");

        // Item text
        tc(doc, item.estado === "no_aplica" ? C.lgray : C.ink);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        const txt = item.texto.length > 62 ? item.texto.slice(0, 60) + "…" : item.texto;
        doc.text(txt, ML + 5, y + 4.2);

        // Estado label
        const lbl =
          item.estado === "ok"         ? "OK"         :
          item.estado === "incidencia" ? "INCIDENCIA" :
          item.estado === "no_aplica"  ? "N/A"        : "—";
        tc(doc, ec);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        doc.text(lbl, PW - MR, y + 4.2, { align: "right" });

        // Notes for incidencias
        if (noteLines.length > 0) {
          tc(doc, C.inc);
          doc.setFont("helvetica", "italic");
          doc.setFontSize(6.5);
          noteLines.forEach((l, li) => doc.text(l, ML + 5, y + 7 + li * 3.8));
        }

        dc(doc, C.cream);
        doc.setLineWidth(0.2);
        doc.line(ML + 1.5, y + rowH, ML + CW, y + rowH);
        y += rowH;
      }
    }

    // Notas generales
    if (v.notas_generales) {
      const nlines = doc.splitTextToSize(v.notas_generales, CW - 8) as string[];
      const nh = nlines.length * 4 + 12;
      if (y + nh > PH - MB - 12) {
        drawFooter(doc, doc.getNumberOfPages());
        doc.addPage();
        drawHeader(doc, sub);
        y = 25;
      }
      y += 3;
      fc(doc, [255, 251, 235] as RGB);
      doc.rect(ML, y, CW, nh, "F");
      fc(doc, C.gold);
      doc.rect(ML, y, 2.5, nh, "F");
      tc(doc, C.gold2);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.text("Notas generales", ML + 6, y + 6);
      tc(doc, C.ink);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      nlines.forEach((l, i) => doc.text(l, ML + 6, y + 11 + i * 4));
      y += nh;
    }

    // Seguimiento
    if (v.requiere_seguimiento) {
      if (y + 13 > PH - MB - 12) {
        drawFooter(doc, doc.getNumberOfPages());
        doc.addPage();
        drawHeader(doc, sub);
        y = 25;
      }
      y += 3;
      fc(doc, [255, 247, 237] as RGB);
      doc.rect(ML, y, CW, 11, "F");
      fc(doc, C.gold);
      doc.rect(ML, y, 2.5, 11, "F");
      tc(doc, C.gold2);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.text(
        v.proxima_visita
          ? `Seguimiento programado · Próxima visita: ${fmt(v.proxima_visita)}`
          : "Seguimiento requerido · Sin fecha fijada",
        ML + 6, y + 7.5,
      );
      y += 14;
    }

    // Spacer + separator between visits
    y += 8;
    if (y < PH - MB - 15) {
      dc(doc, C.cream);
      doc.setLineWidth(0.3);
      doc.line(ML, y - 4, ML + CW, y - 4);
    }
  }

  drawFooter(doc, doc.getNumberOfPages());
  return doc.output("arraybuffer") as ArrayBuffer;
}
