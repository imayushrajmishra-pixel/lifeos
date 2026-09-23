'use server';
import { insertRow, updateRow, deleteRow, jsonField, optionalString } from './crud-helpers';

const paths = ['/private/bookmarks'];

export async function saveBookmark(formData: FormData) {
  const id = optionalString(formData, 'id');
  const values = {
    url: String(formData.get('url') || ''),
    title: String(formData.get('title') || ''),
    description: String(formData.get('description') || ''),
    category: String(formData.get('category') || 'personal'),
    tags: jsonField(formData, 'tags'),
    is_favorite: formData.get('is_favorite') === 'on',
  };
  if (id) return updateRow('bookmarks', id, values, paths);
  return insertRow('bookmarks', values, paths);
}

export async function deleteBookmark(id: string) {
  return deleteRow('bookmarks', id, paths);
}
