'use client';
import dynamic from 'next/dynamic';
const NotePresetsPage = dynamic(() =>
  import('@/features/note-presets/pages/NotePresetsPage').then((m) => m.NotePresetsPage)
);
export default function Page() {
  return <NotePresetsPage />;
}
