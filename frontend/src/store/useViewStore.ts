import { create } from 'zustand';

export const viewKeys = [
  'dashboard',
  'metric-list',
  'metric-detail',
  'caliber',
  'dimension',
  'version',
  'upload',
  'jobs',
  'system',
] as const;

export type ViewKey = (typeof viewKeys)[number];

interface ViewState {
  activeView: ViewKey;
  selectedMetricId: number | null;
  setActiveView: (view: ViewKey) => void;
  setSelectedMetricId: (metricId: number | null) => void;
}

export const useViewStore = create<ViewState>((set) => ({
  activeView: 'dashboard',
  selectedMetricId: null,
  setActiveView: (view) => set({ activeView: view }),
  setSelectedMetricId: (metricId) => set({ selectedMetricId: metricId }),
}));
