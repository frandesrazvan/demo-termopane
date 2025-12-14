import { supabase } from '../lib/supabase';
import { ProfileSeries } from '../types';

// Helper functions to convert between camelCase (TypeScript) and snake_case (Supabase)
// NOTE: we intentionally NEVER send user_id from the client; Supabase sets it via defaults/RLS.
const toSupabaseFormat = (profile: Omit<ProfileSeries, 'id' | 'user_id'>) => ({
  name: profile.name,
  manufacturer: profile.manufacturer ?? null,
  profile_type: profile.profile_type ?? null,
  color_name: profile.color_name ?? null,
  price_per_meter: profile.pricePerMeter,
  color_category: profile.colorCategory,
  chambers: profile.chambers ?? 5,
  glass_width_deduction_mm: profile.glass_width_deduction_mm,
  glass_height_deduction_mm: profile.glass_height_deduction_mm,
});

const fromSupabaseFormat = (data: any): ProfileSeries => ({
  id: data.id,
  name: data.name,
  manufacturer: data.manufacturer ?? null,
  profile_type: data.profile_type ?? null,
  color_name: data.color_name ?? null,
  pricePerMeter: parseFloat(data.price_per_meter),
  colorCategory: data.color_category || data.color_name || '',
  chambers: data.chambers || 5, // Default to 5 if not present
  glass_width_deduction_mm: data.glass_width_deduction_mm ?? 24, // Default to 24 if not present
  glass_height_deduction_mm: data.glass_height_deduction_mm ?? 24, // Default to 24 if not present
  user_id: data.user_id ?? undefined,
});

const defaultTemplates: Omit<ProfileSeries, 'id' | 'user_id'>[] = [
  {
    name: 'Rehau 70mm',
    pricePerMeter: 45,
    colorCategory: 'Alb',
    chambers: 5,
    glass_width_deduction_mm: 24,
    glass_height_deduction_mm: 24,
  },
  {
    name: 'Rehau Synego',
    pricePerMeter: 58,
    colorCategory: 'Alb',
    chambers: 7,
    glass_width_deduction_mm: 24,
    glass_height_deduction_mm: 24,
  },
  {
    name: 'Salamander Bluevolution 82',
    pricePerMeter: 62,
    colorCategory: 'Alb',
    chambers: 7,
    glass_width_deduction_mm: 24,
    glass_height_deduction_mm: 24,
  },
  {
    name: 'Veka Softline 70',
    pricePerMeter: 50,
    colorCategory: 'Alb',
    chambers: 5,
    glass_width_deduction_mm: 24,
    glass_height_deduction_mm: 24,
  },
];

export const profileSeriesService = {
  // Fetch all profile series from Supabase
  async getAll(): Promise<ProfileSeries[]> {
    const { data, error } = await supabase
      .from('profile_series')
      .select('*')
      .order('manufacturer')
      .order('name');

    if (error) {
      console.error('Error fetching profile series:', error);
      throw error;
    }

    return (data || []).map(fromSupabaseFormat);
  },

  // Create a new profile series
  async create(profile: Omit<ProfileSeries, 'id' | 'user_id'>): Promise<ProfileSeries> {
    const { data, error } = await supabase
      .from('profile_series')
      .insert([toSupabaseFormat(profile)])
      .select()
      .single();

    if (error) {
      console.error('Error creating profile series:', error);
      throw error;
    }

    return fromSupabaseFormat(data);
  },

  // Update an existing profile series
  async update(
    id: string,
    updates: Partial<Omit<ProfileSeries, 'id' | 'user_id'>>
  ): Promise<ProfileSeries> {
    const supabaseUpdates: any = {};
    if (updates.name !== undefined) supabaseUpdates.name = updates.name;
    if (updates.manufacturer !== undefined) supabaseUpdates.manufacturer = updates.manufacturer ?? null;
    if (updates.profile_type !== undefined) supabaseUpdates.profile_type = updates.profile_type ?? null;
    if (updates.color_name !== undefined) supabaseUpdates.color_name = updates.color_name ?? null;
    if (updates.pricePerMeter !== undefined) supabaseUpdates.price_per_meter = updates.pricePerMeter;
    if (updates.colorCategory !== undefined) supabaseUpdates.color_category = updates.colorCategory;
    if (updates.chambers !== undefined) supabaseUpdates.chambers = updates.chambers;
    if (updates.glass_width_deduction_mm !== undefined) supabaseUpdates.glass_width_deduction_mm = updates.glass_width_deduction_mm;
    if (updates.glass_height_deduction_mm !== undefined) supabaseUpdates.glass_height_deduction_mm = updates.glass_height_deduction_mm;

    const { data, error } = await supabase
      .from('profile_series')
      .update(supabaseUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile series:', error);
      throw error;
    }

    return fromSupabaseFormat(data);
  },

  // Delete a profile series
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('profile_series')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting profile series:', error);
      throw error;
    }
  },

  // Insert a set of default Romanian profile templates for the current user
  async createDefaultTemplates(): Promise<ProfileSeries[]> {
    const { data, error } = await supabase
      .from('profile_series')
      .insert(defaultTemplates.map(toSupabaseFormat))
      .select('*');

    if (error) {
      console.error('Error creating default profile templates:', error);
      throw error;
    }

    return (data || []).map(fromSupabaseFormat);
  },
};


