import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Plus, Trash2, Save } from 'lucide-react';

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [newProfile, setNewProfile] = useState({ 
    name: '', 
    pricePerMeter: '', 
    colorCategory: '', 
    chambers: '5',
    glass_width_deduction_mm: '24',
    glass_height_deduction_mm: '24',
  });
  const [newGlass, setNewGlass] = useState({ name: '', pricePerSqMeter: '' });
  const [newHardware, setNewHardware] = useState({ name: '', pricePerTurn: '', pricePerTiltTurn: '' });
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddProfile = async () => {
    if (newProfile.name && newProfile.pricePerMeter && newProfile.colorCategory && newProfile.chambers) {
      try {
        await addProfileSeries({
          name: newProfile.name,
          pricePerMeter: parseFloat(newProfile.pricePerMeter),
          colorCategory: newProfile.colorCategory,
          chambers: parseInt(newProfile.chambers),
          glass_width_deduction_mm: parseInt(newProfile.glass_width_deduction_mm) || 24,
          glass_height_deduction_mm: parseInt(newProfile.glass_height_deduction_mm) || 24,
        });
        setNewProfile({ 
          name: '', 
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
      setNewGlass({ name: '', pricePerSqMeter: '' });
    }
  };

  const handleAddHardware = () => {
    if (newHardware.name && newHardware.pricePerTurn && newHardware.pricePerTiltTurn) {
      addHardware({
        id: Date.now().toString(),
        name: newHardware.name,
        pricePerTurn: parseFloat(newHardware.pricePerTurn),
        pricePerTiltTurn: parseFloat(newHardware.pricePerTiltTurn),
      });
      setNewHardware({ name: '', pricePerTurn: '', pricePerTiltTurn: '' });
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

          {/* Column headers - hidden on mobile, shown on desktop */}
          <div className="hidden sm:grid sm:grid-cols-[1fr_8rem_7rem_6rem_7rem_7rem_auto] gap-2 px-3 py-2 mb-2 bg-gray-100 rounded-lg border border-gray-200">
            <div className="text-xs font-semibold text-gray-700">Nume Serie</div>
            <div className="text-xs font-semibold text-gray-700">Preț (RON/m)</div>
            <div className="text-xs font-semibold text-gray-700">Culoare</div>
            <div className="text-xs font-semibold text-gray-700">Camere</div>
            <div className="text-xs font-semibold text-gray-700">Ded. Lăț. (mm)</div>
            <div className="text-xs font-semibold text-gray-700">Ded. Înălț. (mm)</div>
            <div className="text-xs font-semibold text-gray-700 text-center">Acțiuni</div>
          </div>

          <div className="space-y-3 mb-4">
            {settings.profileSeries.map((profile) => (
              <div key={profile.id} className="flex flex-col sm:grid sm:grid-cols-[1fr_8rem_7rem_6rem_7rem_7rem_auto] items-stretch sm:items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <label className="block text-xs font-medium text-gray-600 mb-1 sm:hidden">Nume Serie</label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => {
                      updateProfileSeries(profile.id, { name: e.target.value }).catch((error) => {
                        console.error('Failed to update profile series:', error);
                        alert('Eroare la actualizarea seriei de profil.');
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-base"
                    placeholder="Nume serie"
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
                        alert('Eroare la actualizarea seriei de profil.');
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-base"
                    placeholder="RON/metru"
                  />
                </div>
                <div className="w-full sm:w-auto">
                  <label className="block text-xs font-medium text-gray-600 mb-1 sm:hidden">Culoare</label>
                  <input
                    type="text"
                    value={profile.colorCategory}
                    onChange={(e) => {
                      updateProfileSeries(profile.id, { colorCategory: e.target.value }).catch((error) => {
                        console.error('Failed to update profile series:', error);
                        alert('Eroare la actualizarea seriei de profil.');
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-base"
                    placeholder="Culoare"
                  />
                </div>
                <div className="w-full sm:w-auto">
                  <label className="block text-xs font-medium text-gray-600 mb-1 sm:hidden">Camere</label>
                  <input
                    type="number"
                    value={profile.chambers}
                    onChange={(e) => {
                      updateProfileSeries(profile.id, { chambers: parseInt(e.target.value) || 5 }).catch((error) => {
                        console.error('Failed to update profile series:', error);
                        alert('Eroare la actualizarea seriei de profil.');
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-base"
                    placeholder="Camere"
                    min="3"
                    max="10"
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
                        alert('Eroare la actualizarea seriei de profil.');
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
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
                        alert('Eroare la actualizarea seriei de profil.');
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
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
                        } catch (error) {
                          console.error('Failed to delete profile series:', error);
                          alert('Eroare la ștergerea seriei de profil.');
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

          <div className="hidden sm:grid sm:grid-cols-[1fr_8rem_7rem_6rem_7rem_7rem_auto] gap-2 px-3 py-2 mb-2 bg-blue-100 rounded-lg border border-blue-200">
            <div className="text-xs font-semibold text-gray-700">Nume Serie</div>
            <div className="text-xs font-semibold text-gray-700">Preț (RON/m)</div>
            <div className="text-xs font-semibold text-gray-700">Culoare</div>
            <div className="text-xs font-semibold text-gray-700">Camere</div>
            <div className="text-xs font-semibold text-gray-700">Ded. Lăț. (mm)</div>
            <div className="text-xs font-semibold text-gray-700">Ded. Înălț. (mm)</div>
            <div className="text-xs font-semibold text-gray-700 text-center">Acțiuni</div>
          </div>

          <div className="flex flex-col sm:grid sm:grid-cols-[1fr_8rem_7rem_6rem_7rem_7rem_auto] items-stretch sm:items-center gap-2 p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
            <div className="flex-1 min-w-0">
              <label className="block text-xs font-medium text-gray-600 mb-1 sm:hidden">Nume Serie</label>
              <input
                type="text"
                value={newProfile.name}
                onChange={(e) => setNewProfile({ ...newProfile, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-base"
                placeholder="Nume serie nouă"
              />
            </div>
            <div className="w-full sm:w-auto">
              <label className="block text-xs font-medium text-gray-600 mb-1 sm:hidden">Preț (RON/m)</label>
              <input
                type="number"
                value={newProfile.pricePerMeter}
                onChange={(e) => setNewProfile({ ...newProfile, pricePerMeter: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-base"
                placeholder="RON/metru"
              />
            </div>
            <div className="w-full sm:w-auto">
              <label className="block text-xs font-medium text-gray-600 mb-1 sm:hidden">Culoare</label>
              <input
                type="text"
                value={newProfile.colorCategory}
                onChange={(e) => setNewProfile({ ...newProfile, colorCategory: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-base"
                placeholder="Culoare"
              />
            </div>
            <div className="w-full sm:w-auto">
              <label className="block text-xs font-medium text-gray-600 mb-1 sm:hidden">Camere</label>
              <input
                type="number"
                value={newProfile.chambers}
                onChange={(e) => setNewProfile({ ...newProfile, chambers: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-base"
                placeholder="Camere"
                min="3"
                max="10"
              />
            </div>
            <div className="w-full sm:w-auto">
              <label className="block text-xs font-medium text-gray-600 mb-1 sm:hidden">Ded. Lăț. (mm)</label>
              <input
                type="number"
                value={newProfile.glass_width_deduction_mm}
                onChange={(e) => setNewProfile({ ...newProfile, glass_width_deduction_mm: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
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

        <section className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">Tipuri Geam</h2>

          {/* Column headers - hidden on mobile, shown on desktop */}
          <div className="hidden sm:grid sm:grid-cols-[1fr_12rem_auto] gap-3 px-3 py-2 mb-2 bg-gray-100 rounded-lg border border-gray-200">
            <div className="text-xs font-semibold text-gray-700">Nume Tip Geam</div>
            <div className="text-xs font-semibold text-gray-700">Preț (RON/m²)</div>
            <div className="text-xs font-semibold text-gray-700 text-center">Acțiuni</div>
          </div>

          <div className="space-y-3 mb-4">
            {settings.glassTypes.map((glass) => (
              <div key={glass.id} className="flex flex-col sm:grid sm:grid-cols-[1fr_12rem_auto] items-stretch sm:items-center gap-3 p-3 bg-gray-50 rounded-lg">
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

          <div className="hidden sm:grid sm:grid-cols-[1fr_12rem_auto] gap-3 px-3 py-2 mb-2 bg-blue-100 rounded-lg border border-blue-200">
            <div className="text-xs font-semibold text-gray-700">Nume Tip Geam</div>
            <div className="text-xs font-semibold text-gray-700">Preț (RON/m²)</div>
            <div className="text-xs font-semibold text-gray-700 text-center">Acțiuni</div>
          </div>

          <div className="flex flex-col sm:grid sm:grid-cols-[1fr_12rem_auto] items-stretch sm:items-center gap-3 p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
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

        <section className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">Feronerie</h2>

          {/* Column headers - hidden on mobile, shown on desktop */}
          <div className="hidden sm:grid sm:grid-cols-[1fr_12rem_12rem_auto] gap-3 px-3 py-2 mb-2 bg-gray-100 rounded-lg border border-gray-200">
            <div className="text-xs font-semibold text-gray-700">Nume Producător</div>
            <div className="text-xs font-semibold text-gray-700">Preț Deschidere (RON)</div>
            <div className="text-xs font-semibold text-gray-700">Preț Oscilobatant (RON)</div>
            <div className="text-xs font-semibold text-gray-700 text-center">Acțiuni</div>
          </div>

          <div className="space-y-3 mb-4">
            {settings.hardwareOptions.map((hardware) => (
              <div key={hardware.id} className="flex flex-col sm:grid sm:grid-cols-[1fr_12rem_12rem_auto] items-stretch sm:items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <label className="block text-xs font-medium text-gray-600 mb-1 sm:hidden">Nume Producător</label>
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
            <div className="text-xs font-semibold text-gray-700">Nume Producător</div>
            <div className="text-xs font-semibold text-gray-700">Preț Deschidere (RON)</div>
            <div className="text-xs font-semibold text-gray-700">Preț Oscilobatant (RON)</div>
            <div className="text-xs font-semibold text-gray-700 text-center">Acțiuni</div>
          </div>

          <div className="flex flex-col sm:grid sm:grid-cols-[1fr_12rem_12rem_auto] items-stretch sm:items-center gap-3 p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
            <div className="flex-1 min-w-0">
              <label className="block text-xs font-medium text-gray-600 mb-1 sm:hidden">Nume Producător</label>
              <input
                type="text"
                value={newHardware.name}
                onChange={(e) => setNewHardware({ ...newHardware, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-base"
                placeholder="Producător nou"
              />
            </div>
            <div className="w-full sm:w-auto">
              <label className="block text-xs font-medium text-gray-600 mb-1 sm:hidden">Preț Deschidere (RON)</label>
              <input
                type="number"
                value={newHardware.pricePerTurn}
                onChange={(e) => setNewHardware({ ...newHardware, pricePerTurn: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-base"
                placeholder="RON/Deschidere"
              />
            </div>
            <div className="w-full sm:w-auto">
              <label className="block text-xs font-medium text-gray-600 mb-1 sm:hidden">Preț Oscilobatant (RON)</label>
              <input
                type="number"
                value={newHardware.pricePerTiltTurn}
                onChange={(e) => setNewHardware({ ...newHardware, pricePerTiltTurn: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-base"
                placeholder="RON/Oscilobatant"
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
