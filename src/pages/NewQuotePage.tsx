import { useState, useMemo } from 'react';
import WindowConfigurator, { WindowConfigData } from '../components/WindowConfigurator';
import { quotesApi } from '../lib/quotesApi';
import { QuoteItemInput } from '../types/quotes';
import { useStore } from '../store/useStore';
import { Save, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

interface NewQuotePageProps {
  onSave?: () => void;
}

export default function NewQuotePage({ onSave }: NewQuotePageProps) {
  const { settings } = useStore();
  
  // Client info state
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [reference, setReference] = useState('');

  // Items state
  const [items, setItems] = useState<QuoteItemInput[]>([]);
  const [currentItemLabel, setCurrentItemLabel] = useState('');
  const [currentItemQuantity, setCurrentItemQuantity] = useState(1);

  // Current item configuration
  const [windowConfig, setWindowConfig] = useState<WindowConfigData | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showGlassDetails, setShowGlassDetails] = useState(false);

  // Calculate totals from items
  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + item.price_without_vat * item.quantity, 0);
    const vatRate = items[0]?.vat_rate ?? 0.19;
    const vatAmount = subtotal * vatRate;
    const total = subtotal + vatAmount;
    
    // Calculate discount_total: sum of (price_without_vat - base_cost) * quantity for each item
    const discountTotal = items.reduce(
      (sum, item) => sum + (item.price_without_vat - item.base_cost) * item.quantity,
      0
    );

    return {
      subtotal,
      vatRate,
      vatAmount,
      total,
      discountTotal,
    };
  }, [items]);

  const handleAddItem = () => {
    const validationErrors: string[] = [];

    if (!windowConfig) {
      validationErrors.push('Configurația articolului este invalidă');
    } else {
      if (!windowConfig.selectedProfileId) {
        validationErrors.push('Selectează o serie de profil');
      }
      if (!windowConfig.selectedGlassId) {
        validationErrors.push('Selectează un tip de geam');
      }
      if (!windowConfig.selectedHardwareId) {
        validationErrors.push('Selectează feronerie');
      }
      if (!windowConfig.selectedColor) {
        validationErrors.push('Selectează culoarea');
      }
      if (windowConfig.sellingPrice <= 0) {
        validationErrors.push('Prețul calculat trebuie să fie mai mare decât 0');
      }
    }

    if (currentItemQuantity <= 0) {
      validationErrors.push('Cantitatea trebuie să fie mai mare decât 0');
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (!windowConfig) {
      return;
    }

    setErrors([]);

    // Build QuoteItemInput from current config
    // Reuse the existing price calculation logic from WindowConfigurator
    // The configurator already calculates: baseCost, sellingPrice, vatAmount, finalPriceWithVAT
    // VAT rate is always 19% (0.19) in Romania
    const vatRate = 0.19;
    
    const itemInput: QuoteItemInput = {
      item_type: windowConfig.productType,
      label: currentItemLabel.trim() || undefined,
      width_mm: windowConfig.width,
      height_mm: windowConfig.height,
      quantity: currentItemQuantity,
      // Store full configuration for future re-rendering and PDF generation
      // This includes all state needed to recreate the configurator view
      configuration: {
        width: windowConfig.width,
        height: windowConfig.height,
        selectedProfileId: windowConfig.selectedProfileId,
        selectedGlassId: windowConfig.selectedGlassId,
        selectedHardwareId: windowConfig.selectedHardwareId,
        selectedColor: windowConfig.selectedColor,
        sashCount: windowConfig.sashCount,
        sashes: windowConfig.sashes.map(sash => ({
          id: sash.id,
          openingType: sash.openingType,
          fillType: sash.fillType,
        })),
        productType: windowConfig.productType,
        // Store pricing details for reference (though we use the item-level fields for calculations)
        baseCost: windowConfig.baseCost,
        markupPercent: windowConfig.markupPercent,
        markupFixed: windowConfig.markupFixed,
        discountPercent: windowConfig.discountPercent,
        discountFixed: windowConfig.discountFixed,
        sellingPrice: windowConfig.sellingPrice,
        vatAmount: windowConfig.vatAmount,
        finalPriceWithVAT: windowConfig.finalPriceWithVAT,
      },
      // Use the calculated values from the configurator's price calculation logic
      base_cost: windowConfig.baseCost,
      price_without_vat: windowConfig.sellingPrice,
      vat_rate: vatRate,
      total_with_vat: windowConfig.finalPriceWithVAT,
      // Add profile and glass details
      profile_series_id: windowConfig.selectedProfileId,
      profile_length_m: Math.round(windowConfig.profileLengthMeters * 1000) / 1000, // Round to 3 decimals
      glass_area_sqm: Math.round(windowConfig.glassAreaSqm * 1000) / 1000, // Round to 3 decimals
    };

    // Add to items array
    setItems([...items, itemInput]);

    // Reset current item
    setCurrentItemLabel('');
    setCurrentItemQuantity(1);
    setWindowConfig(null);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    const validationErrors: string[] = [];

    if (items.length === 0) {
      validationErrors.push('Adaugă cel puțin un articol în ofertă');
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors([]);
    setIsSaving(true);

    try {
      await quotesApi.createQuoteWithItems({
        header: {
          client_name: clientName.trim() || undefined,
          client_phone: clientPhone.trim() || undefined,
          client_email: clientEmail.trim() || undefined,
          client_address: clientAddress.trim() || undefined,
          reference: reference.trim() || undefined,
          status: 'draft',
          subtotal: totals.subtotal,
          discount_total: totals.discountTotal,
          vat_rate: totals.vatRate,
          vat_amount: totals.vatAmount,
          total: totals.total,
        },
        items,
      });

      // Reset form
      setClientName('');
      setClientPhone('');
      setClientEmail('');
      setClientAddress('');
      setReference('');
      setItems([]);
      setCurrentItemLabel('');
      setCurrentItemQuantity(1);
      setWindowConfig(null);
      setErrors([]);

      // Navigate to quotes page
      if (onSave) {
        onSave();
      }
    } catch (error) {
      console.error('Error saving quote:', error);
      setErrors(['Eroare la salvarea ofertei. Te rugăm să încerci din nou.']);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Ofertă Nouă</h1>
      <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">Configurează articolele și generează oferta automată</p>

      {/* Client Info Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
        <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">Informații Client</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nume Client
            </label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Introdu numele clientului"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Telefon
            </label>
            <input
              type="tel"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              placeholder="Introdu numărul de telefon"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              placeholder="Introdu adresa de email"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Adresă
            </label>
            <input
              type="text"
              value={clientAddress}
              onChange={(e) => setClientAddress(e.target.value)}
              placeholder="Introdu adresa"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Referință Lucrare
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Introdu referința lucrării"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-red-800 mb-2">Erori de validare:</h3>
          <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Current Item Configuration */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
        <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">Configurare Articol Curent</h2>
        
        <WindowConfigurator onConfigChange={setWindowConfig} />

        {/* Glass Details Section */}
        {windowConfig && windowConfig.glassPieces.length > 0 && (
          <div className="mt-6 border border-gray-200 rounded-lg">
            <button
              type="button"
              onClick={() => setShowGlassDetails(!showGlassDetails)}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors rounded-t-lg"
            >
              <h3 className="text-sm font-semibold text-gray-800">Detalii sticlă</h3>
              {showGlassDetails ? (
                <ChevronUp className="w-5 h-5 text-gray-600" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-600" />
              )}
            </button>
            {showGlassDetails && (
              <div className="p-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-3 font-semibold text-gray-700">Nr. buc</th>
                        <th className="text-right py-2 px-3 font-semibold text-gray-700">Lățime (mm)</th>
                        <th className="text-right py-2 px-3 font-semibold text-gray-700">Înălțime (mm)</th>
                        <th className="text-right py-2 px-3 font-semibold text-gray-700">Suprafață (m²)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {windowConfig.glassPieces.map((piece, index) => {
                        const area = (piece.width_mm / 1000) * (piece.height_mm / 1000) * piece.quantity;
                        return (
                          <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-2 px-3">{piece.quantity}</td>
                            <td className="py-2 px-3 text-right">{piece.width_mm.toFixed(1)}</td>
                            <td className="py-2 px-3 text-right">{piece.height_mm.toFixed(1)}</td>
                            <td className="py-2 px-3 text-right">{area.toFixed(3)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm font-semibold text-gray-800">
                    Total sticlă: <span className="text-blue-600">{windowConfig.glassAreaSqm.toFixed(2)} m²</span>
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Item Label and Quantity */}
        <div className="mt-4 sm:mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Denumire Articol (opțional)
            </label>
            <input
              type="text"
              value={currentItemLabel}
              onChange={(e) => setCurrentItemLabel(e.target.value)}
              placeholder="Ex: Fereastră dormitor, Ușă intrare"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cantitate *
            </label>
            <input
              type="number"
              min="1"
              value={currentItemQuantity}
              onChange={(e) => setCurrentItemQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Add Item Button */}
        <div className="mt-4 sm:mt-6">
          <button
            onClick={handleAddItem}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-base"
          >
            <Plus className="w-5 h-5" />
            Adaugă articol în ofertă
          </button>
        </div>
      </div>

      {/* Items Summary Table */}
      {items.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">Articole Adăugate</h2>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="block md:hidden space-y-3 px-4 sm:px-0">
              {items.map((item, index) => {
                const profile = item.profile_series_id
                  ? settings.profileSeries.find((p) => p.id === item.profile_series_id)
                  : null;
                return (
                  <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{item.label || 'Fără denumire'}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          {item.item_type === 'window' ? 'Fereastră' : item.item_type === 'door' ? 'Ușă' : 'Altele'} • {item.width_mm}mm × {item.height_mm}mm
                        </div>
                        {item.profile_length_m && item.profile_length_m > 0 && (
                          <div className="text-xs text-gray-500 italic mt-1">
                            Profil: {item.profile_length_m.toFixed(3)} ml
                            {profile && ` [${profile.name}]`}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveItem(index)}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                        title="Șterge articol"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm mt-3 pt-3 border-t border-gray-200">
                      <div>
                        <span className="text-gray-600">Cantitate:</span>
                        <span className="ml-2 font-medium">{item.quantity}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-gray-600">Total:</span>
                        <span className="ml-2 font-semibold">{(item.total_with_vat * item.quantity).toFixed(2)} RON</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <table className="w-full text-sm hidden md:table">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Denumire</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Tip</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Dimensiuni</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Cantitate</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Preț fără TVA</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Preț cu TVA</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => {
                  const profile = item.profile_series_id
                    ? settings.profileSeries.find((p) => p.id === item.profile_series_id)
                    : null;
                  return (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>{item.label || '-'}</div>
                        {item.profile_length_m && item.profile_length_m > 0 && (
                          <div className="text-xs text-gray-500 italic mt-1">
                            Profil: {item.profile_length_m.toFixed(3)} ml
                            {profile && ` [${profile.name}]`}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {item.item_type === 'window' ? 'Fereastră' : item.item_type === 'door' ? 'Ușă' : 'Altele'}
                      </td>
                      <td className="py-3 px-4">
                        {item.width_mm}mm × {item.height_mm}mm
                      </td>
                      <td className="py-3 px-4 text-right">{item.quantity}</td>
                      <td className="py-3 px-4 text-right">
                        {(item.price_without_vat * item.quantity).toFixed(2)} RON
                      </td>
                      <td className="py-3 px-4 text-right">
                        {(item.total_with_vat * item.quantity).toFixed(2)} RON
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleRemoveItem(index)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                          title="Șterge articol"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 font-semibold">
                  <td colSpan={4} className="py-3 px-4 text-right">Total:</td>
                  <td className="py-3 px-4 text-right">{totals.subtotal.toFixed(2)} RON</td>
                  <td className="py-3 px-4 text-right">{totals.total.toFixed(2)} RON</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="mt-8 flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving || items.length === 0}
          className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          <Save className="w-5 h-5" />
          {isSaving ? 'Se salvează...' : 'Salvează Oferta'}
        </button>
      </div>
    </div>
  );
}
