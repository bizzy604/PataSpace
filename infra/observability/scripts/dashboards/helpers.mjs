/**
 * Purpose: Shared builders for Grafana dashboard JSON — panels, layout, and
 *   the dashboard envelope.
 * Why important: Dashboards are generated, not hand-edited, so both stay
 *   consistent and diffs stay reviewable. One change here restyles everything.
 * Used by: api-dashboard.mjs, infra-dashboard.mjs via generate-dashboards.mjs.
 */

const DATASOURCE = { type: 'prometheus', uid: 'pataspace-prometheus' };
const REF_IDS = 'ABCDEFGHIJ';

export function target(expr, legendFormat = '') {
  return { expr, legendFormat, datasource: DATASOURCE };
}

function baseFieldConfig(unit, overridesDefaults = {}) {
  return {
    defaults: {
      unit,
      ...overridesDefaults,
    },
    overrides: [],
  };
}

export function timeseries({ title, targets, unit = 'short', w = 12, h = 8, min = 0, max }) {
  return {
    kind: 'panel',
    w,
    h,
    panel: {
      type: 'timeseries',
      title,
      datasource: DATASOURCE,
      targets,
      fieldConfig: baseFieldConfig(unit, {
        min,
        ...(max !== undefined ? { max } : {}),
        custom: { fillOpacity: 10, showPoints: 'never', lineWidth: 1 },
      }),
      options: {
        legend: { displayMode: 'list', placement: 'bottom', showLegend: true },
        tooltip: { mode: 'multi', sort: 'desc' },
      },
    },
  };
}

export function stat({ title, targets, unit = 'short', w = 6, h = 4, decimals, thresholds }) {
  return {
    kind: 'panel',
    w,
    h,
    panel: {
      type: 'stat',
      title,
      datasource: DATASOURCE,
      targets,
      fieldConfig: baseFieldConfig(unit, {
        ...(decimals !== undefined ? { decimals } : {}),
        thresholds: thresholds ?? {
          mode: 'absolute',
          steps: [{ color: 'text', value: null }],
        },
      }),
      options: {
        reduceOptions: { calcs: ['lastNotNull'], fields: '', values: false },
        colorMode: 'value',
        graphMode: 'area',
        orientation: 'auto',
      },
    },
  };
}

export function upDownThresholds() {
  return {
    mode: 'absolute',
    steps: [
      { color: 'red', value: null },
      { color: 'green', value: 1 },
    ],
  };
}

// Packs panels left-to-right into 24-unit-wide rows, wrapping when full.
export function layout(entries) {
  const panels = [];
  let x = 0;
  let y = 0;
  let rowHeight = 0;
  let panelId = 1;

  for (const entry of entries) {
    if (x + entry.w > 24) {
      x = 0;
      y += rowHeight;
      rowHeight = 0;
    }

    const targets = entry.panel.targets.map((panelTarget, index) => ({
      ...panelTarget,
      refId: REF_IDS[index],
    }));

    panels.push({
      ...entry.panel,
      id: panelId,
      targets,
      gridPos: { x, y, w: entry.w, h: entry.h },
    });
    panelId += 1;
    x += entry.w;
    rowHeight = Math.max(rowHeight, entry.h);
  }

  return panels;
}

export function dashboard({ uid, title, description, entries }) {
  return {
    uid,
    title,
    description,
    tags: ['pataspace', 'generated'],
    timezone: 'browser',
    editable: true,
    graphTooltip: 1,
    refresh: '30s',
    time: { from: 'now-6h', to: 'now' },
    schemaVersion: 39,
    templating: { list: [] },
    annotations: { list: [] },
    panels: layout(entries),
  };
}
