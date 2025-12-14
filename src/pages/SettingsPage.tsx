import { useState, useEffect, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { Plus, Trash2, Save } from 'lucide-react';
import { companySettingsService } from '../services/companySettingsService';
import { CompanySettings } from '../types';

export default function SettingsPage() {
  const {
    settings,
    isLoading,
    updateSettings,
    loadProfileSeries,
    addProfileSeries,
    updateProfileSeries,
    deleteProfileSeries,
    loadDefaultProfileTemplates,
    addGlassType,
    updateGlassType,
    deleteGlassType,
    addHardware,
    updateHardware,
    deleteHardware,
  } = useStore();

  useEffect(() => {
    loadProfileSeries();
    loadCompanySettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Company settings state
  const [companySettings, setCompanySettings] = useState<Omit<CompanySettings, 'id'>>({
    company_name: '',
    logo_url: '',
    address: '',
    phone: '',
    email: '',
    registration_number: '',
    tax_id: '',
    default_profile_series_id: null,
    default_glass_id: null,
    default_hardware_id: null,
  });
  const [isSavingCompany, setIsSavingCompany] = useState(false);

  const loadCompanySettings = async () => {
    try {
      const settings = await companySettingsService.get();
      if (settings) {
        setCompanySettings({
          company_name: settings.company_name,
          logo_url: settings.logo_url || '',
          address: settings.address || '',
          phone: settings.phone || '',
          email: settings.email || '',
          registration_number: settings.registration_number || '',
          tax_id: settings.tax_id || '',
          default_profile_series_id: settings.default_profile_series_id,
          default_glass_id: settings.default_glass_id,
          default_hardware_id: settings.default_hardware_id,
        });
      }
    } catch (error) {
      console.error('Failed to load company settings:', error);
      // Don't show error if table doesn't exist
    }
  };

  const handleSaveCompanySettings = async () => {
    if (!companySettings.company_name.trim()) {
      showToast('error', 'Numele firmei este obligatoriu.');
      return;
    }

    setIsSavingCompany(true);
    try {
      await companySettingsService.save(companySettings);
      showToast('success', 'Informațiile firmei au fost salvate cu succes.');
    } catch (error) {
      console.error('Failed to save company settings:', error);
      showToast('error', 'Eroare la salvarea informațiilor firmei. Te rugăm să încerci din nou.');
    } finally {
      setIsSavingCompany(false);
    }
  };

  // Group profiles by manufacturer for display
  const profilesByManufacturer = useMemo(() => {
    const grouped: Record<string, typeof settings.profileSeries> = {};
    settings.profileSeries.forEach((profile) => {
      const manufacturer = profile.manufacturer || 'Fără producător';
      if (!grouped[manufacturer]) {
        grouped[manufacturer] = [];
      }
      grouped[manufacturer].push(profile);
    });
    // Sort manufacturers alphabetically
    return Object.keys(grouped)
      .sort()
      .reduce((acc, key) => {
        acc[key] = grouped[key];
        return acc;
      }, {} as Record<string, typeof settings.profileSeries>);
  }, [settings.profileSeries]);

  // Get unique manufacturer suggestions
  const manufacturerSuggestions = useMemo(() => {
    const manufacturers = new Set<string>();
    settings.profileSeries.forEach((p) => {
      if (p.manufacturer) {
        manufacturers.add(p.manufacturer);
      }
    });
    return Array.from(manufacturers).sort();
  }, [settings.profileSeries]);

  const [newProfile, setNewProfile] = useState({ 
    name: '', 
    manufacturer: '',
    profile_type: '',
    color_name: '',
    pricePerMeter: '', 
    colorCategory: '', 
    chambers: '5',
    glass_width_deduction_mm: '24',
    glass_height_deduction_mm: '24',
  });
  const [newGlass, setNewGlass] = useState({ name: '', thickness_mm: '', pricePerSqMeter: '' });
  const [newHardware, setNewHardware] = useState({ manufacturer: '', name: '', pricePerPack: '' });
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddProfile = async () => {
    if (newProfile.name && newProfile.pricePerMeter && newProfile.chambers) {
      try {
        await addProfileSeries({
          name: newProfile.name,
          manufacturer: newProfile.manufacturer || null,
          profile_type: newProfile.profile_type || null,
          color_name: newProfile.color_name || null,
          pricePerMeter: parseFloat(newProfile.pricePerMeter),
          colorCategory: newProfile.color_name || newProfile.colorCategory || '',
          chambers: parseInt(newProfile.chambers),
          glass_width_deduction_mm: parseInt(newProfile.glass_width_deduction_mm) || 24,
          glass_height_deduction_mm: parseInt(newProfile.glass_height_deduction_mm) || 24,
        });
        setNewProfile({ 
          name: '', 
          manufacturer: '',
          profile_type: '',
          color_name: '',
          pricePerMeter: '', 
          colorCategory: '', 
          chambers: '5',
          glass_width_deduction_mm: '24',
          glass_height_deduction_mm: '24',
        });
        showToast('success', 'Seria de profil a fost adăugată cu succes.');
      } catch (error) {
        console.error('Failed to add profile series:', error);
        showToast('error', 'Eroare la adăugarea seriei de profil. Te rugăm să încerci din nou.');
      }
    }
  };

  const handleAddGlass = () => {
    if (newGlass.name && newGlass.pricePerSqMeter) {
      addGlassType({
        id: Date.now().toString(),
        name: newGlass.name,
        pricePerSqMeter: parseFloat(newGlass.pricePerSqMeter),
      });
      setNewGlass({ name: '', thickness_mm: '', pricePerSqMeter: '' });
    }
  };

  const handleAddHardware = () => {
    if (newHardware.manufacturer && newHardware.name && newHardware.pricePerPack) {
      // For now, we'll keep using the existing Hardware interface but store manufacturer in name
      // Later when we migrate to HardwareSetting, we'll update this
      addHardware({
        id: Date.now().toString(),
        name: `${newHardware.manufacturer} - ${newHardware.name}`,
        pricePerTurn: parseFloat(newHardware.pricePerPack), // Using pricePerPack for now
        pricePerTiltTurn: parseFloat(newHardware.pricePerPack), // Using same value for now
      });
      setNewHardware({ manufacturer: '', name: '', pricePerPack: '' });
    }
  };

  const handleLoadDefaultTemplates = async () => {
    try {
      await loadDefaultProfileTemplates();
      showToast('success', 'Șabloanele implicite de profile au fost încărcate.');
    } catch (error) {
      console.error('Failed to load default templates:', error);
      showToast('error', 'Eroare la încărcarea șabloanelor implicite. Te rugăm să încerci din nou.');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Setări Materiale</h1>
      <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">Configurează prețurile pentru profiluri, geamuri și feronerie</p>

      <div className="space-y-8">
        {toast && (
          <div
            className={`rounded-lg px-4 py-3 text-sm ${
              toast.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            {toast.message}
          </div>
        )}
        {isLoading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <p className="text-blue-700">Se încarcă datele...</p>
          </div>
        )}

        {/* Profiles Section */}
        <section className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Serii Profile</h2>
            <button
              type="button"
              onClick={handleLoadDefaultTemplates}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3 py-2 text-sm border border-blue-200 rounded-md text-blue-700 hover:bg-blue-50"
            >
              Încarcă șabloane implicite
            </button>
          </div>

          {/* Grouped by manufacturer */}
          {Object.entries(profilesByManufacturer).map(([manufacturer, profiles]) => (
            <div key={manufacturer} className="mb-6">
              <h3 className="text-base font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-300">
                {manufacturer}
              </h3>
              
              {/* Column headers - hidden on mobile, shown on desktop */}
              <div className="hidden sm:grid sm:grid-cols-[1fr_10rem_8rem_7rem_6rem_7rem_7rem_auto] gap-2 px-3 py-2 mb-2 bg-gray-100 rounded-lg border border-gray-200">
                <div className="text-xs font-semibold text-gray-700">Nume Serie</div>
                <div className="text-xs font-semibold text-gray-700">Producător</div>
                <div className="text-xs font-semibold text-gray-700">Tip Profil</div>
                <div className="text-xs font-semibold text-gray-700">Culoare</div>
                <div className="text-xs font-semibold text-gray-700">Preț (RON/m)</div>
                <div className="text-xs font-semibold text-gray-700">Ded. Lăț. (mm)</div>
                <div className="text-xs font-semibold text-gray-700">Ded. Înălț. (mm)</div>
                <div className="text-xs font-semibold text-gray-700 text-center">Acțiuni</div>
              </div>

              <div className="space-y-3 mb-4">
                {profiles.map((profile) => (
                  <div key={profile.id} className="flex flex-col sm:grid sm:grid-cols-[1fr_10rem_8rem_7rem_6rem_7rem_7rem_auto] items-stretch sm:items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <label className="block text-xs font-medium text-gray-600 mb-1 sm:hidden">Nume Serie</label>
                      <input
                        type="text"
                        value={profile.name}
                        onChange={(e) => {
                          updateProfileSeries(profile.id, { name: e.target.value }).catch((error) => {
                            console.error('Failed to update profile series:', error);
                            showToast('error', 'Eroare la actualizarea seriei de profil.');
                          });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        placeholder="Nume serie"
                      />
                    </div>
                    <div className="w-full sm:w-auto">
                      <label className="block text-xs font-medium text-gray-600 mb-1 sm:hidden">Producător</label>
                      <input
                        type="text"
                        list={`manufacturer-list-${profile.id}`}
                        value={profile.manufacturer || ''}
                        onChange={(e) => {
                          updateProfileSeries(profile.id, { manufacturer: e.target.value || null }).catch((error) => {
                            console.error('Failed to update profile series:', error);
                            showToast('error', 'Eroare la actualizarea seriei de profil.');
                          });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        placeholder="Producător"
                      />
                      <datalist id={`manufacturer-list-${profile.id}`}>
                        {manufacturerSuggestions.map((m) => (
                          <option key={m} value={m} />
                        ))}
                      </datalist>
                    </div>
                    <div className="w-full sm:w-auto">
                      <label className="block text-xs font-medium text-gray-600 mb-1 sm:hidden">Tip Profil</label>
                      <input
                        type="text"
                        value={profile.profile_type || ''}
                        onChange={(e) => {
                          updateProfileSeries(profile.id, { profile_type: e.target.value || null }).catch((error) => {
                            console.error('Failed to update profile series:', error);
                            showToast('error', 'Eroare la actualizarea seriei de profil.');
                          });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        placeholder="toc, cercevea..."
                      />
                    </div>
                    <div className="w-full sm:w-auto">
                      <label className="block text-xs font-medium text-gray-600 mb-1 sm:hidden">Culoare</label>
                      <input
                        type="text"
                        value={profile.color_name || profile.colorCategory || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          updateProfileSeries(profile.id, { 
                            color_name: value || null,
                            colorCategory: value || ''
                          }).catch((error) => {
                            console.error('Failed to update profile series:', error);
                            showToast('error', 'Eroare la actualizarea seriei de profil.');
                          });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        placeholder="Alb, Antracit..."
                      />
                    </div>
                    <div className="w-full sm:w-auto">
                      <label className="block text-xs font-medium text-gray-600 mb-1 sm:hidden">Preț (RON/m)</label>
                      <input
                        type="number"
                        value={profile.pricePerMeter}
                        onChange={(e) => {
                          updateProfileSeries(profile.id, { pricePerMeter: parseFloat(e.target.value) }).catch((error) => {
                            console.error('Failed to update profile series:', error);
                            showToast('error', 'Eroare la actualizarea seriei de profil.');
                          });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        placeholder="RON/metru"
                      />
                    </div>
                    <div className="w-full sm:w-auto">
                      <label className="block text-xs font-medium text-gray-600 mb-1 sm:hidden">Ded. Lăț. (mm)</label>
                      <input
                        type="number"
                        value={profile.glass_width_deduction_mm}
                        onChange={(e) => {
                          updateProfileSeries(profile.id, { glass_width_deduction_mm: parseInt(e.target.value) || 24 }).catch((error) => {
                            console.error('Failed to update profile series:', error);
                            showToast('error', 'Eroare la actualizarea seriei de profil.');
                          });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs"
                        placeholder="Lăț. (mm)"
                        title="Deducere lățime sticlă (mm)"
                      />
                    </div>
                    <div className="w-full sm:w-auto">
                      <label className="block text-xs font-medium text-gray-600 mb-1 sm:hidden">Ded. Înălț. (mm)</label>
                      <input
                        type="number"
                        value={profile.glass_height_deduction_mm}
                        onChange={(e) => {
                          updateProfileSeries(profile.id, { glass_height_deduction_mm: parseInt(e.target.value) || 24 }).catch((error) => {
                            console.error('Failed to update profile series:', error);
                            showToast('error', 'Eroare la actualizarea seriei de profil.');
                          });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs"
                        placeholder="Înălț. (mm)"
                        title="Deducere înălțime sticlă (mm)"
                      />
                    </div>
                    <div className="flex justify-center sm:justify-start">
                      <button
                        onClick={async () => {
                          if (confirm('Ești sigur că vrei să ștergi această serie de profil?')) {
                            try {
                              await deleteProfileSeries(profile.id);
                              showToast('success', 'Seria de profil a fost ștearsă.');
                            } catch (error) {
                              console.error('Failed to delete profile series:', error);
                              showToast('error', 'Eroare la ștergerea seriei de profil.');
                            }
                          }
                        }}
                        className="p-2.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Șterge"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Add new profile row */}
          <div className="hidden sm:grid sm:grid-cols-[1fr_10rem_8rem_7rem_6rem_7rem_7rem_auto] gap-2 px-3 py-2 mb-2 bg-blue-100 rounded-lg border border-blue-200">
            <div className="text-xs font-semibold text-gray-700">Nume Serie</div>
            <div className="text-xs font-semibold text-gray-700">Producător</div>
            <div className="text-xs font-semibold text-gray-700">Tip Profil</div>
            <div className="text-xs font-semibold text-gray-700">Culoare</div>
            <div className="text-xs font-semibold text-gray-700">Preț (RON/m)</div>
            <div className="text-xs font-semibold text-gray-700">Ded. Lăț. (mm)</div>
            <div className="text-xs font-semibold text-gray-700">Ded. Înălț. (mm)</div>
            <div className="text-xs font-semibold text-gray-700 text-center">Acțiuni</div>
          </div>

          <div className="flex flex-col sm:grid sm:grid-cols-[1fr_10rem_8rem_7rem_6rem_7rem_7rem_auto] items-stretch sm:items-center gap-2 p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
            <div className="flex-1 min-w-0">
              <label className="block text-xs font-medium text-gray-600 mb-1 sm:hidden">Nume Serie</label>
              <input
                type="text"
                value={newProfile.name}
                onChange={(e) => setNewProfile({ ...newProfile, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="Nume serie nouă"
              />
            </div>
            <div className="w-full sm:w-auto">
              <label className="block text-xs font-medium text-gray-600 mb-1 sm:hidden">Producător</label>
              <input
                type="text"
                list="manufacturer-list-new"
                value={newProfile.manufacturer}
                onChange={(e) => setNewProfile({ ...newProfile, manufacturer: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="Producător"
              />
              <datalist id="manufacturer-list-new">
                {manufacturerSuggestions.map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
            </div>
            <div className="w-full sm:w-auto">
              <label className="block text-xs font-medium text-gray-600 mb-1 sm:hidden">Tip Profil</label>
              <input
                type="text"
                value={newProfile.profile_type}
                onChange={(e) => setNewProfile({ ...newProfile, profile_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="toc, cercevea..."
              />
            </div>
            <div className="w-full sm:w-auto">
              <label className="block text-xs font-medium text-gray-600 mb-1 sm:hidden">Culoare</label>
              <input
                type="text"
                value={newProfile.color_name}
                onChange={(e) => setNewProfile({ ...newProfile, color_name: e.target.value, colorCategory: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="Alb, Antracit..."
              />
            </div>
            <div className="w-full sm:w-auto">
              <label className="block text-xs font-medium text-gray-600 mb-1 sm:hidden">Preț (RON/m)</label>
              <input
                type="number"
                value={newProfile.pricePerMeter}
                onChange={(e) => setNewProfile({ ...newProfile, pricePerMeter: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="RON/metru"
              />
            </div>
            <div className="w-full sm:w-auto">
              <label className="block text-xs font-medium text-gray-600 mb-1 sm:hidden">Ded. Lăț. (mm)</label>
              <input
                type="number"
                value={newProfile.glass_width_deduction_mm}
                onChange={(e) => setNewProfile({ ...newProfile, glass_width_deduction_mm: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs"
                placeholder="Lăț. (mm)"
                title="Deducere lățime sticlă (mm)"
              />
            </div>
            <div className="w-full sm:w-auto">
              <label className="block text-xs font-medium text-gray-600 mb-1 sm:hidden">Ded. Înălț. (mm)</label>
              <input
                type="number"
                value={newProfile.glass_height_deduction_mm}
                onChange={(e) => setNewProfile({ ...newProfile, glass_height_deduction_mm: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs"
                placeholder="Înălț. (mm)"
                title="Deducere înălțime sticlă (mm)"
              />
            </div>
            <div className="flex justify-center sm:justify-start">
              <button
                onClick={handleAddProfile}
                className="p-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                title="Adaugă"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
        </section>

        {/* Glass Section */}
        <section className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">Tipuri Geam</h2>

          {/* Column headers - hidden on mobile, shown on desktop */}
          <div className="hidden sm:grid sm:grid-cols-[1fr_10rem_12rem_auto] gap-3 px-3 py-2 mb-2 bg-gray-100 rounded-lg border border-gray-200">
            <div className="text-xs font-semibold text-gray-700">Nume Tip Geam</div>
            <div className="text-xs font-semibold text-gray-700">Grosime (mm)</div>
            <div className="text-xs font-semibold text-gray-700">Preț (RON/m²)</div>
            <div className="text-xs font-semibold text-gray-700 text-center">Acțiuni</div>
          </div>

          <div className="space-y-3 mb-4">
            {settings.glassTypes.map((glass) => (
              <div key={glass.id} className="flex flex-col sm:grid sm:grid-cols-[1fr_10rem_12rem_auto] items-stretch sm:items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <label className="block text-xs font-medium text-gray-600 mb-1 sm:hidden">Nume Tip Geam</label>
                  <input
                    type="text"
                    value={glass.name}
                    onChange={(e) => updateGlassType(glass.id, { name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-base"
                    placeholder="Tip geam"
                  />
                </div>
                <div className="w-full sm:w-auto">
                  <label className="block text-xs font-medium text-gray-600 mb-1 sm:hidden">Grosime (mm)</label>
                  <input
                    type="number"
                    value={(glass as any).thickness_mm || ''}
                    onChange={(e) => updateGlassType(glass.id, { thickness_mm: parseFloat(e.target.value) || undefined } as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-base"
                    placeholder="44, 24..."
                  />
                </div>
                <div className="w-full sm:w-auto">
                  <label className="block text-xs font-medium text-gray-600 mb-1 sm:hidden">Preț (RON/m²)</label>
                  <input
                    type="number"
                    value={glass.pricePerSqMeter}
                    onChange={(e) => updateGlassType(glass.id, { pricePerSqMeter: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-base"
                    placeholder="RON/m²"
                  />
                </div>
                <div className="flex justify-center sm:justify-start">
                  <button
                    onClick={() => deleteGlassType(glass.id)}
                    className="p-2.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Șterge"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden sm:grid sm:grid-cols-[1fr_10rem_12rem_auto] gap-3 px-3 py-2 mb-2 bg-blue-100 rounded-lg border border-blue-200">
            <div className="text-xs font-semibold text-gray-700">Nume Tip Geam</div>
            <div className="text-xs font-semibold text-gray-700">Grosime (mm)</div>
            <div className="text-xs font-semibold text-gray-700">Preț (RON/m²)</div>
            <div className="text-xs font-semibold text-gray-700 text-center">Acțiuni</div>
          </div>

          <div className="flex flex-col sm:grid sm:grid-cols-[1fr_10rem_12rem_auto] items-stretch sm:items-center gap-3 p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
            <div className="flex-1 min-w-0">
              <label className="block text-xs font-medium text-gray-600 mb-1 sm:hidden">Nume Tip Geam</label>
              <input
                type="text"
                value={newGlass.name}
                onChange={(e) => setNewGlass({ ...newGlass, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-base"
                placeholder="Tip geam nou"
              />
            </div>
            <div className="w-full sm:w-auto">
              <label className="block text-xs font-medium text-gray-600 mb-1 sm:hidden">Grosime (mm)</label>
              <input
                type="number"
                value={newGlass.thickness_mm}
                onChange={(e) => setNewGlass({ ...newGlass, thickness_mm: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-base"
                placeholder="44, 24..."
              />
            </div>
            <div className="w-full sm:w-auto">
              <label className="block text-xs font-medium text-gray-600 mb-1 sm:hidden">Preț (RON/m²)</label>
              <input
                type="number"
                value={newGlass.pricePerSqMeter}
                onChange={(e) => setNewGlass({ ...newGlass, pricePerSqMeter: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-base"
                placeholder="RON/m²"
              />
            </div>
            <div className="flex justify-center sm:justify-start">
              <button
                onClick={handleAddGlass}
                className="p-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                title="Adaugă"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
        </section>

        {/* Hardware Section */}
        <section className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">Feronerie</h2>

          {/* Column headers - hidden on mobile, shown on desktop */}
          <div className="hidden sm:grid sm:grid-cols-[1fr_12rem_12rem_auto] gap-3 px-3 py-2 mb-2 bg-gray-100 rounded-lg border border-gray-200">
            <div className="text-xs font-semibold text-gray-700">Producător / Nume</div>
            <div className="text-xs font-semibold text-gray-700">Preț Deschidere (RON)</div>
            <div className="text-xs font-semibold text-gray-700">Preț Oscilobatant (RON)</div>
            <div className="text-xs font-semibold text-gray-700 text-center">Acțiuni</div>
          </div>

          <div className="space-y-3 mb-4">
            {settings.hardwareOptions.map((hardware) => (
              <div key={hardware.id} className="flex flex-col sm:grid sm:grid-cols-[1fr_12rem_12rem_auto] items-stretch sm:items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <label className="block text-xs font-medium text-gray-600 mb-1 sm:hidden">Producător / Nume</label>
                  <input
                    type="text"
                    value={hardware.name}
                    onChange={(e) => updateHardware(hardware.id, { name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-base"
                    placeholder="Producător"
                  />
                </div>
                <div className="w-full sm:w-auto">
                  <label className="block text-xs font-medium text-gray-600 mb-1 sm:hidden">Preț Deschidere (RON)</label>
                  <input
                    type="number"
                    value={hardware.pricePerTurn}
                    onChange={(e) => updateHardware(hardware.id, { pricePerTurn: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-base"
                    placeholder="RON/Deschidere"
                  />
                </div>
                <div className="w-full sm:w-auto">
                  <label className="block text-xs font-medium text-gray-600 mb-1 sm:hidden">Preț Oscilobatant (RON)</label>
                  <input
                    type="number"
                    value={hardware.pricePerTiltTurn}
                    onChange={(e) => updateHardware(hardware.id, { pricePerTiltTurn: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-base"
                    placeholder="RON/Oscilobatant"
                  />
                </div>
                <div className="flex justify-center sm:justify-start">
                  <button
                    onClick={() => deleteHardware(hardware.id)}
                    className="p-2.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Șterge"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden sm:grid sm:grid-cols-[1fr_12rem_12rem_auto] gap-3 px-3 py-2 mb-2 bg-blue-100 rounded-lg border border-blue-200">
            <div className="text-xs font-semibold text-gray-700">Producător / Nume</div>
            <div className="text-xs font-semibold text-gray-700">Preț Deschidere (RON)</div>
            <div className="text-xs font-semibold text-gray-700">Preț Oscilobatant (RON)</div>
            <div className="text-xs font-semibold text-gray-700 text-center">Acțiuni</div>
          </div>

          <div className="flex flex-col sm:grid sm:grid-cols-[1fr_12rem_12rem_auto] items-stretch sm:items-center gap-3 p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
            <div className="flex-1 min-w-0">
              <label className="block text-xs font-medium text-gray-600 mb-1 sm:hidden">Producător / Nume</label>
              <input
                type="text"
                value={newHardware.manufacturer && newHardware.name ? `${newHardware.manufacturer} - ${newHardware.name}` : ''}
                onChange={(e) => {
                  const parts = e.target.value.split(' - ');
                  setNewHardware({ 
                    manufacturer: parts[0] || '', 
                    name: parts.slice(1).join(' - ') || '',
                    pricePerPack: newHardware.pricePerPack
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-base"
                placeholder="Producător - Nume"
              />
            </div>
            <div className="w-full sm:w-auto">
              <label className="block text-xs font-medium text-gray-600 mb-1 sm:hidden">Preț Deschidere (RON)</label>
              <input
                type="number"
                value={newHardware.pricePerPack}
                onChange={(e) => setNewHardware({ ...newHardware, pricePerPack: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-base"
                placeholder="RON/Pachet"
              />
            </div>
            <div className="w-full sm:w-auto">
              <label className="block text-xs font-medium text-gray-600 mb-1 sm:hidden">Preț Oscilobatant (RON)</label>
              <input
                type="number"
                value={newHardware.pricePerPack}
                onChange={(e) => setNewHardware({ ...newHardware, pricePerPack: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-base"
                placeholder="RON/Pachet"
              />
            </div>
            <div className="flex justify-center sm:justify-start">
              <button
                onClick={handleAddHardware}
                className="p-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                title="Adaugă"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
        </section>

        {/* Company Info Section */}
        <section className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">Informații Firmă</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nume Firmă <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={companySettings.company_name}
                onChange={(e) => setCompanySettings({ ...companySettings, company_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Numele firmei"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Logo URL
              </label>
              <input
                type="url"
                value={companySettings.logo_url}
                onChange={(e) => setCompanySettings({ ...companySettings, logo_url: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adresă
              </label>
              <input
                type="text"
                value={companySettings.address}
                onChange={(e) => setCompanySettings({ ...companySettings, address: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Adresa firmei"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telefon
              </label>
              <input
                type="tel"
                value={companySettings.phone}
                onChange={(e) => setCompanySettings({ ...companySettings, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+40..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={companySettings.email}
                onChange={(e) => setCompanySettings({ ...companySettings, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="contact@firma.ro"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nr. Reg. Com.
              </label>
              <input
                type="text"
                value={companySettings.registration_number}
                onChange={(e) => setCompanySettings({ ...companySettings, registration_number: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="J40/1234/2020"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CUI
              </label>
              <input
                type="text"
                value={companySettings.tax_id}
                onChange={(e) => setCompanySettings({ ...companySettings, tax_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="RO12345678"
              />
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6 mt-6">
            <h3 className="text-base font-semibold text-gray-800 mb-4">Setări Implicite</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profil Implicit
                </label>
                <select
                  value={companySettings.default_profile_series_id || ''}
                  onChange={(e) => setCompanySettings({ ...companySettings, default_profile_series_id: e.target.value || null })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Niciunul</option>
                  {settings.profileSeries.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.manufacturer ? `${profile.manufacturer} - ` : ''}{profile.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sticlă Implicită
                </label>
                <select
                  value={companySettings.default_glass_id || ''}
                  onChange={(e) => setCompanySettings({ ...companySettings, default_glass_id: e.target.value || null })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Niciuna</option>
                  {settings.glassTypes.map((glass) => (
                    <option key={glass.id} value={glass.id}>
                      {glass.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Feronerie Implicită
                </label>
                <select
                  value={companySettings.default_hardware_id || ''}
                  onChange={(e) => setCompanySettings({ ...companySettings, default_hardware_id: e.target.value || null })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Niciuna</option>
                  {settings.hardwareOptions.map((hardware) => (
                    <option key={hardware.id} value={hardware.id}>
                      {hardware.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSaveCompanySettings}
              disabled={isSavingCompany}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5" />
              {isSavingCompany ? 'Se salvează...' : 'Salvează Informațiile Firmei'}
            </button>
          </div>
        </section>

        <section className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">Procente Implicite</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Manoperă (%)
              </label>
              <input
                type="number"
                value={settings.defaultLaborPercentage}
                onChange={(e) => updateSettings({ defaultLaborPercentage: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Marjă Profit (%)
              </label>
              <input
                type="number"
                value={settings.defaultMarginPercentage}
                onChange={(e) => updateSettings({ defaultMarginPercentage: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        </section>

        <div className="flex justify-end">
          <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-base">
            <Save className="w-5 h-5" />
            Salvează Setările
          </button>
        </div>
      </div>
    </div>
  );
}
