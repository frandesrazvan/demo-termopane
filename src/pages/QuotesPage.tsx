import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { quotesApi } from '../lib/quotesApi';
import { Quote, QuoteWithItems } from '../types/quotes';
import { FileText, Eye, Trash2, Info, Loader2, Package } from 'lucide-react';
import PDFPreview from '../components/PDFPreview';
import MaterialSummaryModal from '../components/MaterialSummaryModal';
import { calculateMaterialSummary, QuoteMaterialSummary } from '../lib/materialSummary';

export default function QuotesPage() {
  const settings = useStore((state) => state.settings);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [previewQuote, setPreviewQuote] = useState<QuoteWithItems | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [materialSummary, setMaterialSummary] = useState<QuoteMaterialSummary | null>(null);
  const [materialSummaryQuote, setMaterialSummaryQuote] = useState<Quote | null>(null);
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(false);

  useEffect(() => {
    loadQuotes();
  }, []);

  const loadQuotes = async () => {
    try {
      setIsLoading(true);
      const fetchedQuotes = await quotesApi.fetchQuotes();
      setQuotes(fetchedQuotes);
    } catch (error) {
      console.error('Error loading quotes:', error);
      // TODO: Show error message to user
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewPDF = async (quoteId: string) => {
    try {
      const quoteWithItems = await quotesApi.fetchQuoteWithItems(quoteId);
      if (quoteWithItems) {
        setPreviewQuote(quoteWithItems);
      }
    } catch (error) {
      console.error('Error loading quote details:', error);
      // TODO: Show error message to user
    }
  };

  const handleDelete = async (quoteId: string) => {
    if (!confirm('Ești sigur că vrei să ștergi această ofertă?')) {
      return;
    }

    try {
      setDeletingId(quoteId);
      await quotesApi.deleteQuote(quoteId);
      setQuotes(quotes.filter((q) => q.id !== quoteId));
    } catch (error) {
      console.error('Error deleting quote:', error);
      alert('Eroare la ștergerea ofertei. Te rugăm să încerci din nou.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDetails = (quoteId: string) => {
    // Placeholder for future editing functionality
    alert(`Detalii pentru oferta ${quoteId}\n(Funcționalitate în dezvoltare)`);
  };

  const handleViewMaterials = async (quoteId: string) => {
    try {
      setIsLoadingMaterials(true);
      const quoteWithItems = await quotesApi.fetchQuoteWithItems(quoteId);
      if (!quoteWithItems) {
        alert('Oferta nu a fost găsită.');
        return;
      }

      // Calculate material summary
      const summary = calculateMaterialSummary(
        quoteWithItems,
        settings.profileSeries,
        settings.glassTypes,
        settings.hardwareOptions
      );

      setMaterialSummary(summary);
      setMaterialSummaryQuote(quoteWithItems);
    } catch (error) {
      console.error('Error loading material summary:', error);
      alert('Eroare la încărcarea sumarului de materiale. Te rugăm să încerci din nou.');
    } finally {
      setIsLoadingMaterials(false);
    }
  };

  const getStatusBadge = (status: Quote['status']) => {
    const statusConfig = {
      draft: { label: 'Ciornă', color: 'bg-gray-100 text-gray-800' },
      sent: { label: 'Trimisă', color: 'bg-blue-100 text-blue-800' },
      accepted: { label: 'Acceptată', color: 'bg-green-100 text-green-800' },
      rejected: { label: 'Respinsă', color: 'bg-red-100 text-red-800' },
      cancelled: { label: 'Anulată', color: 'bg-yellow-100 text-yellow-800' },
    };

    const config = statusConfig[status] || statusConfig.draft;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ro-RO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Ofertele Mele</h1>
      <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">Toate ofertele create pentru clienți</p>

      {isLoading ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Loader2 className="w-8 h-8 text-gray-400 mx-auto mb-4 animate-spin" />
          <p className="text-gray-500">Se încarcă ofertele...</p>
        </div>
      ) : quotes.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Nicio ofertă încă</h2>
          <p className="text-gray-500">Creează prima ta ofertă folosind configuratorul vizual</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Mobile card view */}
          <div className="block md:hidden divide-y divide-gray-200">
            {quotes.map((quote) => (
              <div key={quote.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 mb-1">
                      {quote.client_name || 'Fără client'}
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatDate(quote.created_at)}
                    </div>
                    {quote.reference && (
                      <div className="text-xs text-gray-500 mt-1">
                        Ref: {quote.reference}
                      </div>
                    )}
                  </div>
                  <div className="ml-4">{getStatusBadge(quote.status)}</div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="text-lg font-semibold text-gray-900">
                    {quote.total.toFixed(2)} RON
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewPDF(quote.id)}
                      className="p-2.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Vezi PDF"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleViewMaterials(quote.id)}
                      disabled={isLoadingMaterials}
                      className="p-2.5 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Materiale"
                    >
                      {isLoadingMaterials ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Package className="w-5 h-5" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDetails(quote.id)}
                      className="p-2.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Detalii"
                    >
                      <Info className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(quote.id)}
                      disabled={deletingId === quote.id}
                      className="p-2.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Șterge"
                    >
                      {deletingId === quote.id ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Trash2 className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table view */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Data</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Nume client</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Referință</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Total (cu TVA)</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {quotes.map((quote) => (
                  <tr key={quote.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">{formatDate(quote.created_at)}</td>
                    <td className="py-3 px-4 font-medium">
                      {quote.client_name || 'Fără client'}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {quote.reference || '-'}
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(quote.status)}</td>
                    <td className="py-3 px-4 text-right font-semibold">
                      {quote.total.toFixed(2)} RON
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleViewPDF(quote.id)}
                          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Exportă PDF"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleViewMaterials(quote.id)}
                          disabled={isLoadingMaterials}
                          className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Materiale"
                        >
                          {isLoadingMaterials ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Package className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDetails(quote.id)}
                          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Detalii"
                        >
                          <Info className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(quote.id)}
                          disabled={deletingId === quote.id}
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Șterge"
                        >
                          {deletingId === quote.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {previewQuote && (
        <PDFPreview
          quote={previewQuote}
          settings={settings}
          onClose={() => setPreviewQuote(null)}
        />
      )}

      {materialSummary && materialSummaryQuote && (
        <MaterialSummaryModal
          summary={materialSummary}
          quote={materialSummaryQuote}
          onClose={() => {
            setMaterialSummary(null);
            setMaterialSummaryQuote(null);
          }}
        />
      )}
    </div>
  );
}
