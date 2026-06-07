import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { renderMarkdown } from '../../lib/markdown';

/**
 * Renders a policy Markdown document with a prominent DRAFT banner.
 * The Markdown source lives in /policies at the repo root (client review copy).
 */
export default function PolicyPage({ markdown }) {
  return (
    <div className="bg-cream min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        {/* DRAFT banner */}
        <div className="bg-amber-100 border border-amber-300 text-amber-900 rounded-2xl px-4 py-3 mb-8 flex items-center gap-2.5 text-sm font-semibold">
          <AlertTriangle size={16} className="flex-shrink-0" />
          DRAFT — pending client review
        </div>

        <div dangerouslySetInnerHTML={{ __html: renderMarkdown(markdown) }} />

        <div className="mt-10 pt-6 border-t border-stone-200">
          <Link to="/" className="text-sm text-stone-500 hover:text-stone-800 inline-flex items-center gap-1.5 transition-colors">
            <ArrowLeft size={14} /> Back to store
          </Link>
        </div>
      </div>
    </div>
  );
}
