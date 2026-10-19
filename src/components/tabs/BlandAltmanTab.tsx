import React, { useRef, useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { Dataset, ChartColorPalette } from '../../types/sae';
import { ChartToolbar } from '../ChartToolbar';
import { getPaletteColors } from '../../utils/palette';

interface BlandAltmanTabProps {
  dataset: Dataset;
  colorPalette: ChartColorPalette;
  onChangePalette: (palette: ChartColorPalette) => void;
  isDark: boolean;
}

export const BlandAltmanTab: React.FC<BlandAltmanTabProps> = ({
  dataset,
  colorPalette,
  onChangePalette,
  isDark,
}) => {
  const chartRef = useRef<ReactECharts>(null);
  const [selectedModel, setSelectedModel] = useState<string>(dataset.modelNames[0] || '');

  const activeModel = dataset.modelNames.includes(selectedModel) ? selectedModel : dataset.modelNames[0] || '';
  const colors = getPaletteColors(colorPalette);

  const { points, meanDiff, sdDiff, upperLoA, lowerLoA, minMean, maxMean } = useMemo(() => {
    const pts = dataset.domains.map((d) => {
      const dir = d.direct.estimate;
      const mod = d.models[activeModel]?.estimate ?? 0;
      const mean = (dir + mod) / 2;
      const diff = dir - mod;
      return {
        name: d.domainName,
        id: d.domainId,
        mean,
        diff,
        dir,
        mod,
      };
    });

    if (pts.length === 0) {
      return { points: [], meanDiff: 0, sdDiff: 0, upperLoA: 0, lowerLoA: 0, minMean: 0, maxMean: 100 };
    }

    const n = pts.length;
    const diffs = pts.map((p) => p.diff);
    const meanDiff = diffs.reduce((a, b) => a + b, 0) / n;

    const variance = diffs.reduce((a, b) => a + Math.pow(b - meanDiff, 2), 0) / (n - 1 || 1);
    const sdDiff = Math.sqrt(variance);

    const upperLoA = meanDiff + 1.96 * sdDiff;
    const lowerLoA = meanDiff - 1.96 * sdDiff;

    const means = pts.map((p) => p.mean);
    const minMean = Math.floor(Math.min(...means) * 0.9);
    const maxMean = Math.ceil(Math.max(...means) * 1.1);

    return {
      points: pts,
      meanDiff: Number(meanDiff.toFixed(3)),
      sdDiff: Number(sdDiff.toFixed(3)),
      upperLoA: Number(upperLoA.toFixed(3)),
      lowerLoA: Number(lowerLoA.toFixed(3)),
      minMean,
      maxMean,
    };
  }, [dataset, activeModel]);

  const handleExport = (format: 'png' | 'svg', scale = 2) => {
    const echartInstance = chartRef.current?.getEchartsInstance();
    if (!echartInstance) return;

    const url = echartInstance.getDataURL({
      type: format,
      pixelRatio: scale,
      backgroundColor: isDark ? '#0f172a' : '#ffffff',
    });
    const link = document.createElement('a');
    link.download = `SAE_BlandAltman_${activeModel}.${format}`;
    link.href = url;
    link.click();
  };

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      borderColor: isDark ? '#334155' : '#e2e8f0',
      textStyle: { color: isDark ? '#f8fafc' : '#0f172a' },
      formatter: (params: any) => {
        const d = points[params.dataIndex];
        if (!d) return '';
        return `
          <div style="font-weight: 700; margin-bottom: 4px;">${d.name} (${d.id})</div>
          <div style="font-size: 12px; line-height: 1.5;">
            <div>• <b>Rata-rata (Direct + SAE)/2:</b> ${d.mean.toFixed(3)}</div>
            <div>• <b>Selisih (Direct - SAE):</b> ${d.diff > 0 ? '+' : ''}${d.diff.toFixed(3)}</div>
            <div>• <b>Nilai Direct:</b> ${d.dir}</div>
            <div>• <b>Nilai ${activeModel}:</b> ${d.mod}</div>
          </div>
        `;
      },
    },
    grid: {
      top: 60,
      right: 120,
      bottom: 60,
      left: 70,
    },
    xAxis: {
      name: 'Rata-rata Estimasi [(Direct + SAE) / 2]',
      nameLocation: 'center',
      nameGap: 35,
      type: 'value',
      min: minMean,
      max: maxMean,
      splitLine: { lineStyle: { color: isDark ? '#334155' : '#f1f5f9' } },
      axisLine: { lineStyle: { color: isDark ? '#64748b' : '#cbd5e1' } },
      axisLabel: { color: isDark ? '#94a3b8' : '#64748b' },
    },
    yAxis: {
      name: 'Selisih (Direct - Model SAE)',
      nameLocation: 'center',
      nameGap: 45,
      type: 'value',
      splitLine: { lineStyle: { color: isDark ? '#334155' : '#f1f5f9' } },
      axisLine: { lineStyle: { color: isDark ? '#64748b' : '#cbd5e1' } },
      axisLabel: { color: isDark ? '#94a3b8' : '#64748b' },
    },
    series: [
      {
        name: 'Perbedaan Domain',
        type: 'scatter',
        symbolSize: 9,
        itemStyle: { color: colors.primary },
        data: points.map((p) => [p.mean, p.diff]),
        markLine: {
          symbol: 'none',
          data: [
            {
              yAxis: 0,
              lineStyle: { color: isDark ? '#94a3b8' : '#64748b', type: 'solid', width: 1.2 },
              label: { formatter: 'Nol (y = 0)', position: 'end', color: isDark ? '#94a3b8' : '#64748b' },
            },
            {
              yAxis: meanDiff,
              lineStyle: { color: isDark ? '#38bdf8' : '#0284c7', type: 'dashed', width: 2 },
              label: { formatter: `Mean Bias: ${meanDiff}`, position: 'end', color: isDark ? '#38bdf8' : '#0284c7' },
            },
            {
              yAxis: upperLoA,
              lineStyle: { color: isDark ? '#ef4444' : '#dc2626', type: 'dashed', width: 1.5 },
              label: { formatter: `+1.96 SD: ${upperLoA}`, position: 'end', color: isDark ? '#f87171' : '#dc2626' },
            },
            {
              yAxis: lowerLoA,
              lineStyle: { color: isDark ? '#ef4444' : '#dc2626', type: 'dashed', width: 1.5 },
              label: { formatter: `-1.96 SD: ${lowerLoA}`, position: 'end', color: isDark ? '#f87171' : '#dc2626' },
            },
          ],
        },
      },
    ],
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
      <ChartToolbar
        chartTitle="Bland-Altman / Mean-Difference Plot"
        chartDescription="Memvisualisasikan kesepakatan (agreement) antara penduga langsung dan model SAE. Menunjukkan garis bias rata-rata dan batas kesepakatan 95% (Limits of Agreement = Mean ± 1.96 SD)."
        onExport={handleExport}
        colorPalette={colorPalette}
        onChangePalette={onChangePalette}
      >
        <div className="flex items-center gap-1.5">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Model:</label>
          <select
            value={activeModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            {dataset.modelNames.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </ChartToolbar>

      {/* Info Stats Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-100 bg-slate-50/60 px-5 py-2 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400">
        <div className="flex items-center gap-4">
          <span>
            Mean Difference (Bias): <b className="text-sky-600 dark:text-sky-400">{meanDiff}</b>
          </span>
          <span>
            Standar Deviasi (SD): <b>{sdDiff}</b>
          </span>
          <span>
            Batas Atas (+1.96 SD): <b className="text-rose-600 dark:text-rose-400">{upperLoA}</b>
          </span>
          <span>
            Batas Bawah (-1.96 SD): <b className="text-rose-600 dark:text-rose-400">{lowerLoA}</b>
          </span>
        </div>
      </div>

      <div className="p-4">
        <ReactECharts
          ref={chartRef}
          option={option}
          style={{ height: '480px', width: '100%' }}
          opts={{ renderer: 'svg' }}
        />
      </div>
    </div>
  );
};
