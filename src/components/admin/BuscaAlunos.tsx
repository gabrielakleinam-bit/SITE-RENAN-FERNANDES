'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export function BuscaAlunos({ inicial }: { inicial: string }) {
  const [q, setQ] = useState(inicial);
  const router = useRouter();
  useEffect(() => { const t = setTimeout(() => { if (q !== inicial) router.replace(`/admin/alunos${q ? `?q=${encodeURIComponent(q)}` : ''}`); }, 350); return () => clearTimeout(t); }, [q, inicial, router]);
  return (
    <label className="search4">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
      <input placeholder="Buscar por nome ou e-mail" value={q} onChange={e => setQ(e.target.value)} aria-label="Buscar aluno" />
    </label>
  );
}
