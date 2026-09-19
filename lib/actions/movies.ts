'use server';
import { insertRow, updateRow, deleteRow, optionalString } from './crud-helpers';

const paths = ['/private/movies'];

export async function saveMovie(formData: FormData) {
  const id = optionalString(formData, 'id');
  const values = {
    title: String(formData.get('title') || ''),
    year: optionalString(formData, 'year') ? Number(formData.get('year')) : null,
    rating: optionalString(formData, 'rating') ? Number(formData.get('rating')) : null,
    date_watched: optionalString(formData, 'date_watched'),
    review: String(formData.get('review') || ''),
    is_favorite: formData.get('is_favorite') === 'on',
    genre: optionalString(formData, 'genre'),
    is_watchlist: formData.get('is_watchlist') === 'on',
    visibility: String(formData.get('visibility') || 'private'),
  };
  if (id) return updateRow('movies', id, values, paths);
  return insertRow('movies', values, paths);
}

export async function deleteMovie(id: string) {
  return deleteRow('movies', id, paths);
}
