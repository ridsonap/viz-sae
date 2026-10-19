import React, { useState } from 'react';
import { Download, Palette, Maximize2, Minimize2, Info } from 'lucide-react';
import { ChartColorPalette } from '../types/sae';

interface ChartToolbarProps {
  chartTitle: string;
  chartDescription?: string;
  onExport: (format: 'png' | 'svg', scale?: number) => void;
  colorPalette?: ChartColorPalette;
  onChangePalette?: (palette: ChartColorPalette) => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  children?: React.ReactNode;
}

export const ChartToolbar: React.FC<ChartToolbarProps> = ({
  chartTitle,
  chartDescription,
  onExport,
  colorPalette,
  onChangePalette,
  isExpanded,
  onToggleExpand,
  children,
}) => {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showPaletteMenu, setShowPaletteMenu] = useState(false);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-white/80 px-5 py-3.5 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
      <div className="flex items-center gap-2">
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">{chartTitle}</h3>
        {chartDescription && (
          <div className="group relative">
            <Info className="h-4 w-4 cursor-pointer text-slate-400 hover:text-indigo-600 dark:text-slate-500 dark:hover:text-indigo-400" />
            <div className="absolute left-0 top-6 z-30 hidden w-72 rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-600 shadow-xl group-hover:block dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              {chartDescription}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {children}

        {/* Palette Selector */}
        {onChangePalette && colorPalette && (
          <div className="relative">
            <button
              onClick={() => setShowPaletteMenu(!showPaletteMenu)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              title="Ganti Tema Warna"
            >
              <Palette className="h-3.5 w-3.5 text-slate-500" />
              <span className="capitalize">{colorPalette}</span>
            </button>

            {showPaletteMenu && (
              <div
                className="absolute right-0 top-9 z-20 w-36 rounded-lg border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-800"
                onClick={() => setShowPaletteMenu(false)}
              >
                {(['vibrant', 'academic', 'emerald', 'colorblind'] as ChartColorPalette[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => onChangePalette(p)}
                    className={`flex w-full items-center justify-between rounded px-2.5 py-1.5 text-left text-xs capitalize hover:bg-slate-100 dark:hover:bg-slate-700 ${
                      colorPalette === p ? 'font-semibold text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {p}
                    {colorPalette === p && <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Download Button */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-indigo-700 active:scale-95 transition"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download</span>
          </button>

          {showExportMenu && (
            <div
              className="absolute right-0 top-9 z-20 w-44 rounded-lg border border-slate-200 bg-white p-1 shadow-xl dark:border-slate-700 dark:bg-slate-800"
              onClick={() => setShowExportMenu(false)}
            >
              <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Raster Image</div>
              <button
                onClick={() => onExport('png', 2)}
                className="flex w-full items-center justify-between rounded px-2.5 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <span>PNG Resolusi Standar</span>
                <span className="text-[10px] text-slate-400">2x</span>
              </button>
              <button
                onClick={() => onExport('png', 4)}
                className="flex w-full items-center justify-between rounded px-2.5 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <span>PNG High-Res (300 DPI)</span>
                <span className="text-[10px] text-slate-400">4x</span>
              </button>
              <div className="my-1 border-t border-slate-100 dark:border-slate-700" />
              <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Vector Format</div>
              <button
                onClick={() => onExport('svg')}
                className="flex w-full items-center justify-between rounded px-2.5 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <span>Vector SVG</span>
                <span className="text-[10px] text-indigo-500 font-semibold">Publikasi</span>
              </button>
            </div>
          )}
        </div>

        {/* Expand / Minimize */}
        {onToggleExpand && (
          <button
            onClick={onToggleExpand}
            className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 hover:text-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            title={isExpanded ? 'Perkecil' : 'Layar Penuh'}
          >
            {isExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>
    </div>
  );
};
