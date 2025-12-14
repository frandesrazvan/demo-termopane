import { useState, useEffect, useMemo } from 'react';
import WindowConfigurator, { WindowConfigData } from '../components/WindowConfigurator';
import { quotesApi } from '../lib/quotesApi';
import { QuoteItemInput } from '../types/quotes';
import { useStore } from '../store/useStore';
import { Plus, Trash2, FileDown } from 'lucide-react';
import { companySettingsService } from '../services/companySettingsService';

type OfferTab = 'client' | 'configurator' | 'price';

interface ClientInfoState {
  name: string;
  phone: string;
  email: string;
  address: string;
  reference: string;
}

interface NewQuotePageProps {
  onSave?: () => void;
}

export default function NewQuotePage({ onSave }: NewQuotePageProps) {
  const { settings } = useStore();
  
  // Tab state
  const [activeTab, setActiveTab] = useState<OfferTab>('client');

  // Client info state
  const [clientInfo, setClientInfo] = useState<ClientInfoState>({
    name: '',
    phone: '',
    email: '',
    address: '',
    reference: '',
  });

  // Items basket state
  const [items, setItems] = useState<QuoteItemInput[]>([]);
  const [currentItemLabel, setCurrentItemLabel] = useState('');
  const [currentItemQuantity, setCurrentItemQuantity] = useState(1);

  // Current item configuration
  const [windowConfig, setWindowConfig] = useState<WindowConfigData | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showGlassDetails, setShowGlassDetails] = useState(false);

  // Company settings for defaults
  const [companySettings, setCompanySettings] = useState<{
    default_profile_series_id?: string | null;
    default_glass_id?: string | null;
    default_hardware_id?: string | null;
    company_name?: string;
  }>({});

  // Pricing controls (moved to Price & Export tab)
  const [markupPercent, setMarkupPercent] = useState<number>(20);
  const [markupFixed, setMarkupFixed] = useState<number>(0);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [discountFixed, setDiscountFixed] = useState<number>(0);
  const [vatRate, setVatRate] = useState<number>(0.19);

  // Load company settings defaults on mount
  useEffect(() => {
    const loadDefaults = async () => {
      try {
        const settings = await companySettingsService.get();
        if (settings) {
          setCompanySettings({
            default_profile_series_id: settings.default_profile_series_id,
            default_glass_id: settings.default_glass_id,
            default_hardware_id: settings.default_hardware_id,
            company_name: settings.company_name,
          });
        }
      } catch (error) {
        console.error('Failed to load company settings:', error);
      }
    };
    loadDefaults();
  }, []);

  // Calculate totals from items with pricing adjustments
  const totals = useMemo(() => {
    // Sum of base costs (material costs)
    const totalMaterialCost = items.reduce((sum, item) => sum + item.base_cost * item.quantity, 0);
    
    // Sum of prices without VAT (before markup/discount adjustments)
    const subtotalBeforeAdjustments = items.reduce((sum, item) => sum + item.price_without_vat * item.quantity, 0);
    
    // Apply markup
    const priceWithMarkup = totalMaterialCost > 0 
      ? totalMaterialCost * (1 + markupPercent / 100) + markupFixed 
      : 0;
    
    // Apply discount
    const discountAmount = priceWithMarkup > 0 
      ? (priceWithMarkup * discountPercent / 100) + discountFixed 
      : 0;
    const priceAfterDiscount = Math.max(priceWithMarkup - discountAmount, 0);
    
    // Apply VAT
    const vatAmount = priceAfterDiscount * vatRate;
    const totalWithVAT = priceAfterDiscount + vatAmount;

    // Calculate discount_total for quote header (difference between subtotal and final price)
    const discountTotal = subtotalBeforeAdjustments - priceAfterDiscount;

    return {
      totalMaterialCost,
      subtotalBeforeAdjustments,
      priceWithMarkup,
      discountAmount,
      priceAfterDiscount,
      vatAmount,
      totalWithVAT,
      discountTotal,
      vatRate,
    };
  }, [items, markupPercent, markupFixed, discountPercent, discountFixed, vatRate]);

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
      if (windowConfig.width <= 0 || windowConfig.height <= 0) {
        validationErrors.push('Dimensiunile trebuie să fie mai mari decât 0');
      }
    }

    if (currentItemQuantity <= 0) {
      validationErrors.push('Cantitatea trebuie să fie mai mare decât 0');
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      setActiveTab('configurator'); // Switch to configurator tab to show errors
      return;
    }

    if (!windowConfig) {
      return;
    }

    setErrors([]);

    // Build QuoteItemInput from current config
    // Use base cost from configurator, but we'll apply markup/discount in Price & Export tab
    const itemInput: QuoteItemInput = {
      item_type: windowConfig.productType,
      label: currentItemLabel.trim() || undefined,
      width_mm: windowConfig.width,
      height_mm: windowConfig.height,
      quantity: currentItemQuantity,
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
        // Store pricing details for reference
        baseCost: windowConfig.baseCost,
        markupPercent: windowConfig.markupPercent,
        markupFixed: windowConfig.markupFixed,
        discountPercent: windowConfig.discountPercent,
        discountFixed: windowConfig.discountFixed,
        sellingPrice: windowConfig.sellingPrice,
        vatAmount: windowConfig.vatAmount,
        finalPriceWithVAT: windowConfig.finalPriceWithVAT,
        profileLengthMeters: windowConfig.profileLengthMeters,
        glassPieces: windowConfig.glassPieces,
        glassAreaSqm: windowConfig.glassAreaSqm,
      },
      // Store base cost (material cost) - pricing adjustments happen at quote level
      base_cost: windowConfig.baseCost,
      // Store the selling price from configurator as initial price_without_vat
      // This will be adjusted by the Price & Export tab controls
      price_without_vat: windowConfig.sellingPrice,
      vat_rate: vatRate,
      total_with_vat: windowConfig.finalPriceWithVAT,
      profile_series_id: windowConfig.selectedProfileId,
      profile_length_m: Math.round(windowConfig.profileLengthMeters * 1000) / 1000,
      glass_area_sqm: Math.round(windowConfig.glassAreaSqm * 1000) / 1000,
    };

    // Add to items array
    setItems([...items, itemInput]);

    // Reset current item
    setCurrentItemLabel('');
    setCurrentItemQuantity(1);
    setWindowConfig(null);
    
    // Switch to price tab to see the new item
    setActiveTab('price');
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleExport = async () => {
    const validationErrors: string[] = [];

    if (!clientInfo.name.trim()) {
      validationErrors.push('Numele clientului este obligatoriu');
    }

    if (items.length === 0) {
      validationErrors.push('Adaugă cel puțin un articol în ofertă');
    }

    if (!companySettings.company_name) {
      validationErrors.push('Numele firmei nu este configurat. Te rugăm să completezi informațiile firmei în Setări.');
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
          client_name: clientInfo.name.trim() || undefined,
          client_phone: clientInfo.phone.trim() || undefined,
          client_email: clientInfo.email.trim() || undefined,
          client_address: clientInfo.address.trim() || undefined,
          reference: clientInfo.reference.trim() || undefined,
          status: 'draft',
          subtotal: totals.priceAfterDiscount,
          discount_total: totals.discountTotal,
          vat_rate: totals.vatRate,
          vat_amount: totals.vatAmount,
          total: totals.totalWithVAT,
        },
        items,
      });

      // Reset form
      setClientInfo({
        name: '',
        phone: '',
        email: '',
        address: '',
        reference: '',
      });
      setItems([]);
      setCurrentItemLabel('');
      setCurrentItemQuantity(1);
      setWindowConfig(null);
      setErrors([]);
      setMarkupPercent(20);
      setMarkupFixed(0);
      setDiscountPercent(0);
      setDiscountFixed(0);

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

  // Get default values for configurator from company settings
  const getDefaultConfig = useMemo(() => {
    return {
      profileId: companySettings.default_profile_series_id || '',
      glassId: companySettings.default_glass_id || '',
      hardwareId: companySettings.default_hardware_id || '',
    };
  }, [companySettings]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Ofertă Nouă</h1>
      <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">Configurează articolele și generează oferta automată</p>

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('client')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'client'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Informații Client
          </button>
          <button
            onClick={() => setActiveTab('configurator')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'configurator'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Configurator
          </button>
          <button
            onClick={() => setActiveTab('price')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'price'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Preț & Export
          </button>
        </nav>
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

      {/* Client Info Tab */}
      {activeTab === 'client' && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">Informații Client</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nume Client <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={clientInfo.name}
                onChange={(e) => setClientInfo({ ...clientInfo, name: e.target.value })}
                placeholder="Introdu numele clientului"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telefon
              </label>
              <input
                type="tel"
                value={clientInfo.phone}
                onChange={(e) => setClientInfo({ ...clientInfo, phone: e.target.value })}
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
                value={clientInfo.email}
                onChange={(e) => setClientInfo({ ...clientInfo, email: e.target.value })}
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
                value={clientInfo.address}
                onChange={(e) => setClientInfo({ ...clientInfo, address: e.target.value })}
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
                value={clientInfo.reference}
                onChange={(e) => setClientInfo({ ...clientInfo, reference: e.target.value })}
                placeholder="Introdu referința lucrării"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      )}

      {/* Configurator Tab */}
      {activeTab === 'configurator' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">Configurare Articol</h2>
            
            <WindowConfigurator 
              onConfigChange={setWindowConfig}
              initialProfileId={getDefaultConfig.profileId}
              initialGlassId={getDefaultConfig.glassId}
              initialHardwareId={getDefaultConfig.hardwareId}
              hidePricing={true}
            />

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
                    <span className="text-gray-600">▲</span>
                  ) : (
                    <span className="text-gray-600">▼</span>
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
                  Cantitate <span className="text-red-500">*</span>
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
                Adaugă în coș
              </button>
            </div>
          </div>

          {/* Quick Basket Overview */}
          {items.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
              <h3 className="text-base font-semibold text-gray-800 mb-4">Coș ({items.length} articol{items.length !== 1 ? 'e' : ''})</h3>
              <div className="space-y-2">
                {items.slice(0, 3).map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-700">
                      {item.label || `${item.item_type === 'window' ? 'Fereastră' : item.item_type === 'door' ? 'Ușă' : 'Altele'}`} • {item.width_mm}mm × {item.height_mm}mm • Qty: {item.quantity}
                    </span>
                    <button
                      onClick={() => handleRemoveItem(index)}
                      className="p-1 text-red-600 hover:text-red-800"
                      title="Șterge"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {items.length > 3 && (
                  <p className="text-sm text-gray-500 italic">... și {items.length - 3} mai multe</p>
                )}
              </div>
              <button
                onClick={() => setActiveTab('price')}
                className="mt-4 text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Vezi toate articolele în Preț & Export →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Price & Export Tab */}
      {activeTab === 'price' && (
        <div className="space-y-6">
          {/* Items Summary Table */}
          {items.length > 0 ? (
            <>
              <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
                <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">Articole în Coș</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Denumire</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Tip</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Dimensiuni</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-700">Cantitate</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-700">Cost Materiale</th>
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
                              {(item.base_cost * item.quantity).toFixed(2)} RON
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
                  </table>
                </div>
              </div>

              {/* Pricing Controls */}
              <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
                <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">Calcul Preț</h2>
                
                <div className="space-y-6">
                  {/* Material Cost Summary */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-800 mb-3">Cost Materiale</h3>
                    <div className="text-2xl font-bold text-blue-700">
                      {totals.totalMaterialCost.toFixed(2)} RON
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Suma costurilor materiale pentru toate articolele</p>
                  </div>

                  {/* Markup Controls */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-800 mb-3">Adaos Comercial</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Adaos Comercial (%)
                        </label>
                        <input
                          type="number"
                          value={markupPercent}
                          onChange={(e) => setMarkupPercent(parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Adaos Comercial Fix (RON)
                        </label>
                        <input
                          type="number"
                          value={markupFixed}
                          onChange={(e) => setMarkupFixed(parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                      </div>
                    </div>
                    <div className="mt-3 text-sm text-gray-700">
                      Preț după adaos: <span className="font-semibold">{totals.priceWithMarkup.toFixed(2)} RON</span>
                    </div>
                  </div>

                  {/* Discount Controls */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-800 mb-3">Discount</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Discount (%)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={discountPercent}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            setDiscountPercent(Math.min(Math.max(value, 0), 100));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Discount Fix (RON)
                        </label>
                        <input
                          type="number"
                          value={discountFixed}
                          onChange={(e) => setDiscountFixed(parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                      </div>
                    </div>
                    <div className="mt-3 text-sm text-gray-700">
                      Discount total: <span className="font-semibold text-red-600">-{totals.discountAmount.toFixed(2)} RON</span>
                    </div>
                  </div>

                  {/* VAT Controls */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-800 mb-3">TVA</h3>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Rata TVA (%)
                      </label>
                      <input
                        type="number"
                        value={vatRate * 100}
                        onChange={(e) => setVatRate((parseFloat(e.target.value) || 0) / 100)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                  </div>

                  {/* Final Totals */}
                  <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-700">Preț Materiale:</span>
                        <span className="font-medium">{totals.totalMaterialCost.toFixed(2)} RON</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700">Adaos:</span>
                        <span className="font-medium">+{(totals.priceWithMarkup - totals.totalMaterialCost).toFixed(2)} RON</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700">Discount:</span>
                        <span className="font-medium text-red-600">-{totals.discountAmount.toFixed(2)} RON</span>
                      </div>
                      <div className="flex justify-between border-t border-gray-300 pt-2 mt-2">
                        <span className="font-medium text-gray-800">Preț Fără TVA:</span>
                        <span className="font-semibold">{totals.priceAfterDiscount.toFixed(2)} RON</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700">TVA ({vatRate * 100}%):</span>
                        <span className="font-medium">{totals.vatAmount.toFixed(2)} RON</span>
                      </div>
                      <div className="flex justify-between border-t-2 border-blue-400 pt-2 mt-2">
                        <span className="text-lg font-bold text-gray-900">TOTAL DE PLATĂ:</span>
                        <span className="text-2xl font-extrabold text-blue-700">
                          {totals.totalWithVAT.toFixed(2)} RON
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Export Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleExport}
                  disabled={isSaving || items.length === 0}
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <FileDown className="w-5 h-5" />
                  {isSaving ? 'Se salvează...' : 'Exportă acum'}
                </button>
              </div>
            </>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
              <p className="text-yellow-700 mb-4">Nu există articole în coș.</p>
              <button
                onClick={() => setActiveTab('configurator')}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Adaugă articole în Configurator
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
