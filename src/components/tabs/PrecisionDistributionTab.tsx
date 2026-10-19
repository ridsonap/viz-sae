import React, { useRef, useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { Dataset, ChartColorPalette } from '../../types/sae';
import { ChartToolbar } from '../ChartToolbar';
import { getPaletteColors } from '../../utils/palette';

interface PrecisionDistributionTabProps {
  dataset: Dataset;
  colorPalette: ChartColorPalette;
  onChangePalette: (palette: ChartColorPalette) => void;
  isDark: boolean;
}

interface BoxplotStatsResult {
  box: number[];
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  mean: number;
}

// Compute 5-number summary (Min, Q1, Median, Q3, Max)
function calculateBoxplotStats(arr: number[]): BoxplotStatsResult {
  if (arr.length === 0) {
    return {
      box: [0, 0, 0, 0, 0],
      min: 0,
      q1: 0,
      median: 0,
      q3: 0,
      max: 0,
      mean: 0,
    };
  }
  const sorted = [...arr].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];

  const q2 = getMedian(sorted);
  const mid = Math.floor(sorted.length / 2);
  const lowerHalf = sorted.length % 2 === 0 ? sorted.slice(0, mid) : sorted.slice(0, mid);
  const upperHalf = sorted.length % 2 === 0 ? sorted.slice(mid) : sorted.slice(mid + 1);

  const q1 = getMedian(lowerHalf);
  const q3 = getMedian(upperHalf);

  const mean = sorted.reduce((a, b) => a + b, 0) / sorted.length;

  return {
    box: [Number(min.toFixed(3)), Number(q1.toFixed(3)), Number(q2.toFixed(3)), Number(q3.toFixed(3)), Number(max.toFixed(3))],
    min: Number(min.toFixed(3)),
    q1: Number(q1.toFixed(3)),
    median: Number(q2.toFixed(3)),
    q3: Number(q3.toFixed(3)),
    max: Number(max.toFixed(3)),
    mean: Number(mean.toFixed(3)),
  };
}

function getMedian(sorted: number[]): number {
  if (sorted.length === 0) return 0;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export const PrecisionDistributionTab: React.FC<PrecisionDistributionTabProps> = ({
  dataset,
  colorPalette,
  onChangePalette,
  isDark,
}) => {
  const chartRef = useRef<ReactECharts>(null);
  const [metric, setMetric] = useState<'rse' | 'mse'>('rse');

  const colors = getPaletteColors(colorPalette);
  const modelLabels = ['Penduga Langsung', ...dataset.modelNames];

  const stats = useMemo(() => {
    const list: { label: string; stats: ReturnType<typeof calculateBoxplotStats> }[] = [];

    // Direct
    const directVals = dataset.domains.map((d) => (metric === 'rse' ? d.direct.rse : (d.direct.mse ?? 0)));
    list.push({ label: 'Penduga Langsung', stats: calculateBoxplotStats(directVals) });

    // Models
    dataset.modelNames.forEach((m) => {
      const vals = dataset.domains.map((d) => (metric === 'rse' ? d.models[m]?.rse ?? 0 : d.models[m]?.mse ?? 0));
      list.push({ label: m, stats: calculateBoxplotStats(vals) });
    });

    return list;
  }, [dataset, metric]);

  const handleExport = (format: 'png' | 'svg', scale = 2) => {
    const echartInstance = chartRef.current?.getEchartsInstance();
    if (!echartInstance) return;

    const url = echartInstance.getDataURL({
      type: format,
      pixelRatio: scale,
      backgroundColor: isDark ? '#0f172a' : '#ffffff',
    });
    const link = document.createElement('a');
    link.download = `SAE_Boxplot_${metric.toUpperCase()}.${format}`;
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
      formatter: (param: any) => {
        const item = stats[param.dataIndex];
        if (!item) return '';
        const s = item.stats;
        return `
          <div style="font-weight: 700; margin-bottom: 4px;">${item.label}</div>
          <div style="font-size: 12px; line-height: 1.6;">
            <div>• <b>Maksimum:</b> ${s.max}</div>
            <div>• <b>Q3 (Persentil 75):</b> ${s.q3}</div>
            <div>• <b>Median (Q2):</b> ${s.median}</div>
            <div>• <b>Rata-rata:</b> ${s.mean}</div>
            <div>• <b>Q1 (Persentil 25):</b> ${s.q1}</div>
            <div>• <b>Minimum:</b> ${s.min}</div>
          </div>
        `;
      },
    },
    grid: {
      top: 40,
      right: 30,
      bottom: 50,
      left: 60,
    },
    xAxis: {
      type: 'category',
      data: modelLabels,
      axisLabel: {
        fontSize: 12,
        color: isDark ? '#cbd5e1' : '#475569',
        fontWeight: 500,
      },
      axisLine: { lineStyle: { color: isDark ? '#64748b' : '#cbd5e1' } },
    },
    yAxis: {
      type: 'value',
      name: metric === 'rse' ? 'Relative Standard Error (%)' : 'Mean Squared Error (MSE)',
      splitLine: { lineStyle: { color: isDark ? '#334155' : '#f1f5f9' } },
      axisLabel: { color: isDark ? '#94a3b8' : '#64748b' },
    },
    series: [
      {
        name: 'Distribusi Presisi',
        type: 'boxplot',
        data: stats.map((s) => s.stats.box),
        itemStyle: {
          color: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)',
          borderColor: colors.primary,
          borderWidth: 2,
        },
      },
    ],
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
      <ChartToolbar
        chartTitle={`Distribusi Presisi: Boxplot ${metric.toUpperCase()}`}
        chartDescription="Menampilkan sebaran statistik 5 angka (Min, Q1, Median, Q3, Max) dari metrik presisi antar metode. Model SAE yang baik menunjukkan penurunan drastis pada median dan rentang variasi error."
        onExport={handleExport}
        colorPalette={colorPalette}
        onChangePalette={onChangePalette}
      >
        {/* Metric Selector */}
        <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-700 dark:bg-slate-800">
          <button
            onClick={() => setMetric('rse')}
            className={`rounded-md px-3 py-1 text-xs font-medium transition ${
              metric === 'rse'
                ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-indigo-400'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            RSE (%)
          </button>
          <button
            onClick={() => setMetric('mse')}
            className={`rounded-md px-3 py-1 text-xs font-medium transition ${
              metric === 'mse'
                ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-indigo-400'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            MSE
          </button>
        </div>
      </ChartToolbar>

      <div className="p-4">
        <ReactECharts
          ref={chartRef}
          option={option}
          style={{ height: '420px', width: '100%' }}
          opts={{ renderer: 'svg' }}
        />
      </div>

      {/* Numerical Summary Table */}
      <div className="border-t border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Tabel Ringkasan Statistik 5-Angka ({metric.toUpperCase()})
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400">
                <th className="py-2 pr-4 font-semibold">Metode / Model</th>
                <th className="py-2 px-3 font-semibold text-right">Min</th>
                <th className="py-2 px-3 font-semibold text-right">Q1 (25%)</th>
                <th className="py-2 px-3 font-semibold text-right text-indigo-600 dark:text-indigo-400">Median</th>
                <th className="py-2 px-3 font-semibold text-right">Mean</th>
                <th className="py-2 px-3 font-semibold text-right">Q3 (75%)</th>
                <th className="py-2 px-3 font-semibold text-right">Maks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 dark:divide-slate-800 dark:text-slate-300">
              {stats.map((s) => (
                <tr key={s.label} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/50">
                  <td className="py-2 pr-4 font-medium text-slate-900 dark:text-slate-100">{s.label}</td>
                  <td className="py-2 px-3 text-right">{s.stats.min}</td>
                  <td className="py-2 px-3 text-right">{s.stats.q1}</td>
                  <td className="py-2 px-3 text-right font-bold text-indigo-600 dark:text-indigo-400">{s.stats.median}</td>
                  <td className="py-2 px-3 text-right font-medium">{s.stats.mean}</td>
                  <td className="py-2 px-3 text-right">{s.stats.q3}</td>
                  <td className="py-2 px-3 text-right">{s.stats.max}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
