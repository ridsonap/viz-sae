import React, { useRef, useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { Dataset, ChartColorPalette } from '../../types/sae';
import { ChartToolbar } from '../ChartToolbar';
import { getPaletteColors } from '../../utils/palette';
import { Zap, TrendingUp } from 'lucide-react';

interface RelativeEfficiencyTabProps {
  dataset: Dataset;
  colorPalette: ChartColorPalette;
  onChangePalette: (palette: ChartColorPalette) => void;
  isDark: boolean;
}

export const RelativeEfficiencyTab: React.FC<RelativeEfficiencyTabProps> = ({
  dataset,
  colorPalette,
  onChangePalette,
  isDark,
}) => {
  const chartRef = useRef<ReactECharts>(null);
  const [selectedModel, setSelectedModel] = useState<string>(dataset.modelNames[0] || '');
  const [sortBy, setSortBy] = useState<'re_desc' | 'id'>('re_desc');

  const activeModel = dataset.modelNames.includes(selectedModel) ? selectedModel : dataset.modelNames[0] || '';
  const colors = getPaletteColors(colorPalette);

  const sortedData = useMemo(() => {
    const list = [...dataset.domains];
    if (sortBy === 're_desc') {
      list.sort((a, b) => (b.models[activeModel]?.re ?? 1) - (a.models[activeModel]?.re ?? 1));
    } else {
      list.sort((a, b) => a.domainId.localeCompare(b.domainId, undefined, { numeric: true }));
    }
    return list;
  }, [dataset, activeModel, sortBy]);

  const categories = sortedData.map((d) => d.domainName);
  const reValues = sortedData.map((d) => d.models[activeModel]?.re ?? 1);

  const avgRe = useMemo(() => {
    if (reValues.length === 0) return 1;
    return Number((reValues.reduce((a, b) => a + b, 0) / reValues.length).toFixed(2));
  }, [reValues]);

  const superiorCount = reValues.filter((r) => r > 1.0).length;
  const superiorPct = ((superiorCount / (reValues.length || 1)) * 100).toFixed(1);

  const handleExport = (format: 'png' | 'svg', scale = 2) => {
    const echartInstance = chartRef.current?.getEchartsInstance();
    if (!echartInstance) return;

    const url = echartInstance.getDataURL({
      type: format,
      pixelRatio: scale,
      backgroundColor: isDark ? '#0f172a' : '#ffffff',
    });
    const link = document.createElement('a');
    link.download = `SAE_Relative_Efficiency_${activeModel}.${format}`;
    link.href = url;
    link.click();
  };

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
        const d = sortedData[idx];
        const m = d.models[activeModel];
        const re = m?.re ?? 1;
        return `
          <div style="font-weight: 700; margin-bottom: 4px;">${d.domainName} (${d.domainId})</div>
          <div style="font-size: 12px; line-height: 1.6;">
            <div>• <b>Relative Efficiency (RE):</b> <span style="font-weight:700; color:${colors.primary};">${re}x</span></div>
            <div>• <b>MSE Direct:</b> ${d.direct.mse}</div>
            <div>• <b>MSE ${activeModel}:</b> ${m?.mse}</div>
            <div style="margin-top:4px; padding-top:4px; border-top:1px dashed ${isDark ? '#475569' : '#e2e8f0'}; color:${re > 1 ? '#10b981' : '#ef4444'};">
              ${re > 1 ? `Model ${((re - 1) * 100).toFixed(1)}% lebih efisien dari direct` : 'Efisiensi setara/lebih rendah'}
            </div>
          </div>
        `;
      },
    },
    grid: {
      top: 50,
      right: 30,
      bottom: 85,
      left: 60,
    },
    dataZoom: [
      {
        type: 'slider',
        show: true,
        start: 0,
        end: sortedData.length > 25 ? 40 : 100,
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
      name: 'Relative Efficiency (RE)',
      splitLine: { lineStyle: { color: isDark ? '#334155' : '#f1f5f9' } },
      axisLabel: { color: isDark ? '#94a3b8' : '#64748b' },
    },
    series: [
      {
        name: `Relative Efficiency (${activeModel})`,
        type: 'bar',
        data: reValues,
        itemStyle: {
          color: (params: any) => {
            const v = params.value;
            return v >= 1.0 ? colors.primary : '#ef4444';
          },
          borderRadius: [4, 4, 0, 0],
        },
        barMaxWidth: 20,
        markLine: {
          symbol: 'none',
          data: [
            {
              yAxis: 1.0,
              lineStyle: { color: isDark ? '#ef4444' : '#dc2626', type: 'dashed', width: 2 },
              label: {
                formatter: 'Baseline Direct (RE = 1.0)',
                position: 'insideEndTop',
                color: isDark ? '#f87171' : '#dc2626',
                fontWeight: 600,
              },
            },
          ],
        },
      },
    ],
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
      <ChartToolbar
        chartTitle="Relative Efficiency (RE = MSE Direct / MSE SAE)"
        chartDescription="Menunjukkan peningkatan presisi model SAE terhadap penduga langsung. Nilai RE > 1 menandakan estimasi SAE memiliki variabilitas/MSE yang lebih kecil (lebih presisi dan efisien)."
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

        <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3 dark:border-slate-700">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Urutkan:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="re_desc">Efisiensi Tertinggi → Terendah</option>
            <option value="id">Kode Wilayah</option>
          </select>
        </div>
      </ChartToolbar>

      {/* KPI Highlight */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border-b border-slate-100 bg-slate-50/70 p-3.5 text-xs dark:border-slate-800 dark:bg-slate-900/50">
        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-800/80">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">Rata-rata Relative Efficiency ({activeModel})</div>
            <div className="text-base font-bold text-slate-900 dark:text-slate-100">
              {avgRe}x Lebih Efisien
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-800/80">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">Domain dengan Gain Efisiensi (RE &gt; 1.0)</div>
            <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">
              {superiorCount} dari {reValues.length} Wilayah ({superiorPct}%)
            </div>
          </div>
        </div>
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
