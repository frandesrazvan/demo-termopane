import { create } from 'zustand';
import { Settings, Quote } from '../types';
import { profileSeriesService } from '../services/profileSeriesService';

interface AppState {
  settings: Settings;
  quotes: Quote[];
  isLoading: boolean;
  updateSettings: (settings: Partial<Settings>) => void;
  loadProfileSeries: () => Promise<void>;
  addProfileSeries: (profile: Omit<Settings['profileSeries'][0], 'id' | 'user_id'>) => Promise<void>;
  updateProfileSeries: (
    id: string,
    profile: Partial<Omit<Settings['profileSeries'][0], 'id' | 'user_id'>>
  ) => Promise<void>;
  deleteProfileSeries: (id: string) => Promise<void>;
  loadDefaultProfileTemplates: () => Promise<void>;
  addGlassType: (glass: Settings['glassTypes'][0]) => void;
  updateGlassType: (id: string, glass: Partial<Settings['glassTypes'][0]>) => void;
  deleteGlassType: (id: string) => void;
  addHardware: (hardware: Settings['hardwareOptions'][0]) => void;
  updateHardware: (id: string, hardware: Partial<Settings['hardwareOptions'][0]>) => void;
  deleteHardware: (id: string) => void;
  addQuote: (quote: Quote) => void;
}

const defaultSettings: Settings = {
  profileSeries: [],
  glassTypes: [
    { id: '1', name: 'Tripan 44mm', pricePerSqMeter: 180 },
    { id: '2', name: 'Dublu 24mm', pricePerSqMeter: 120 },
  ],
  hardwareOptions: [
    { id: '1', name: 'Roto NT', pricePerTurn: 85, pricePerTiltTurn: 145 },
    { id: '2', name: 'Siegenia', pricePerTurn: 95, pricePerTiltTurn: 165 },
  ],
  defaultLaborPercentage: 15,
  defaultMarginPercentage: 25,
};

export const useStore = create<AppState>((set) => ({
  settings: defaultSettings,
  quotes: [],
  isLoading: false,

  updateSettings: (newSettings) =>
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
    })),

  loadProfileSeries: async () => {
    try {
      set({ isLoading: true });
      const profileSeries = await profileSeriesService.getAll();
      set((state) => ({
        settings: {
          ...state.settings,
          profileSeries,
        },
        isLoading: false,
      }));
    } catch (error) {
      console.error('Failed to load profile series:', error);
      set({ isLoading: false });
      // Fall back to default data if Supabase fails
    }
  },

  addProfileSeries: async (profile) => {
    try {
      const newProfile = await profileSeriesService.create(profile);
      set((state) => ({
        settings: {
          ...state.settings,
          profileSeries: [...state.settings.profileSeries, newProfile],
        },
      }));
    } catch (error) {
      console.error('Failed to add profile series:', error);
      throw error;
    }
  },

  updateProfileSeries: async (id, profile) => {
    try {
      const updatedProfile = await profileSeriesService.update(id, profile);
      set((state) => ({
        settings: {
          ...state.settings,
          profileSeries: state.settings.profileSeries.map((p) =>
            p.id === id ? updatedProfile : p
          ),
        },
      }));
    } catch (error) {
      console.error('Failed to update profile series:', error);
      throw error;
    }
  },

  deleteProfileSeries: async (id) => {
    try {
      await profileSeriesService.delete(id);
      set((state) => ({
        settings: {
          ...state.settings,
          profileSeries: state.settings.profileSeries.filter((p) => p.id !== id),
        },
      }));
    } catch (error) {
      console.error('Failed to delete profile series:', error);
      throw error;
    }
  },

  loadDefaultProfileTemplates: async () => {
    try {
      set({ isLoading: true });
      const created = await profileSeriesService.createDefaultTemplates();
      set((state) => ({
        settings: {
          ...state.settings,
          profileSeries: [...state.settings.profileSeries, ...created],
        },
        isLoading: false,
      }));
    } catch (error) {
      console.error('Failed to load default profile templates:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  addGlassType: (glass) =>
    set((state) => ({
      settings: {
        ...state.settings,
        glassTypes: [...state.settings.glassTypes, glass],
      },
    })),

  updateGlassType: (id, glass) =>
    set((state) => ({
      settings: {
        ...state.settings,
        glassTypes: state.settings.glassTypes.map((g) =>
          g.id === id ? { ...g, ...glass } : g
        ),
      },
    })),

  deleteGlassType: (id) =>
    set((state) => ({
      settings: {
        ...state.settings,
        glassTypes: state.settings.glassTypes.filter((g) => g.id !== id),
      },
    })),

  addHardware: (hardware) =>
    set((state) => ({
      settings: {
        ...state.settings,
        hardwareOptions: [...state.settings.hardwareOptions, hardware],
      },
    })),

  updateHardware: (id, hardware) =>
    set((state) => ({
      settings: {
        ...state.settings,
        hardwareOptions: state.settings.hardwareOptions.map((h) =>
          h.id === id ? { ...h, ...hardware } : h
        ),
      },
    })),

  deleteHardware: (id) =>
    set((state) => ({
      settings: {
        ...state.settings,
        hardwareOptions: state.settings.hardwareOptions.filter((h) => h.id !== id),
      },
    })),

  addQuote: (quote) =>
    set((state) => ({
      quotes: [...state.quotes, quote],
    })),
}));
