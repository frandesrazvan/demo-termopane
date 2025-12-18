import { useState, useEffect, useMemo } from 'react';
import WindowConfigurator, { WindowConfigData } from '../components/WindowConfigurator';
import { quotesApi } from '../lib/quotesApi';
import { QuoteItemInput } from '../types/quotes';
import { useStore } from '../store/useStore';
import { Plus, Trash2, FileDown } from 'lucide-react';
import { companySettingsService } from '../services/companySettingsService';
import { PREDEFINED_TEMPLATES } from '../config/templates';
import { TemplateDefinition } from '../types/templates';
import { OfferTab, NewQuotePageProps } from '../types';
import { calculatePricingTotals } from '../utils/priceCalculator';
import { useQuoteDraft } from '../hooks/useQuoteDraft';

export default function NewQuotePage({ onSave, editQuoteId, onEditCancel }: NewQuotePageProps) {
  const { settings } = useStore();
  
  // Tab state
  const [activeTab, setActiveTab] = useState<OfferTab>('client');

  // Quote draft state (client info + basket)
  const draft = useQuoteDraft();
  const { clientInfo, setClientInfo, items, currentItemLabel, currentItemQuantity, setCurrentItemLabel, setCurrentItemQuantity, addItem, removeItem, setItems, resetDraft } = draft;

  // Current item configuration
  const [windowConfig, setWindowConfig] = useState<WindowConfigData | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showGlassDetails, setShowGlassDetails] = useState(false);
  
  // Template selection
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateDefinition | null>(null);

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

  // Load quote data for edit mode
  useEffect(() => {
    const loadQuoteForEdit = async () => {
      if (!editQuoteId) return;

      try {
        const quoteWithItems = await quotesApi.fetchQuoteWithItems(editQuoteId);
        if (quoteWithItems) {
          // Populate client info
          setClientInfo({
            name: quoteWithItems.client_name || '',
            phone: quoteWithItems.client_phone || '',
            email: quoteWithItems.client_email || '',
            address: quoteWithItems.client_address || '',
            reference: quoteWithItems.reference || '',
          });

          // Populate items
          const quoteItems: QuoteItemInput[] = quoteWithItems.items.map(item => ({
            item_type: item.item_type,
            label: item.label,
            width_mm: item.width_mm,
            height_mm: item.height_mm,
            quantity: item.quantity,
            configuration: item.configuration,
            base_cost: item.base_cost,
            price_without_vat: item.price_without_vat,
            vat_rate: item.vat_rate,
            total_with_vat: item.total_with_vat,
            profile_series_id: item.profile_series_id,
            profile_length_m: item.profile_length_m,
            glass_area_sqm: item.glass_area_sqm,
          }));
          setItems(quoteItems);

          // Set pricing controls from quote totals
          setVatRate(quoteWithItems.vat_rate);
          // Note: markup/discount are not stored in quote, so keep defaults

          // Switch to price tab to show loaded items
          setActiveTab('price');
        }
      } catch (error) {
        console.error('Failed to load quote for edit:', error);
        setErrors(['Eroare la încărcarea ofertei pentru editare.']);
      }
    };

    loadQuoteForEdit();
  }, [editQuoteId]);

  // Calculate totals from items with pricing adjustments
  const totals = useMemo(() => {
    return calculatePricingTotals({
      items,
      markupPercent,
      markupFixed,
      discountPercent,
      discountFixed,
      vatRate,
    });
  }, [items, markupPercent, markupFixed, discountPercent, discountFixed, vatRate]);

  const handleAddItem = () => {
    if (!windowConfig) {
      setErrors(['Configurația articolului este invalidă']);
      setActiveTab('configurator');
      return;
    }

    const validationErrors = addItem(windowConfig, vatRate);

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      setActiveTab('configurator'); // Switch to configurator tab to show errors
      return;
    }

    setErrors([]);
    setWindowConfig(null);
    
    // Switch to price tab to see the new item
    setActiveTab('price');
  };

  const handleRemoveItem = (index: number) => {
    removeItem(index);
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

      // Reset form (only if not in edit mode, or reset after edit)
      if (!editQuoteId) {
        resetDraft();
        setWindowConfig(null);
        setSelectedTemplate(null);
        setErrors([]);
        setMarkupPercent(20);
        setMarkupFixed(0);
        setDiscountPercent(0);
        setDiscountFixed(0);
      } else {
        // In edit mode, just clear errors
        setErrors([]);
      }

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
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
          {editQuoteId ? 'Editează Ofertă' : 'Ofertă Nouă'}
        </h1>
        {editQuoteId && onEditCancel && (
          <button
            onClick={onEditCancel}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Anulează
          </button>
        )}
      </div>
      <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">
        {editQuoteId ? 'Modifică oferta și exportă ca ofertă nouă' : 'Configurează articolele și generează oferta automată'}
      </p>

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
            
            {/* Template Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selectează Șablon <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedTemplate?.id || ''}
                onChange={(e) => {
                  const template = PREDEFINED_TEMPLATES.find(t => t.id === e.target.value);
                  setSelectedTemplate(template || null);
                }}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              >
                <option value="">Selectează un șablon...</option>
                {PREDEFINED_TEMPLATES.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
              {!selectedTemplate && (
                <p className="mt-2 text-sm text-gray-500 italic">
                  Selectează mai întâi un șablon pentru a începe configurarea.
                </p>
              )}
            </div>
            
            {selectedTemplate ? (
              <WindowConfigurator 
                onConfigChange={setWindowConfig}
                initialProfileId={getDefaultConfig.profileId}
                initialGlassId={getDefaultConfig.glassId}
                initialHardwareId={getDefaultConfig.hardwareId}
                hidePricing={true}
                template={selectedTemplate}
                onTemplateApplied={() => {
                  // Template applied, configurator is now enabled
                }}
              />
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                <p className="text-gray-600">Selectează un șablon pentru a configura articolul</p>
              </div>
            )}

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
