import React, { useRef, useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { Dataset, ChartColorPalette } from '../../types/sae';
import { ChartToolbar } from '../ChartToolbar';
import { getPaletteColors } from '../../utils/palette';

interface ScatterPlotTabProps {
  dataset: Dataset;
  colorPalette: ChartColorPalette;
  onChangePalette: (palette: ChartColorPalette) => void;
  isDark: boolean;
}

export const ScatterPlotTab: React.FC<ScatterPlotTabProps> = ({
  dataset,
  colorPalette,
  onChangePalette,
  isDark,
}) => {
  const chartRef = useRef<ReactECharts>(null);
  const [selectedModel, setSelectedModel] = useState<string>(dataset.modelNames[0] || '');
  const [show45Line, setShow45Line] = useState(true);
  const [showRegression, setShowRegression] = useState(true);

  // If selected model is not in modelNames, reset
  const activeModel = dataset.modelNames.includes(selectedModel) ? selectedModel : dataset.modelNames[0] || '';

  const colors = getPaletteColors(colorPalette);

  // Calculate regression statistics
  const { points, minVal, maxVal, regLine, rSquared, corr } = useMemo(() => {
    const pts = dataset.domains.map((d) => ({
      name: d.domainName,
      id: d.domainId,
      x: d.direct.estimate,
      y: d.models[activeModel]?.estimate ?? 0,
      rseDir: d.direct.rse,
      rseModel: d.models[activeModel]?.rse ?? 0,
    }));

    if (pts.length === 0) {
      return { points: [], minVal: 0, maxVal: 100, regLine: [], rSquared: 0, corr: 0 };
    }

    const allVals = pts.flatMap((p) => [p.x, p.y]);
    const minVal = Math.floor(Math.min(...allVals) * 0.85);
    const maxVal = Math.ceil(Math.max(...allVals) * 1.15);

    // Linear regression
    const n = pts.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0, sumYY = 0;
    pts.forEach((p) => {
      sumX += p.x;
      sumY += p.y;
      sumXY += p.x * p.y;
      sumXX += p.x * p.x;
      sumYY += p.y * p.y;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX || 1);
    const intercept = (sumY - slope * sumX) / n;

    // Pearson r
    const num = n * sumXY - sumX * sumY;
    const den = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY)) || 1;
    const r = num / den;
    const r2 = r * r;

    const regLine = [
      [minVal, minVal * slope + intercept],
      [maxVal, maxVal * slope + intercept],
    ];

    return {
      points: pts,
      minVal,
      maxVal,
      regLine,
      rSquared: Number(r2.toFixed(3)),
      corr: Number(r.toFixed(3)),
    };
  }, [dataset, activeModel]);

  const handleExport = (format: 'png' | 'svg', scale = 2) => {
    const echartInstance = chartRef.current?.getEchartsInstance();
    if (!echartInstance) return;

    if (format === 'svg') {
      const url = echartInstance.getDataURL({
        type: 'svg',
        pixelRatio: scale,
        backgroundColor: isDark ? '#0f172a' : '#ffffff',
      });
      const link = document.createElement('a');
      link.download = `SAE_Scatter_${activeModel}.svg`;
      link.href = url;
      link.click();
    } else {
      const url = echartInstance.getDataURL({
        type: 'png',
        pixelRatio: scale,
        backgroundColor: isDark ? '#0f172a' : '#ffffff',
      });
      const link = document.createElement('a');
      link.download = `SAE_Scatter_${activeModel}_${scale}x.png`;
      link.href = url;
      link.click();
    }
  };

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      borderColor: isDark ? '#334155' : '#e2e8f0',
      textStyle: { color: isDark ? '#f8fafc' : '#0f172a' },
      formatter: (params: any) => {
        if (params.seriesType === 'scatter') {
          const d = points[params.dataIndex];
          if (!d) return '';
          const diff = Number((d.y - d.x).toFixed(3));
          return `
            <div style="font-weight: 700; margin-bottom: 4px;">${d.name} (${d.id})</div>
            <div style="font-size: 12px; line-height: 1.5;">
              <div>• <b>Direct Estimate:</b> ${d.x} <span style="color: #94a3b8;">(RSE: ${d.rseDir}%)</span></div>
              <div>• <b>${activeModel}:</b> ${d.y} <span style="color: ${colors.primary}; font-weight: 600;">(RSE: ${d.rseModel}%)</span></div>
              <div style="margin-top: 4px; padding-top: 4px; border-top: 1px dashed ${isDark ? '#475569' : '#e2e8f0'};">
                <b>Selisih (Shrinkage):</b> ${diff > 0 ? '+' : ''}${diff}
              </div>
            </div>
          `;
        }
        return params.seriesName;
      },
    },
    grid: {
      top: 60,
      right: 40,
      bottom: 60,
      left: 70,
    },
    xAxis: {
      name: 'Penduga Langsung (Direct Estimate)',
      nameLocation: 'center',
      nameGap: 35,
      type: 'value',
      min: minVal,
      max: maxVal,
      splitLine: { lineStyle: { color: isDark ? '#334155' : '#f1f5f9' } },
      axisLine: { lineStyle: { color: isDark ? '#64748b' : '#cbd5e1' } },
      axisLabel: { color: isDark ? '#94a3b8' : '#64748b' },
    },
    yAxis: {
      name: `Estimasi SAE (${activeModel})`,
      nameLocation: 'center',
      nameGap: 45,
      type: 'value',
      min: minVal,
      max: maxVal,
      splitLine: { lineStyle: { color: isDark ? '#334155' : '#f1f5f9' } },
      axisLine: { lineStyle: { color: isDark ? '#64748b' : '#cbd5e1' } },
      axisLabel: { color: isDark ? '#94a3b8' : '#64748b' },
    },
    legend: {
      top: 15,
      textStyle: { color: isDark ? '#cbd5e1' : '#475569' },
    },
    series: [
      {
        name: `${activeModel} vs Direct`,
        type: 'scatter',
        symbolSize: 10,
        itemStyle: {
          color: colors.primary,
          shadowBlur: 6,
          shadowColor: isDark ? 'rgba(99, 102, 241, 0.4)' : 'rgba(99, 102, 241, 0.25)',
        },
        data: points.map((p) => [p.x, p.y]),
      },
      ...(show45Line
        ? [
            {
              name: 'Garis Identitas (y = x)',
              type: 'line',
              symbol: 'none',
              data: [
                [minVal, minVal],
                [maxVal, maxVal],
              ],
              lineStyle: {
                color: isDark ? '#ef4444' : '#dc2626',
                width: 1.8,
                type: 'dashed',
              },
            },
          ]
        : []),
      ...(showRegression
        ? [
            {
              name: `Garis Tren Regresi (R² = ${rSquared})`,
              type: 'line',
              symbol: 'none',
              data: regLine,
              lineStyle: {
                color: isDark ? '#10b981' : '#059669',
                width: 1.5,
              },
            },
          ]
        : []),
    ],
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
      <ChartToolbar
        chartTitle="Scatter Plot: Penduga Langsung vs Model SAE"
        chartDescription="Membandingkan nilai estimasi SAE terhadap estimasi langsung. Titik yang berada dekat garis 45° menandakan estimasi SAE tidak mengalami bias sistematik."
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

        {/* Toggles */}
        <div className="flex items-center gap-3 border-l border-slate-200 pl-3 dark:border-slate-700">
          <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={show45Line}
              onChange={(e) => setShow45Line(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span>Garis 45°</span>
          </label>
          <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={showRegression}
              onChange={(e) => setShowRegression(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span>Garis Regresi</span>
          </label>
        </div>
      </ChartToolbar>

      {/* Info Badge */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-100 bg-slate-50/60 px-5 py-2 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400">
        <div className="flex items-center gap-4">
          <span>
            Koefisien Korelasi (r): <b className="text-slate-800 dark:text-slate-100">{corr}</b>
          </span>
          <span>
            Koefisien Determinasi (R²): <b className="text-slate-800 dark:text-slate-100">{rSquared}</b>
          </span>
          <span>
            Total Domain: <b className="text-slate-800 dark:text-slate-100">{points.length}</b>
          </span>
        </div>
        <div className="text-[11px] text-slate-400">
          Tips: Arahkan kursor ke titik scatter untuk detail wilayah & efek shrinkage.
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
