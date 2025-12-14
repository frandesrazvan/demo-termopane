import { supabase } from '../lib/supabase';
import { CompanySettings } from '../types';

// Helper functions to convert between camelCase (TypeScript) and snake_case (Supabase)
// Note: Database uses default_glass_type_id and default_hardware_package_id
// but we keep the frontend interface as default_glass_id and default_hardware_id for consistency
const toSupabaseFormat = (settings: Omit<CompanySettings, 'id'>) => ({
  company_name: settings.company_name,
  logo_url: settings.logo_url ?? null,
  address: settings.address ?? null,
  phone: settings.phone ?? null,
  email: settings.email ?? null,
  registration_number: settings.registration_number ?? null,
  tax_id: settings.tax_id ?? null,
  default_profile_series_id: settings.default_profile_series_id ?? null,
  default_glass_type_id: settings.default_glass_id ?? null, // Map to database column name
  default_hardware_package_id: settings.default_hardware_id ?? null, // Map to database column name
});

const fromSupabaseFormat = (data: any): CompanySettings => ({
  id: data.id,
  company_name: data.company_name || '',
  logo_url: data.logo_url ?? undefined,
  address: data.address ?? undefined,
  phone: data.phone ?? undefined,
  email: data.email ?? undefined,
  registration_number: data.registration_number ?? undefined,
  tax_id: data.tax_id ?? undefined,
  default_profile_series_id: data.default_profile_series_id ?? null,
  default_glass_id: data.default_glass_type_id ?? null, // Map from database column name
  default_hardware_id: data.default_hardware_package_id ?? null, // Map from database column name
});

export const companySettingsService = {
  // Fetch company settings for the current user
  // NOTE: If the company_settings table doesn't exist, this will return null gracefully
  async get(): Promise<CompanySettings | null> {
    try {
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .maybeSingle();

      if (error) {
        // If table doesn't exist, return null instead of crashing
        if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
          console.warn('company_settings table does not exist yet. Skipping fetch.');
          return null;
        }
        console.error('Error fetching company settings:', error);
        throw error;
      }

      if (!data) {
        return null;
      }

      return fromSupabaseFormat(data);
    } catch (error) {
      // Gracefully handle missing table
      if (error instanceof Error && error.message?.includes('does not exist')) {
        console.warn('company_settings table does not exist yet. Skipping fetch.');
        return null;
      }
      throw error;
    }
  },

  // Create or update company settings
  // NOTE: If the company_settings table doesn't exist, this will fail gracefully
  async save(settings: Omit<CompanySettings, 'id'>): Promise<CompanySettings> {
    try {
      // First try to get existing settings
      const existing = await this.get();

      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from('company_settings')
          .update(toSupabaseFormat(settings))
          .eq('id', existing.id)
          .select()
          .single();

        if (error) {
          console.error('Error updating company settings:', error);
          throw error;
        }

        return fromSupabaseFormat(data);
      } else {
        // Create new
        const { data, error } = await supabase
          .from('company_settings')
          .insert([toSupabaseFormat(settings)])
          .select()
          .single();

        if (error) {
          // If table doesn't exist, log warning but don't crash
          if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
            console.warn('company_settings table does not exist yet. Cannot save settings.');
            throw new Error('company_settings table does not exist. Please create it in Supabase first.');
          }
          console.error('Error creating company settings:', error);
          throw error;
        }

        return fromSupabaseFormat(data);
      }
    } catch (error) {
      // Gracefully handle missing table
      if (error instanceof Error && error.message?.includes('does not exist')) {
        console.warn('company_settings table does not exist yet. Cannot save settings.');
        throw new Error('company_settings table does not exist. Please create it in Supabase first.');
      }
      throw error;
    }
  },
};

