import { X } from 'lucide-react';
import { Quote } from '../types/quotes';
import { QuoteMaterialSummary } from '../lib/materialSummary';

interface MaterialSummaryModalProps {
  summary: QuoteMaterialSummary;
  quote: Quote;
  onClose: () => void;
}

export default function MaterialSummaryModal({
  summary,
  quote,
  onClose,
}: MaterialSummaryModalProps) {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              Necesar materiale pentru ofertă
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {quote.id} {quote.client_name && `• ${quote.client_name}`}
              {quote.reference && ` • ${quote.reference}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Închide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Profiles Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Profiluri (ml)
            </h3>
            {summary.profiles.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Producător
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Tip profil
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Culoare
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">
                        Total ml
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.profiles.map((profile, index) => (
                      <tr
                        key={index}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-3 px-4">{profile.manufacturer}</td>
                        <td className="py-3 px-4">{profile.profile_type}</td>
                        <td className="py-3 px-4">{profile.color_name}</td>
                        <td className="py-3 px-4 text-right font-medium">
                          {profile.total_length_m.toFixed(3)} ml
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td
                        colSpan={3}
                        className="py-3 px-4 font-semibold text-gray-800"
                      >
                        Total:
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-blue-700">
                        {summary.profiles
                          .reduce((sum, p) => sum + p.total_length_m, 0)
                          .toFixed(3)}{' '}
                        ml
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 italic">Nu există profiluri în această ofertă.</p>
            )}
          </div>

          {/* Glass Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Sticlă (m²)
            </h3>
            {summary.glass.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Tip sticlă
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">
                        Total m²
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.glass.map((glass, index) => (
                      <tr
                        key={index}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-3 px-4">{glass.name}</td>
                        <td className="py-3 px-4 text-right font-medium">
                          {glass.total_area_sqm.toFixed(3)} m²
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td className="py-3 px-4 font-semibold text-gray-800">
                        Total:
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-blue-700">
                        {summary.glass
                          .reduce((sum, g) => sum + g.total_area_sqm, 0)
                          .toFixed(3)}{' '}
                        m²
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 italic">Nu există sticlă în această ofertă.</p>
            )}
          </div>

          {/* Hardware Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Feronerie (pachete)
            </h3>
            {summary.hardware.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Producător
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Tip
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">
                        Bucăți
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.hardware.map((hardware, index) => (
                      <tr
                        key={index}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-3 px-4">{hardware.manufacturer}</td>
                        <td className="py-3 px-4">{hardware.name}</td>
                        <td className="py-3 px-4 text-right font-medium">
                          {hardware.total_packs} {hardware.total_packs === 1 ? 'bucată' : 'bucăți'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td
                        colSpan={2}
                        className="py-3 px-4 font-semibold text-gray-800"
                      >
                        Total:
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-blue-700">
                        {summary.hardware.reduce(
                          (sum, h) => sum + h.total_packs,
                          0
                        )}{' '}
                        bucăți
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 italic">Nu există feronerie în această ofertă.</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Închide
          </button>
        </div>
      </div>
    </div>
  );
}

