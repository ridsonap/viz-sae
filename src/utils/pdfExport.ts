import jsPDF from 'jspdf';
import { Dataset } from '../types/sae';
import { computeModelSummaries } from './excelParser';

export function generatePdfDiagnosticReport(dataset: Dataset): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const { directSummary, modelSummaries } = computeModelSummaries(dataset);
  const bestModel = [...modelSummaries].sort((a, b) => b.avgRe - a.avgRe)[0];

  // Colors
  const primaryColor = [79, 70, 229]; // Indigo #4f46e5
  const textColor = [30, 41, 59]; // Slate #1e293b
  const mutedColor = [100, 116, 139]; // Slate #64748b

  let y = 20;

  // Header Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('SAE-Viz: Laporan Diagnostik & Evaluasi Model', 20, y);
  y += 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
  doc.text(`Dataset: ${dataset.name}`, 20, y);
  y += 5;
  doc.text(
    `Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })} | Total Wilayah: ${dataset.domains.length} Domain`,
    20,
    y
  );
  y += 8;

  // Divider line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(20, y, 190, y);
  y += 10;

  // Section 1: Executive Summary Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(20, y, 170, 32, 3, 3, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(20, y, 170, 32, 3, 3, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text('Ringkasan Evaluasi Kualitas Model:', 25, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text(
    `• Penduga Langsung (Direct): Hanya ${directSummary.reliablePct}% domain memenuhi batas reliabilitas RSE < ${dataset.threshold}%.`,
    25,
    y + 15
  );

  if (bestModel) {
    doc.text(
      `• Model Terbaik Terpilih: ${bestModel.name} dengan Relative Efficiency rata-rata ${bestModel.avgRe}x lipat.`,
      25,
      y + 21
    );
    doc.text(
      `• Tingkat Reliabilitas ${bestModel.name}: Meningkat menjadi ${bestModel.reliablePct}% dengan reduksi error rata-rata -${bestModel.avgRseReduction}%.`,
      25,
      y + 27
    );
  }
  y += 42;

  // Section 2: Model Comparison Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Tabel Perbandingan Performa Presisi Antar Metode', 20, y);
  y += 6;

  // Table Header
  doc.setFillColor(238, 242, 255);
  doc.rect(20, y, 170, 8, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);

  doc.text('Metode / Model', 23, y + 5);
  doc.text('Rata-rata Est', 65, y + 5);
  doc.text('Avg RSE (%)', 92, y + 5);
  doc.text('Median RSE', 117, y + 5);
  doc.text('Reliabel (<25%)', 142, y + 5);
  doc.text('Avg RE', 172, y + 5);
  y += 8;

  // Table Rows
  const rows = [directSummary, ...modelSummaries];
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);

  rows.forEach((r, idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(20, y, 170, 7, 'F');
    }
    doc.text(r.name, 23, y + 5);
    doc.text(String(r.avgEstimate), 65, y + 5);
    doc.text(`${r.avgRse}%`, 92, y + 5);
    doc.text(`${r.medianRse}%`, 117, y + 5);
    doc.text(`${r.reliablePct}%`, 142, y + 5);
    doc.text(`${r.avgRe}x`, 172, y + 5);
    y += 7;
  });

  y += 12;

  // Section 3: Diagnostic Standards & Guidelines
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text('Pedoman & Kriteria Evaluasi Small Area Estimation (SAE):', 20, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);

  const guidelines = [
    '1. Batas Ambang RSE (Relative Standard Error): Mengacu standar Badan Pusat Statistik (BPS), indikator dengan RSE < 25% dikategorikan sangat reliabel untuk dirilis ke publik.',
    '2. Relative Efficiency (RE = MSE Direct / MSE SAE): Nilai RE > 1 menandakan estimasi model SAE lebih akurat dan memiliki varians kesalahan lebih kecil daripada penduga langsung.',
    '3. Efek Shrinkage: Estimasi SAE yang baik menarik (shrinks) nilai-nilai ekstrem penduga langsung menuju estimasi sintetik tanpa menghasilkan bias sistematik secara agregat.',
    '4. Bland-Altman Agreement: Digunakan untuk memastikan tidak ada deviasi proporsional atau heteroskedastisitas signifikan antar estimasi survei dan model.',
  ];

  guidelines.forEach((g) => {
    doc.text(g, 20, y, { maxWidth: 170 });
    y += 7;
  });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Dihasilkan secara otomatis oleh SAE-Viz (Client-Side Platform) • Open Source', 20, 285);

  doc.save(`Laporan_SAE_${dataset.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
}
