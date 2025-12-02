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

  const [newProfile, setNewProfile] = useState({ name: '', pricePerMeter: '', colorCategory: '', chambers: '5' });
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
        });
        setNewProfile({ name: '', pricePerMeter: '', colorCategory: '', chambers: '5' });
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
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Setări Materiale</h1>
      <p className="text-gray-600 mb-8">Configurează prețurile pentru profiluri, geamuri și feronerie</p>

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
        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Serii Profile</h2>
            <button
              type="button"
              onClick={handleLoadDefaultTemplates}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-blue-200 rounded-md text-blue-700 hover:bg-blue-50"
            >
              Încarcă șabloane implicite
            </button>
          </div>

          <div className="space-y-3 mb-4">
            {settings.profileSeries.map((profile) => (
              <div key={profile.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => {
                      updateProfileSeries(profile.id, { name: e.target.value }).catch((error) => {
                        console.error('Failed to update profile series:', error);
                        alert('Eroare la actualizarea seriei de profil.');
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Nume serie"
                  />
                </div>
                <div className="w-48">
                  <input
                    type="number"
                    value={profile.pricePerMeter}
                    onChange={(e) => {
                      updateProfileSeries(profile.id, { pricePerMeter: parseFloat(e.target.value) }).catch((error) => {
                        console.error('Failed to update profile series:', error);
                        alert('Eroare la actualizarea seriei de profil.');
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="RON/metru"
                  />
                </div>
                <div className="w-40">
                  <input
                    type="text"
                    value={profile.colorCategory}
                    onChange={(e) => {
                      updateProfileSeries(profile.id, { colorCategory: e.target.value }).catch((error) => {
                        console.error('Failed to update profile series:', error);
                        alert('Eroare la actualizarea seriei de profil.');
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Culoare"
                  />
                </div>
                <div className="w-32">
                  <input
                    type="number"
                    value={profile.chambers}
                    onChange={(e) => {
                      updateProfileSeries(profile.id, { chambers: parseInt(e.target.value) || 5 }).catch((error) => {
                        console.error('Failed to update profile series:', error);
                        alert('Eroare la actualizarea seriei de profil.');
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Camere"
                    min="3"
                    max="10"
                  />
                </div>
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
                  className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4 p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
            <div className="flex-1">
              <input
                type="text"
                value={newProfile.name}
                onChange={(e) => setNewProfile({ ...newProfile, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Nume serie nouă"
              />
            </div>
            <div className="w-48">
              <input
                type="number"
                value={newProfile.pricePerMeter}
                onChange={(e) => setNewProfile({ ...newProfile, pricePerMeter: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="RON/metru"
              />
            </div>
            <div className="w-40">
              <input
                type="text"
                value={newProfile.colorCategory}
                onChange={(e) => setNewProfile({ ...newProfile, colorCategory: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Culoare"
              />
            </div>
            <div className="w-32">
              <input
                type="number"
                value={newProfile.chambers}
                onChange={(e) => setNewProfile({ ...newProfile, chambers: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Camere"
                min="3"
                max="10"
              />
            </div>
            <button
              onClick={handleAddProfile}
              className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </section>

        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Tipuri Geam</h2>

          <div className="space-y-3 mb-4">
            {settings.glassTypes.map((glass) => (
              <div key={glass.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <input
                    type="text"
                    value={glass.name}
                    onChange={(e) => updateGlassType(glass.id, { name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Tip geam"
                  />
                </div>
                <div className="w-48">
                  <input
                    type="number"
                    value={glass.pricePerSqMeter}
                    onChange={(e) => updateGlassType(glass.id, { pricePerSqMeter: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="RON/m²"
                  />
                </div>
                <button
                  onClick={() => deleteGlassType(glass.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4 p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
            <div className="flex-1">
              <input
                type="text"
                value={newGlass.name}
                onChange={(e) => setNewGlass({ ...newGlass, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Tip geam nou"
              />
            </div>
            <div className="w-48">
              <input
                type="number"
                value={newGlass.pricePerSqMeter}
                onChange={(e) => setNewGlass({ ...newGlass, pricePerSqMeter: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="RON/m²"
              />
            </div>
            <button
              onClick={handleAddGlass}
              className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </section>

        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Feronerie</h2>

          <div className="space-y-3 mb-4">
            {settings.hardwareOptions.map((hardware) => (
              <div key={hardware.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <input
                    type="text"
                    value={hardware.name}
                    onChange={(e) => updateHardware(hardware.id, { name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Producător"
                  />
                </div>
                <div className="w-48">
                  <input
                    type="number"
                    value={hardware.pricePerTurn}
                    onChange={(e) => updateHardware(hardware.id, { pricePerTurn: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="RON/Deschidere"
                  />
                </div>
                <div className="w-48">
                  <input
                    type="number"
                    value={hardware.pricePerTiltTurn}
                    onChange={(e) => updateHardware(hardware.id, { pricePerTiltTurn: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="RON/Oscilobatant"
                  />
                </div>
                <button
                  onClick={() => deleteHardware(hardware.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4 p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
            <div className="flex-1">
              <input
                type="text"
                value={newHardware.name}
                onChange={(e) => setNewHardware({ ...newHardware, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Producător nou"
              />
            </div>
            <div className="w-48">
              <input
                type="number"
                value={newHardware.pricePerTurn}
                onChange={(e) => setNewHardware({ ...newHardware, pricePerTurn: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="RON/Deschidere"
              />
            </div>
            <div className="w-48">
              <input
                type="number"
                value={newHardware.pricePerTiltTurn}
                onChange={(e) => setNewHardware({ ...newHardware, pricePerTiltTurn: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="RON/Oscilobatant"
              />
            </div>
            <button
              onClick={handleAddHardware}
              className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </section>

        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Procente Implicite</h2>

          <div className="grid grid-cols-2 gap-6">
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
          <button className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium">
            <Save className="w-5 h-5" />
            Salvează Setările
          </button>
        </div>
      </div>
    </div>
  );
}
