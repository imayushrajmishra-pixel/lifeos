'use server';
import { insertRow, updateRow, deleteRow, optionalString } from './crud-helpers';

const paths = ['/private/tasks', '/private'];

export async function saveTask(formData: FormData) {
  const id = optionalString(formData, 'id');
  const values = {
    title: String(formData.get('title') || ''),
    notes: String(formData.get('notes') || ''),
    due_date: optionalString(formData, 'due_date'),
    priority: String(formData.get('priority') || 'medium'),
    category: String(formData.get('category') || 'general'),
    is_recurring: formData.get('is_recurring') === 'on',
    recurrence_rule: optionalString(formData, 'recurrence_rule'),
  };
  if (id) return updateRow('tasks', id, values, paths);
  return insertRow('tasks', values, paths);
}

export async function toggleTask(id: string, is_completed: boolean) {
  return updateRow('tasks', id, { is_completed, completed_at: is_completed ? new Date().toISOString() : null }, paths);
}

export async function deleteTask(id: string) {
  return deleteRow('tasks', id, paths);
}
