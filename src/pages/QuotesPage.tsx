import { useState } from 'react';
import { useStore } from '../store/useStore';
import { FileText, Calendar, Eye } from 'lucide-react';
import PDFPreview from '../components/PDFPreview';
import { Quote } from '../types';

export default function QuotesPage() {
  const quotes = useStore((state) => state.quotes);
  const settings = useStore((state) => state.settings);
  const [previewQuote, setPreviewQuote] = useState<Quote | null>(null);

  const handleViewPDF = (quote: Quote) => {
    setPreviewQuote(quote);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Ofertele Mele</h1>
      <p className="text-gray-600 mb-8">Toate ofertele create pentru clienți</p>

      {quotes.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Nicio ofertă încă</h2>
          <p className="text-gray-500">Creează prima ta ofertă folosind configuratorul vizual</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {quotes.map((quote) => (
            <div
              key={quote.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800">{quote.clientName}</h3>
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(quote.createdAt).toLocaleDateString('ro-RO')}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    {quote.windows.length} {quote.windows.length === 1 ? 'fereastră' : 'ferestre'}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Total</p>
                    <p className="text-2xl font-bold text-gray-800">{quote.totalPrice.toFixed(2)} RON</p>
                  </div>
                  <button
                    onClick={() => handleViewPDF(quote)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    title="Vezi PDF"
                  >
                    <Eye className="w-4 h-4" />
                    <span className="hidden sm:inline">Vezi</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {previewQuote && (
        <PDFPreview
          quote={previewQuote}
          settings={settings}
          onClose={() => setPreviewQuote(null)}
        />
      )}
    </div>
  );
}
