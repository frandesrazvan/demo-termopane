import { Settings, LayoutGrid, FileText, LogOut } from 'lucide-react';
import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface LayoutProps {
  children: ReactNode;
  currentPage: 'settings' | 'quotes' | 'new-quote';
  onNavigate: (page: 'settings' | 'quotes' | 'new-quote') => void;
}

export default function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const navItems = [
    { id: 'quotes' as const, label: 'Oferte', icon: FileText },
    { id: 'new-quote' as const, label: 'Ofertă Nouă', icon: LayoutGrid },
    { id: 'settings' as const, label: 'Setări', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-800">Termopane Manager</h1>
          <p className="text-sm text-gray-500 mt-1">Configurator & Ofertare</p>
        </div>

        <nav className="p-4">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;

              return (
                <li key={item.id}>
                  <button
                    onClick={() => onNavigate(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="mt-auto p-4 border-t border-gray-200">
          <button
            onClick={async () => {
              await signOut();
              navigate('/login', { replace: true });
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
