import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Note } from "../types";

// Hàm xuất PDF theo size 6.7 × 13 cm, lề 0.1 cm
export const exportNotesToPdf = (notes: Note[]) => {
  // 6.7 cm × 13 cm = 67 mm × 130 mm
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [130, 67],
  });

  const margin = 1; // 0.1 cm = 1 mm
  const pageWidth = 67;
  const pageHeight = 130;

  // === Title ===
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Tổng hợp ghi chú", margin, 6);

  if (notes.length === 0) {
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Không có dữ liệu để xuất.", margin, 12);
    addFooter(doc, pageWidth, pageHeight);
    doc.save(`notes_${Date.now()}.pdf`);
    return;
  }

  const tableData = notes.map((n, idx) => [
    idx + 1,
    n.title,
    n.subject,
    n.difficulty,
    new Date(n.updatedAt || n.createdAt).toLocaleDateString("vi-VN"),
  ]);

  autoTable(doc, {
    startY: 10,
    margin: { left: margin, right: margin },
    head: [["#", "Tiêu đề", "Môn", "Đ/K", "Ngày"]],
    body: tableData,
    styles: { fontSize: 8 },
    headStyles: {
      fontSize: 9,
      fillColor: [59, 130, 246],
    },
    tableWidth: pageWidth - margin * 2,
  });

  addFooter(doc, pageWidth, pageHeight);
  doc.save(`notes_${Date.now()}.pdf`);
};

// === Footer: tên app + ngày giờ xuất ===
function addFooter(doc: any, pageWidth: number, pageHeight: number) {
  doc.setFontSize(6);
  doc.setFont("Helvetica", "normal");
  doc.setTextColor(150);

  const footer = `Eureka Study Notes • ${new Date().toLocaleString("vi-VN")}`;

  doc.text(footer, pageWidth / 2, pageHeight - 2, {
    align: "center",
  });
}
