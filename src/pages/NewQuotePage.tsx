import { useState, useMemo } from 'react';
import WindowConfigurator, { WindowConfigData } from '../components/WindowConfigurator';
import { quotesApi } from '../lib/quotesApi';
import { QuoteItemInput } from '../types/quotes';
import { Save, Plus, RotateCcw, Trash2 } from 'lucide-react';

interface NewQuotePageProps {
  onSave?: () => void;
}

export default function NewQuotePage({ onSave }: NewQuotePageProps) {
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
    };

    // Add to items array
    setItems([...items, itemInput]);

    // Reset current item
    setCurrentItemLabel('');
    setCurrentItemQuantity(1);
    setWindowConfig(null);
  };

  const handleResetCurrentItem = () => {
    setCurrentItemLabel('');
    setCurrentItemQuantity(1);
    setWindowConfig(null);
    setErrors([]);
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
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Ofertă Nouă</h1>
      <p className="text-gray-600 mb-8">Configurează articolele și generează oferta automată</p>

      {/* Client Info Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Informații Client</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <div className="md:col-span-2">
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
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Configurare Articol Curent</h2>
        
        <WindowConfigurator onConfigChange={setWindowConfig} />

        {/* Item Label and Quantity */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
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

        {/* Add/Reset Buttons */}
        <div className="mt-6 flex gap-4">
          <button
            onClick={handleAddItem}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            Adaugă articol în ofertă
          </button>
          <button
            onClick={handleResetCurrentItem}
            className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            <RotateCcw className="w-5 h-5" />
            Resetează articolul curent
          </button>
        </div>
      </div>

      {/* Items Summary Table */}
      {items.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Articole Adăugate</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
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
                {items.map((item, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">{item.label || '-'}</td>
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
                ))}
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
