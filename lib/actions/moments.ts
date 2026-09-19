'use server';
import { insertRow, updateRow, deleteRow, optionalString } from './crud-helpers';

const paths = ['/moments', '/', '/private/memories'];

export async function saveMoment(formData: FormData) {
  const id = optionalString(formData, 'id');
  const values = {
    photo_url: optionalString(formData, 'photo_url'),
    video_url: optionalString(formData, 'video_url'),
    caption: String(formData.get('caption') || ''),
    occurred_on: String(formData.get('occurred_on') || new Date().toISOString().slice(0, 10)),
    location: optionalString(formData, 'location'),
    people: optionalString(formData, 'people'),
    category: String(formData.get('category') || 'random'),
    is_featured: formData.get('is_featured') === 'on',
    visibility: String(formData.get('visibility') || 'private'),
  };
  if (id) return updateRow('moments', id, values, paths);
  return insertRow('moments', values, paths);
}

export async function deleteMoment(id: string) {
  return deleteRow('moments', id, paths);
}
