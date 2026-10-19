import React, { useRef, useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { Dataset, ChartColorPalette } from '../../types/sae';
import { ChartToolbar } from '../ChartToolbar';
import { getPaletteColors } from '../../utils/palette';

interface ShrinkagePlotTabProps {
  dataset: Dataset;
  colorPalette: ChartColorPalette;
  onChangePalette: (palette: ChartColorPalette) => void;
  isDark: boolean;
}

export const ShrinkagePlotTab: React.FC<ShrinkagePlotTabProps> = ({
  dataset,
  colorPalette,
  onChangePalette,
  isDark,
}) => {
  const chartRef = useRef<ReactECharts>(null);
  const [selectedModel, setSelectedModel] = useState<string>(dataset.modelNames[0] || '');
  const [sortBy, setSortBy] = useState<'direct_est' | 'direct_se' | 'id'>('direct_est');
  const [showCi, setShowCi] = useState(true);

  const activeModel = dataset.modelNames.includes(selectedModel) ? selectedModel : dataset.modelNames[0] || '';
  const colors = getPaletteColors(colorPalette);

  const sortedData = useMemo(() => {
    const list = [...dataset.domains];
    if (sortBy === 'direct_est') {
      list.sort((a, b) => a.direct.estimate - b.direct.estimate);
    } else if (sortBy === 'direct_se') {
      list.sort((a, b) => (a.direct.se ?? 0) - (b.direct.se ?? 0));
    } else {
      list.sort((a, b) => a.domainId.localeCompare(b.domainId, undefined, { numeric: true }));
    }
    return list;
  }, [dataset, sortBy]);

  const categories = sortedData.map((d) => d.domainName);
  const directEsts = sortedData.map((d) => d.direct.estimate);
  const modelEsts = sortedData.map((d) => d.models[activeModel]?.estimate ?? 0);

  // Custom Series Data for CI error bars [index, lower, upper]
  const errorBarData = sortedData.map((d, index) => {
    const lower = d.direct.ciLower ?? d.direct.estimate;
    const upper = d.direct.ciUpper ?? d.direct.estimate;
    return [index, lower, upper];
  });

  const handleExport = (format: 'png' | 'svg', scale = 2) => {
    const echartInstance = chartRef.current?.getEchartsInstance();
    if (!echartInstance) return;

    const url = echartInstance.getDataURL({
      type: format,
      pixelRatio: scale,
      backgroundColor: isDark ? '#0f172a' : '#ffffff',
    });
    const link = document.createElement('a');
    link.download = `SAE_Shrinkage_${activeModel}.${format}`;
    link.href = url;
    link.click();
  };

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross', label: { backgroundColor: '#6a7985' } },
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      borderColor: isDark ? '#334155' : '#e2e8f0',
      textStyle: { color: isDark ? '#f8fafc' : '#0f172a' },
      formatter: (params: any) => {
        const idx = params[0]?.dataIndex;
        if (idx === undefined) return '';
        const d = sortedData[idx];
        const m = d.models[activeModel];
        return `
          <div style="font-weight: 700; margin-bottom: 4px;">${d.domainName} (${d.domainId})</div>
          <div style="font-size: 12px; line-height: 1.5;">
            <div>• <b>Direct:</b> ${d.direct.estimate} (RSE: ${d.direct.rse}%, SE: ${d.direct.se})</div>
            <div>• <b>95% CI Direct:</b> [${d.direct.ciLower} - ${d.direct.ciUpper}]</div>
            <div>• <b>${activeModel}:</b> ${m?.estimate} (RSE: ${m?.rse}%, SE: ${m?.se})</div>
            <div style="margin-top: 4px; padding-top: 4px; border-top: 1px dashed ${isDark ? '#475569' : '#e2e8f0'};">
              <b>Efek Shrinkage:</b> ${m?.shrinkage && m.shrinkage > 0 ? '+' : ''}${m?.shrinkage ?? 0}
            </div>
          </div>
        `;
      },
    },
    legend: {
      top: 15,
      textStyle: { color: isDark ? '#cbd5e1' : '#475569' },
      data: ['Penduga Langsung (Direct)', `Estimasi SAE (${activeModel})`],
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
        end: 100,
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
      name: 'Nilai Estimasi (%)',
      splitLine: { lineStyle: { color: isDark ? '#334155' : '#f1f5f9' } },
      axisLabel: { color: isDark ? '#94a3b8' : '#64748b' },
    },
    series: [
      {
        name: 'Penduga Langsung (Direct)',
        type: 'scatter',
        symbol: 'circle',
        symbolSize: 8,
        itemStyle: { color: colors.direct },
        data: directEsts,
        z: 3,
      },
      {
        name: `Estimasi SAE (${activeModel})`,
        type: 'scatter',
        symbol: 'diamond',
        symbolSize: 10,
        itemStyle: { color: colors.primary },
        data: modelEsts,
        z: 4,
      },
      ...(showCi
        ? [
            {
              type: 'custom',
              name: '95% CI Direct',
              itemStyle: { normal: { borderWidth: 1.5 } },
              renderItem: (params: any, api: any) => {
                const xVal = api.value(0);
                const low = api.value(1);
                const high = api.value(2);

                const lowPoint = api.coord([xVal, low]);
                const highPoint = api.coord([xVal, high]);
                const halfWidth = 3;

                const style = api.style({
                  stroke: isDark ? 'rgba(148, 163, 184, 0.45)' : 'rgba(100, 116, 139, 0.4)',
                  fill: null,
                  lineWidth: 1.5,
                });

                return {
                  type: 'group',
                  children: [
                    {
                      type: 'line',
                      transition: ['shape'],
                      shape: {
                        x1: lowPoint[0],
                        y1: lowPoint[1],
                        x2: highPoint[0],
                        y2: highPoint[1],
                      },
                      style: style,
                    },
                    {
                      type: 'line',
                      transition: ['shape'],
                      shape: {
                        x1: lowPoint[0] - halfWidth,
                        y1: lowPoint[1],
                        x2: lowPoint[0] + halfWidth,
                        y2: lowPoint[1],
                      },
                      style: style,
                    },
                    {
                      type: 'line',
                      transition: ['shape'],
                      shape: {
                        x1: highPoint[0] - halfWidth,
                        y1: highPoint[1],
                        x2: highPoint[0] + halfWidth,
                        y2: highPoint[1],
                      },
                      style: style,
                    },
                  ],
                };
              },
              data: errorBarData,
              z: 2,
            },
          ]
        : []),
    ],
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
      <ChartToolbar
        chartTitle="Caterpillar / Shrinkage Plot"
        chartDescription="Menampilkan titik estimasi langsung beserta interval kepercayaan 95% dibandingkan estimasi model SAE. Menunjukkan bagaimana model SAE 'menarik' nilai ekstrem menuju rata-rata sintetik secara proporsional sesuai tingkat varians/SE wilayah."
        onExport={handleExport}
        colorPalette={colorPalette}
        onChangePalette={onChangePalette}
      >
        {/* Model Selector */}
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

        {/* Sort Options */}
        <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3 dark:border-slate-700">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Urutkan:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="direct_est">Nilai Direct (Kecil → Besar)</option>
            <option value="direct_se">Varians/SE Direct</option>
            <option value="id">Kode Wilayah</option>
          </select>
        </div>

        {/* CI Toggle */}
        <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3 dark:border-slate-700">
          <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={showCi}
              onChange={(e) => setShowCi(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span>Error Bar (95% CI)</span>
          </label>
        </div>
      </ChartToolbar>

      {/* Info Badge */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-100 bg-slate-50/60 px-5 py-2 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors.direct }} />
            <span>Penduga Langsung (Direct)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rotate-45" style={{ backgroundColor: colors.primary }} />
            <span>Estimasi Model SAE ({activeModel})</span>
          </span>
        </div>
        <div className="text-[11px] text-slate-400">
          Gunakan slider di bawah grafik untuk zoom wilayah tertentu.
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
