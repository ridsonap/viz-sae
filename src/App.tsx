import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Dataset, ChartColorPalette } from './types/sae';
import { getDemoDataset } from './data/demoData';
import { parseExcelWorkbook, ParseResult } from './utils/excelParser';
import { generatePdfDiagnosticReport } from './utils/pdfExport';

import { Navbar } from './components/Navbar';
import { SummaryCards } from './components/SummaryCards';
import { ColumnMapperModal } from './components/ColumnMapperModal';

import { ScatterPlotTab } from './components/tabs/ScatterPlotTab';
import { ShrinkagePlotTab } from './components/tabs/ShrinkagePlotTab';
import { RseComparisonTab } from './components/tabs/RseComparisonTab';
import { PrecisionDistributionTab } from './components/tabs/PrecisionDistributionTab';
import { BlandAltmanTab } from './components/tabs/BlandAltmanTab';
import { RelativeEfficiencyTab } from './components/tabs/RelativeEfficiencyTab';
import { DataTableTab } from './components/tabs/DataTableTab';

import {
  ScatterChart,
  GitCommit,
  BarChart2,
  BoxSelect,
  Layers,
  Zap,
  Table,
} from 'lucide-react';

type TabKey = 'scatter' | 'shrinkage' | 'rse' | 'precision' | 'bland-altman' | 're' | 'table';

export const App: React.FC = () => {
  const [dataset, setDataset] = useState<Dataset>(getDemoDataset);
  const [colorPalette, setColorPalette] = useState<ChartColorPalette>('vibrant');
  const [activeTab, setActiveTab] = useState<TabKey>('scatter');
  const [isDark, setIsDark] = useState<boolean>(() => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [pendingParseResult, setPendingParseResult] = useState<ParseResult | null>(null);

  // Sync dark mode class
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const handleToggleDark = () => {
    setIsDark(!isDark);
  };

  const handleLoadDemo = () => {
    setDataset(getDemoDataset());
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.15 },
    });
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const buffer = e.target?.result as ArrayBuffer;
      if (buffer) {
        try {
          const result = parseExcelWorkbook(buffer);
          setPendingParseResult(result);
        } catch (err) {
          alert('Gagal membaca file Excel. Pastikan file valid.');
          console.error(err);
        }
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleConfirmMapping = (newDataset: Dataset) => {
    setDataset(newDataset);
    setPendingParseResult(null);
    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.2 },
    });
  };

  const handleExportPdf = () => {
    generatePdfDiagnosticReport(dataset);
  };

  const tabs: { key: TabKey; label: string; icon: React.ReactNode; desc: string }[] = [
    { key: 'scatter', label: 'Scatter (y = x)', icon: <ScatterChart className="h-4 w-4" />, desc: 'Konsistensi Estimasi' },
    { key: 'shrinkage', label: 'Shrinkage Plot', icon: <GitCommit className="h-4 w-4" />, desc: 'Efek Penarikan Ekstrem' },
    { key: 'rse', label: 'Komparasi RSE', icon: <BarChart2 className="h-4 w-4" />, desc: 'Batas Reliabilitas 25%' },
    { key: 'precision', label: 'Distribusi Presisi', icon: <BoxSelect className="h-4 w-4" />, desc: 'Boxplot RSE / MSE' },
    { key: 'bland-altman', label: 'Bland-Altman', icon: <Layers className="h-4 w-4" />, desc: 'Analisis Kesepakatan' },
    { key: 're', label: 'Relative Efficiency', icon: <Zap className="h-4 w-4" />, desc: 'Gain Efisiensi Model' },
    { key: 'table', label: 'Tabel Data', icon: <Table className="h-4 w-4" />, desc: 'Tabel Lengkap & Ekspor' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Navbar */}
      <Navbar
        onLoadDemo={handleLoadDemo}
        onFileUpload={handleFileUpload}
        onExportPdf={handleExportPdf}
        isDark={isDark}
        onToggleDark={handleToggleDark}
      />

      {/* Main Container */}
      <main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header Title Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/60 pb-5 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                Dashboard Komparasi Hasil Model SAE
              </h1>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Menganalisis performa presisi ({dataset.modelNames.join(', ')}) terhadap Penduga Langsung (Direct Estimator).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-900">
              📊 {dataset.name}
            </span>
          </div>
        </div>

        {/* Top KPI Cards */}
        <SummaryCards dataset={dataset} />

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto border-b border-slate-200 pb-px dark:border-slate-800 no-scrollbar">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition border-b-2 whitespace-nowrap ${
                activeTab === t.key
                  ? 'border-indigo-600 bg-white text-indigo-600 shadow-sm dark:border-indigo-400 dark:bg-slate-900 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-900/60'
              }`}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content Display */}
        <div className="transition-all duration-200">
          {activeTab === 'scatter' && (
            <ScatterPlotTab
              dataset={dataset}
              colorPalette={colorPalette}
              onChangePalette={setColorPalette}
              isDark={isDark}
            />
          )}

          {activeTab === 'shrinkage' && (
            <ShrinkagePlotTab
              dataset={dataset}
              colorPalette={colorPalette}
              onChangePalette={setColorPalette}
              isDark={isDark}
            />
          )}

          {activeTab === 'rse' && (
            <RseComparisonTab
              dataset={dataset}
              colorPalette={colorPalette}
              onChangePalette={setColorPalette}
              isDark={isDark}
            />
          )}

          {activeTab === 'precision' && (
            <PrecisionDistributionTab
              dataset={dataset}
              colorPalette={colorPalette}
              onChangePalette={setColorPalette}
              isDark={isDark}
            />
          )}

          {activeTab === 'bland-altman' && (
            <BlandAltmanTab
              dataset={dataset}
              colorPalette={colorPalette}
              onChangePalette={setColorPalette}
              isDark={isDark}
            />
          )}

          {activeTab === 're' && (
            <RelativeEfficiencyTab
              dataset={dataset}
              colorPalette={colorPalette}
              onChangePalette={setColorPalette}
              isDark={isDark}
            />
          )}

          {activeTab === 'table' && <DataTableTab dataset={dataset} />}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200/80 bg-white py-6 text-center text-xs text-slate-500 dark:border-slate-800/80 dark:bg-slate-950 dark:text-slate-400">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <b>SAE-Viz</b> — Platform Visualisasi & Benchmarking Small Area Estimation (Client-Side).
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>100% Client-Side Privacy (Data tidak diunggah ke server)</span>
            <span>•</span>
            <a
              href="https://github.com/ridsonap/viz-sae"
              target="_blank"
              rel="noreferrer"
              className="text-indigo-600 hover:underline dark:text-indigo-400"
            >
              GitHub Repository
            </a>
          </div>
        </div>
      </footer>

      {/* Column Mapping Modal */}
      {pendingParseResult && (
        <ColumnMapperModal
          parseResult={pendingParseResult}
          onConfirm={handleConfirmMapping}
          onCancel={() => setPendingParseResult(null)}
        />
      )}
    </div>
  );
};

export default App;
