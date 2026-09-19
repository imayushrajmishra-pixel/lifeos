'use server';
import { insertRow, updateRow, deleteRow, optionalString } from './crud-helpers';

const paths = ['/private/books'];

export async function saveBook(formData: FormData) {
  const id = optionalString(formData, 'id');
  const values = {
    title: String(formData.get('title') || ''),
    author: optionalString(formData, 'author'),
    rating: optionalString(formData, 'rating') ? Number(formData.get('rating')) : null,
    date_read: optionalString(formData, 'date_read'),
    notes: String(formData.get('notes') || ''),
    favorite_quote: String(formData.get('favorite_quote') || ''),
    status: String(formData.get('status') || 'want_to_read'),
    visibility: String(formData.get('visibility') || 'private'),
  };
  if (id) return updateRow('books', id, values, paths);
  return insertRow('books', values, paths);
}

export async function deleteBook(id: string) {
  return deleteRow('books', id, paths);
}
