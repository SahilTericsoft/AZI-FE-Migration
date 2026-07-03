import { jsPDF } from "jspdf";

import type { ResultSample, ResultSession } from "./result.types";

/**
 * Client-side lab report generation. Text-based jsPDF (no DOM rasterization) so
 * it stays fast in bulk — one page per accession, ~300 reports/min easily.
 */

function header(doc: jsPDF, session: ResultSession) {
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Laboratory Result Report", 40, 48);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(110, 110, 110);
  const meta = session.runMetadata ?? {};
  doc.text(`Session #${session.id ?? "—"}${session.fileName ? ` · ${session.fileName}` : ""}`, 40, 64);
  if (meta["Run Ended"]) doc.text(`Run ended: ${meta["Run Ended"]}`, 40, 76);
  doc.setTextColor(0, 0, 0);
}

function accessionBlock(doc: jsPDF, accession: string, rows: ResultSample[], y: number): number {
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(`Accession: ${accession}`, 40, y);
  y += 16;

  // table header
  doc.setFontSize(9);
  doc.setFillColor(240, 240, 240);
  doc.rect(40, y - 10, 515, 16, "F");
  doc.setFont("helvetica", "bold");
  doc.text("Target / Biomarker", 46, y);
  doc.text("Cq", 360, y);
  doc.text("Result", 430, y);
  y += 16;

  doc.setFont("helvetica", "normal");
  for (const r of rows) {
    const name = r.targetName || r.biomarkerName || r.biomarkerCode || "—";
    const cq = r.cqValue != null ? r.cqValue.toFixed(2) : r.value != null ? "" : "—";
    const res = r.result ?? r.value ?? "—";
    const detected = (res || "").toLowerCase().includes("detect") && !(res || "").toLowerCase().includes("not");
    doc.text(String(name).slice(0, 60), 46, y);
    doc.text(cq, 360, y);
    if (detected) doc.setTextColor(180, 0, 0);
    doc.text(String(res), 430, y);
    doc.setTextColor(0, 0, 0);
    y += 14;
    if (y > 760) {
      doc.addPage();
      y = 60;
    }
  }
  return y + 12;
}

/** Build a single PDF for one accession. */
export function buildReport(session: ResultSession, accession: string, samples: ResultSample[]): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  header(doc, session);
  const rows = samples.filter((s) => s.accessionId === accession && !s.isRejected);
  accessionBlock(doc, accession, rows, 110);
  doc.setFontSize(8);
  doc.setTextColor(130, 130, 130);
  doc.text(`Generated ${new Date().toLocaleString()}`, 40, 812);
  return doc;
}

/** Build one PDF containing a page per accession (bulk generate). */
export function buildBulkReport(session: ResultSession, accessions: string[], samples: ResultSample[]): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  accessions.forEach((acc, i) => {
    if (i > 0) doc.addPage();
    header(doc, session);
    const rows = samples.filter((s) => s.accessionId === acc && !s.isRejected);
    accessionBlock(doc, acc, rows, 110);
    doc.setFontSize(8);
    doc.setTextColor(130, 130, 130);
    doc.text(`Generated ${new Date().toLocaleString()}`, 40, 812);
  });
  return doc;
}

export const previewUrl = (doc: jsPDF): string => doc.output("datauristring");
export const download = (doc: jsPDF, name: string) => doc.save(name);
