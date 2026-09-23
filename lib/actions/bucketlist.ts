'use server';
import { insertRow, updateRow, deleteRow, optionalString } from './crud-helpers';

const paths = ['/private/bucket-list'];

export async function saveBucketItem(formData: FormData) {
  const id = optionalString(formData, 'id');
  const values = {
    goal: String(formData.get('goal') || ''),
    category: String(formData.get('category') || 'personal'),
    description: String(formData.get('description') || ''),
    priority: String(formData.get('priority') || 'medium'),
    deadline: optionalString(formData, 'deadline'),
    notes: String(formData.get('notes') || ''),
    visibility: String(formData.get('visibility') || 'private'),
  };
  if (id) return updateRow('bucket_list', id, values, paths);
  return insertRow('bucket_list', values, paths);
}

export async function toggleBucketComplete(id: string, is_completed: boolean) {
  return updateRow(
    'bucket_list',
    id,
    { is_completed, completed_on: is_completed ? new Date().toISOString().slice(0, 10) : null },
    paths
  );
}

export async function deleteBucketItem(id: string) {
  return deleteRow('bucket_list', id, paths);
}
