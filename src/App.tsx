import React, { useState, FormEvent, useEffect, useRef } from 'react';
import { Palmtree } from 'lucide-react';

export default function App() {
  const [url, setUrl] = useState('');
  const [domain, setDomain] = useState('nj.xo.je');
  const [shortUrl, setShortUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const domains = ['ggland.vercel.app', 'gglnd.vercel.app', 'glnd.vercel.app'];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    // Auto prepend https if missing
    let finalUrl = url.trim();
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = `https://${finalUrl}`;
    }

    setError('');
    setShortUrl('');
    setLoading(true);

    try {
      const res = await fetch('/api/shorten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: finalUrl, domain }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Произошла ошибка при сокращении ссылки');
      }
      
      setShortUrl(data.shortUrl);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!shortUrl) return;
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="min-h-screen bg-white text-black font-sans flex flex-col items-center">
      <div className="w-full max-w-3xl px-6 pt-20 pb-10 flex flex-col items-start">
        
        {/* Header / Logo */}
        <div className="mb-14 flex justify-between items-start">
          <div>
            <div className="flex items-center mb-2">
              <Palmtree className="text-blue-950 w-12 h-12 mr-3" strokeWidth={2.5} />
              <h1 className="text-5xl font-bold tracking-tight text-blue-950">
                Land
              </h1>
            </div>
            <p className="text-gray-600 text-lg">
              Хватит тонуть в цифровом океане. Land — твой личный остров.
            </p>
          </div>
        </div>

        {/* Main Box */}
        <div className="w-full mb-10">
          <div className="mb-3 flex items-center space-x-2">
             <label htmlFor="domain-select" className="text-gray-700 font-medium text-sm">Домен:</label>
             <select 
               id="domain-select"
               value={domain} 
               onChange={(e) => setDomain(e.target.value)}
               className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 outline-none"
             >
               {domains.map((d) => (
                 <option key={d} value={d}>{d}</option>
               ))}
             </select>
          </div>
          <form onSubmit={handleSubmit} className="relative flex flex-col sm:flex-row shadow-sm border border-gray-300 rounded-lg overflow-hidden focus-within:border-yellow-400 focus-within:ring-1 focus-within:ring-yellow-400">
            <input
              ref={inputRef}
              type="text"
              placeholder="Введите ссылку"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-grow px-5 py-4 w-full outline-none text-xl placeholder-gray-400 bg-white"
            />
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="px-10 py-4 bg-blue-950 hover:bg-blue-900 text-white font-medium transition-colors text-xl disabled:opacity-70 disabled:cursor-not-allowed whitespace-nowrap"
            >
              Создать остров
            </button>
          </form>

          {/* Error Message */}
          {error && (
             <div className="mt-4 text-red-600 text-md">
                {error}
             </div>
          )}

          {/* Result Output */}
          {shortUrl && (
            <div className="mt-8 mb-4 border border-gray-200 rounded-lg p-6 bg-gray-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <a 
                href={shortUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-2xl font-medium text-blue-600 hover:text-red-500 hover:underline truncate w-full sm:w-auto"
              >
                {shortUrl}
              </a>
              <button
                onClick={handleCopy}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 rounded border border-gray-300 text-black font-medium transition-colors whitespace-nowrap active:bg-gray-400"
              >
                {copied ? 'Скопировано!' : 'Скопировать'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
