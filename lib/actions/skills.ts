'use server';
import { insertRow, updateRow, deleteRow, optionalString } from './crud-helpers';

const paths = ['/skills', '/about', '/private/settings'];

export async function saveSkill(formData: FormData) {
  const id = optionalString(formData, 'id');
  const values = {
    name: String(formData.get('name') || ''),
    category: String(formData.get('category') || 'other'),
    description: String(formData.get('description') || ''),
    status: String(formData.get('status') || 'exploring'),
    started_on: optionalString(formData, 'started_on'),
    is_interest: formData.get('is_interest') === 'on',
    visibility: String(formData.get('visibility') || 'public'),
  };
  if (id) return updateRow('skills', id, values, paths);
  return insertRow('skills', values, paths);
}

export async function deleteSkill(id: string) {
  return deleteRow('skills', id, paths);
}
