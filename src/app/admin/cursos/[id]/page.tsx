import { notFound } from 'next/navigation';
import { carregarEditor } from '../acoes';
import { Editor } from '@/components/admin/Editor';
import { GEMINI_KEY } from '@/lib/config';

export default async function EditarCurso({ params }: { params: Promise<{ id: string }> }) {
  const c = await carregarEditor((await params).id);
  if (!c) notFound();
  return <Editor inicial={c} iaDisponivel={!!GEMINI_KEY} />;
}
