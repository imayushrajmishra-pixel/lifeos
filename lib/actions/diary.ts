'use server';
import { insertRow, updateRow, deleteRow, jsonField, optionalString } from './crud-helpers';

const paths = ['/private/diary', '/private'];

export async function saveDiaryEntry(formData: FormData) {
  const id = optionalString(formData, 'id');
  const values = {
    title: String(formData.get('title') || ''),
    entry_date: String(formData.get('entry_date') || new Date().toISOString().slice(0, 10)),
    content: String(formData.get('content') || ''),
    mood: optionalString(formData, 'mood'),
    tags: jsonField(formData, 'tags'),
    location: optionalString(formData, 'location'),
    is_favorite: formData.get('is_favorite') === 'on',
    updated_at: new Date().toISOString(),
  };
  if (id) return updateRow('diary_entries', id, values, paths);
  return insertRow('diary_entries', values, paths);
}

export async function deleteDiaryEntry(id: string) {
  return deleteRow('diary_entries', id, paths);
}

export async function toggleDiaryFavorite(id: string, is_favorite: boolean) {
  return updateRow('diary_entries', id, { is_favorite }, paths);
}
