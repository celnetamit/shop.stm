import { jsPDF } from "jspdf";

type AddCanvasToPdfOptions = {
  marginMm?: number;
  imageType?: "JPEG" | "PNG";
  imageQuality?: number;
};

export function addCanvasToPdfPages(
  pdf: jsPDF,
  canvas: HTMLCanvasElement,
  options: AddCanvasToPdfOptions = {}
) {
  const { marginMm = 10, imageType = "JPEG", imageQuality = 0.82 } = options;

  const pageWidth = pdf.internal.pageSize.getWidth() - marginMm * 2;
  const pageHeight = pdf.internal.pageSize.getHeight() - marginMm * 2;
  const imgWidth = canvas.width;
  const imgHeight = canvas.height;
  const imgDisplayHeight = (imgHeight * pageWidth) / imgWidth;
  const imgData = canvas.toDataURL(`image/${imageType.toLowerCase()}`, imageQuality);
  const totalPages = Math.max(1, Math.ceil(imgDisplayHeight / pageHeight));

  for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
    if (pageIndex > 0) {
      pdf.addPage();
    }

    const yOffset = marginMm - pageIndex * pageHeight;
    pdf.addImage(imgData, imageType, marginMm, yOffset, pageWidth, imgDisplayHeight, undefined, "FAST");
  }
}
