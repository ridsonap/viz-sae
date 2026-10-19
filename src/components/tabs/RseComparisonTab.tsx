import React, { useRef, useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { Dataset, ChartColorPalette } from '../../types/sae';
import { ChartToolbar } from '../ChartToolbar';
import { getPaletteColors } from '../../utils/palette';
import { Filter, CheckCircle2, AlertTriangle } from 'lucide-react';

interface RseComparisonTabProps {
  dataset: Dataset;
  colorPalette: ChartColorPalette;
  onChangePalette: (palette: ChartColorPalette) => void;
  isDark: boolean;
}

export const RseComparisonTab: React.FC<RseComparisonTabProps> = ({
  dataset,
  colorPalette,
  onChangePalette,
  isDark,
}) => {
  const chartRef = useRef<ReactECharts>(null);
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
  const [filterHighRseOnly, setFilterHighRseOnly] = useState(false);
  const [selectedModels, setSelectedModels] = useState<string[]>(dataset.modelNames);

  const colors = getPaletteColors(colorPalette);

  // Filter domains
  const displayedDomains = useMemo(() => {
    if (!filterHighRseOnly) return dataset.domains;
    return dataset.domains.filter((d) => d.direct.rse >= dataset.threshold);
  }, [dataset, filterHighRseOnly]);

  const categories = displayedDomains.map((d) => d.domainName);

  // Calculate counts for stats
  const totalDomains = dataset.domains.length;
  const directUnreliable = dataset.domains.filter((d) => d.direct.rse >= dataset.threshold).length;

  const handleExport = (format: 'png' | 'svg', scale = 2) => {
    const echartInstance = chartRef.current?.getEchartsInstance();
    if (!echartInstance) return;

    const url = echartInstance.getDataURL({
      type: format,
      pixelRatio: scale,
      backgroundColor: isDark ? '#0f172a' : '#ffffff',
    });
    const link = document.createElement('a');
    link.download = `SAE_RSE_Comparison.${format}`;
    link.href = url;
    link.click();
  };

  const modelColorList = [colors.primary, colors.secondary, colors.tertiary, colors.quaternary];

  const seriesList = [
    {
      name: 'Penduga Langsung (Direct)',
      type: chartType,
      data: displayedDomains.map((d) => d.direct.rse),
      itemStyle: { color: colors.direct },
      barMaxWidth: 16,
      markLine: {
        symbol: 'none',
        lineStyle: {
          color: isDark ? '#ef4444' : '#dc2626',
          width: 2,
          type: 'dashed',
        },
        data: [
          {
            yAxis: dataset.threshold,
            name: `Batas Reliabilitas (${dataset.threshold}%)`,
            label: {
              formatter: `Batas RSE ${dataset.threshold}% (BPS)`,
              position: 'insideEndTop',
              color: isDark ? '#f87171' : '#dc2626',
              fontSize: 11,
              fontWeight: 600,
            },
          },
        ],
      },
    },
    ...selectedModels.map((mName, i) => ({
      name: mName,
      type: chartType,
      data: displayedDomains.map((d) => d.models[mName]?.rse ?? 0),
      itemStyle: { color: modelColorList[i % modelColorList.length] },
      barMaxWidth: 16,
    })),
  ];

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      borderColor: isDark ? '#334155' : '#e2e8f0',
      textStyle: { color: isDark ? '#f8fafc' : '#0f172a' },
      formatter: (params: any[]) => {
        if (!params || params.length === 0) return '';
        const idx = params[0].dataIndex;
        const d = displayedDomains[idx];
        if (!d) return '';

        let content = `<div style="font-weight: 700; margin-bottom: 4px;">${d.domainName} (${d.domainId})</div>`;
        content += `<div style="font-size: 12px; line-height: 1.6;">`;

        params.forEach((p) => {
          const val = Number(p.value);
          const isOver = val >= dataset.threshold;
          content += `
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px;">
              <span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color};margin-right:6px;"></span>${p.seriesName}:</span>
              <span style="font-weight: 600; color: ${isOver ? '#ef4444' : '#10b981'};">
                ${val}% ${isOver ? '⚠️' : '✓'}
              </span>
            </div>
          `;
        });

        content += `</div>`;
        return content;
      },
    },
    legend: {
      top: 15,
      textStyle: { color: isDark ? '#cbd5e1' : '#475569' },
    },
    grid: {
      top: 60,
      right: 30,
      bottom: 85,
      left: 60,
    },
    dataZoom: [
      {
        type: 'slider',
        show: true,
        start: 0,
        end: displayedDomains.length > 25 ? 40 : 100,
        bottom: 15,
        height: 20,
        borderColor: isDark ? '#334155' : '#e2e8f0',
        textStyle: { color: isDark ? '#94a3b8' : '#64748b' },
      },
      { type: 'inside' },
    ],
    xAxis: {
      type: 'category',
      data: categories,
      axisLabel: {
        rotate: 45,
        interval: 0,
        fontSize: 10,
        color: isDark ? '#94a3b8' : '#64748b',
      },
      axisLine: { lineStyle: { color: isDark ? '#64748b' : '#cbd5e1' } },
    },
    yAxis: {
      type: 'value',
      name: 'RSE / CV (%)',
      splitLine: { lineStyle: { color: isDark ? '#334155' : '#f1f5f9' } },
      axisLabel: { color: isDark ? '#94a3b8' : '#64748b' },
    },
    series: seriesList,
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
      <ChartToolbar
        chartTitle="Komparasi Presisi: Relative Standard Error (RSE / CV)"
        chartDescription="Membandingkan RSE antar metode untuk setiap domain. Garis merah putus-putus menunjukkan batas 25% (standar reliabilitas BPS). Nilai RSE di bawah 25% dianggap reliabel untuk publikasi statistik resmi."
        onExport={handleExport}
        colorPalette={colorPalette}
        onChangePalette={onChangePalette}
      >
        {/* Chart Style Switcher */}
        <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-700 dark:bg-slate-800">
          <button
            onClick={() => setChartType('bar')}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
              chartType === 'bar'
                ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-indigo-400'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Grouped Bar
          </button>
          <button
            onClick={() => setChartType('line')}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
              chartType === 'line'
                ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-indigo-400'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Multi-Line
          </button>
        </div>

        {/* Filter High RSE */}
        <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3 dark:border-slate-700">
          <label className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={filterHighRseOnly}
              onChange={(e) => setFilterHighRseOnly(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <span>Hanya RSE Direct ≥ 25%</span>
          </label>
        </div>
      </ChartToolbar>

      {/* Summary Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 border-b border-slate-100 bg-slate-50/70 p-3.5 text-xs dark:border-slate-800 dark:bg-slate-900/50">
        <div className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-800/80">
          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
          <div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">Direct Estimator Tidak Reliabel (RSE ≥ 25%)</div>
            <div className="font-bold text-slate-800 dark:text-slate-100">
              {directUnreliable} dari {totalDomains} wilayah ({((directUnreliable / totalDomains) * 100).toFixed(1)}%)
            </div>
          </div>
        </div>

        {dataset.modelNames.map((mName) => {
          const mUnreliable = dataset.domains.filter((d) => (d.models[mName]?.rse ?? 0) >= dataset.threshold).length;
          const reliableCount = totalDomains - mUnreliable;
          const pct = ((reliableCount / totalDomains) * 100).toFixed(1);
          return (
            <div
              key={mName}
              className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-800/80"
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {mName} Lolos Reliabilitas (&lt; 25%)
                </div>
                <div className="font-bold text-emerald-600 dark:text-emerald-400">
                  {reliableCount} dari {totalDomains} wilayah ({pct}%)
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-4">
        <ReactECharts
          ref={chartRef}
          option={option}
          style={{ height: '520px', width: '100%' }}
          opts={{ renderer: 'svg' }}
        />
      </div>
    </div>
  );
};
