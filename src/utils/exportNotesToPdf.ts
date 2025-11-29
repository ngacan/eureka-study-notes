import { jsPDF } from "jspdf";
import { Note } from "../types";
import NotoSansBase64 from "../assets/NotoSansVietnameseFont";

type ExportNote = Note & { selectedErrorIndexes?: number[] };

/** Convert various timestamp shapes to Date safely */
function toDate(value?: number | string | Date | { toDate?: () => Date }): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  if (typeof value === "number" || typeof value === "string") return new Date(value as any);
  if (typeof (value as any)?.toDate === "function") return (value as any).toDate();
  return new Date();
}

/**
 * Export notes to PDF
 * - Page size: 6.7cm x 13cm => 67mm x 130mm
 * - Margins: 0.1cm => 1mm
 * - Font sizes: main 10, meta/errors 9
 * - Accepts Note[] or (Note & { selectedErrorIndexes?: number[] })[]
 */
export const exportNotesToPdf = (notesParam: ExportNote[] | Note[]) => {
  const notes = (notesParam || []) as ExportNote[];

  const pageW = 67; // mm
  const pageH = 130; // mm
  const margin = 1; // mm (0.1cm)
  const usableW = pageW - margin * 2;
  const lineHeightMain = 4.8; // mm ~ font 10
  const lineHeightSmall = 4.2; // mm ~ font 9

  // create doc with custom size
  const doc = new jsPDF({ unit: "mm", format: [pageW, pageH] });

  // register and set NotoSans for Vietnamese if available
  try {
    if (NotoSansBase64 && typeof doc.addFileToVFS === "function") {
      doc.addFileToVFS("NotoSans.ttf", NotoSansBase64 as any);
      doc.addFont("NotoSans.ttf", "NotoSans", "normal");
      doc.addFont("NotoSans.ttf", "NotoSans", "bold");
      doc.setFont("NotoSans");
    }
  } catch (e) {
    console.warn("Failed to register custom font for PDF:", e);
  }

  const addFooter = (pageNum: number) => {
    doc.setFontSize(7);
    doc.setTextColor(120);
    doc.text(`Eureka • ${new Date().toLocaleDateString("vi-VN")} • ${pageNum}`, pageW / 2, pageH - 2, { align: "center" });
  };

  if (!notes || notes.length === 0) {
    doc.setFontSize(10);
    doc.text("Không có ghi chú để xuất.", margin, margin + 6);
    addFooter(1);
    doc.save(`eureka_notes_${Date.now()}.pdf`);
    return;
  }

  let pageNum = 1;
  let y = margin + 4;

  for (let i = 0; i < notes.length; i++) {
    const raw = notes[i] as any;
    const title = (raw.title ?? raw.name ?? "Không tiêu đề").toString();
    const subject = (raw.subject ?? "—").toString();
    const difficulty = (raw.difficulty ?? "—").toString();
    const date = toDate(raw.updatedAt ?? raw.createdAt ?? Date.now());
    const content = (raw.content ?? raw.text ?? raw.body ?? "").toString().trim() || "(Không có nội dung)";
    const allErrors = Array.isArray(raw.errors) ? raw.errors : Array.isArray(raw.mistakes) ? raw.mistakes : [];
    const selectedIdxs = Array.isArray(raw.selectedErrorIndexes) ? raw.selectedErrorIndexes : null;
    // determine which errors to show: if selectedIdxs provided, use those, else show all
    const errorsToShow = selectedIdxs ? selectedIdxs.map((idx: number) => allErrors[idx]).filter(Boolean) : allErrors;

    // ensure space for header/title
    if (y + 12 > pageH - margin - 4) {
      addFooter(pageNum);
      doc.addPage([pageW, pageH]);
      pageNum++;
      y = margin + 4;
      doc.setFont("NotoSans");
    }

    // Title
    doc.setFontSize(10);
    doc.setFont("NotoSans");
    doc.text(`${i + 1}. ${title}`, margin, y);
    y += lineHeightMain;

    // Meta
    doc.setFontSize(9);
    const meta = `Môn: ${subject}  •  Độ khó: ${difficulty}  •  ${date.toLocaleDateString("vi-VN")}`;
    const metaLines = doc.splitTextToSize(meta, usableW);
    doc.text(metaLines, margin, y);
    y += metaLines.length * lineHeightSmall + 1.5;

    // Content
    doc.setFontSize(10);
    const contentLines = doc.splitTextToSize(content, usableW);
    for (let li = 0; li < contentLines.length; li++) {
      if (y + lineHeightMain > pageH - margin - 4) {
        addFooter(pageNum);
        doc.addPage([pageW, pageH]);
        pageNum++;
        y = margin + 4;
        doc.setFontSize(10);
      }
      doc.text(contentLines[li], margin, y);
      y += lineHeightMain;
    }
    y += 1;

    // Errors (if any)
    if (Array.isArray(errorsToShow) && errorsToShow.length > 0) {
      doc.setFontSize(9);
      doc.text("Lỗi / Gợi ý cải thiện:", margin, y);
      y += lineHeightSmall;
      for (let ei = 0; ei < errorsToShow.length; ei++) {
        const eItem = errorsToShow[ei];
        const eText = typeof eItem === "string" ? eItem : (eItem?.text ?? JSON.stringify(eItem));
        const bullet = `• ${eText}`;
        const blines = doc.splitTextToSize(bullet, usableW - 3);
        for (let b = 0; b < blines.length; b++) {
          if (y + lineHeightSmall > pageH - margin - 4) {
            addFooter(pageNum);
            doc.addPage([pageW, pageH]);
            pageNum++;
            y = margin + 4;
            doc.setFontSize(9);
          }
          doc.text(blines[b], margin + 2, y);
          y += lineHeightSmall;
        }
        y += 0.8;
      }
      y += 1.5;
    }

    // separation
    y += 2;
  }

  addFooter(pageNum);
  doc.save(`eureka_notes_${Date.now()}.pdf`);
};
