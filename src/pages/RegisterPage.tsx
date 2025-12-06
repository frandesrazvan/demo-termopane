import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setInfo(null);

    const { error } = await signUp({ email, password });
    setSubmitting(false);

    if (error) {
      setError(error || 'Înregistrarea a eșuat. Te rugăm să încerci din nou.');
      return;
    }

    setInfo('Cont creat cu succes. Verifică email-ul dacă este necesară confirmarea.');
    navigate('/login', { replace: true });
  };

  return (
    <AuthLayout
      title="Creează cont"
      subtitle="Înregistrează-te pentru a-ți salva materialele și ofertele în cloud."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        {info && (
          <div className="rounded-md bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700">
            {info}
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">
            Parolă
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
            placeholder="Minim 6 caractere"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full flex justify-center items-center px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors font-medium text-base"
        >
          {submitting ? 'Se creează contul...' : 'Creează cont'}
        </button>
        <p className="text-center text-sm text-gray-500">
          Ai deja cont?{' '}
          <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
            Autentifică-te
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}


