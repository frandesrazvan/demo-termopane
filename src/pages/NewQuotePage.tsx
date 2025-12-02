import { useState } from 'react';
import WindowConfigurator, { WindowConfigData } from '../components/WindowConfigurator';
import { useStore } from '../store/useStore';
import { Quote, Window, Sash } from '../types';
import { Save } from 'lucide-react';

interface NewQuotePageProps {
  onSave?: () => void;
}

export default function NewQuotePage({ onSave }: NewQuotePageProps) {
  const { settings, addQuote } = useStore();
  const [clientName, setClientName] = useState('');
  const [windowConfig, setWindowConfig] = useState<WindowConfigData | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const handleSave = () => {
    const validationErrors: string[] = [];

    if (!clientName.trim()) {
      validationErrors.push('Numele clientului este obligatoriu');
    }

    if (!windowConfig) {
      validationErrors.push('Configurația ferestrei este invalidă');
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
      if (windowConfig.calculatedPrice <= 0) {
        validationErrors.push('Prețul calculat trebuie să fie mai mare decât 0');
      }
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (!windowConfig) {
      return; // Should never happen due to validation above, but TypeScript needs this
    }

    setErrors([]);

    // Create sashes for the window
    const sashWidth = windowConfig.width / windowConfig.sashCount;
    const sashes: Sash[] = windowConfig.sashes.map((sash, index) => ({
      id: sash.id,
      width: sashWidth,
      height: windowConfig.height,
      x: index * sashWidth,
      y: 0,
      openingType: sash.openingType,
    }));

    // Create window object
    const window: Window = {
      id: Date.now().toString(),
      width: windowConfig.width,
      height: windowConfig.height,
      sashes,
      profileSeriesId: windowConfig.selectedProfileId,
      glassTypeId: windowConfig.selectedGlassId,
      hardwareId: windowConfig.selectedHardwareId,
      color: windowConfig.selectedColor,
    };

    // Create quote with all pricing details
    const quote: Quote = {
      id: Date.now().toString(),
      clientName: clientName.trim(),
      createdAt: new Date().toISOString(),
      windows: [window],
      laborPercentage: settings.defaultLaborPercentage,
      marginPercentage: settings.defaultMarginPercentage,
      totalPrice: windowConfig.finalPriceWithVAT || windowConfig.calculatedPrice,
      // Commercial pricing details
      baseCost: windowConfig.baseCost,
      markupPercent: windowConfig.markupPercent,
      markupFixed: windowConfig.markupFixed,
      discountPercent: windowConfig.discountPercent,
      discountFixed: windowConfig.discountFixed,
      sellingPrice: windowConfig.sellingPrice,
      vatAmount: windowConfig.vatAmount,
      finalPriceWithVAT: windowConfig.finalPriceWithVAT,
      productType: windowConfig.productType,
    };

    // Save quote
    addQuote(quote);
    
    // Reset form
    setClientName('');
    setWindowConfig(null);
    setErrors([]);

    // Navigate to quotes page (no alert)
    if (onSave) {
      onSave();
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Ofertă Nouă</h1>
      <p className="text-gray-600 mb-8">Configurează fereastra și generează oferta automată</p>

      {/* Client Name Input */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nume Client *
        </label>
        <input
          type="text"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          placeholder="Introdu numele clientului"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
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

      <div className="grid grid-cols-1 gap-8">
        <WindowConfigurator onConfigChange={setWindowConfig} />
      </div>

      {/* Save Button */}
      <div className="mt-8 flex justify-end">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          <Save className="w-5 h-5" />
          Salvează Oferta
        </button>
      </div>
    </div>
  );
}
