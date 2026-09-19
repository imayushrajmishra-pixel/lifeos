'use server';
import { insertRow, updateRow, deleteRow, jsonField, optionalString } from './crud-helpers';
import { slugify } from '@/lib/utils';

const paths = ['/projects', '/', '/private/projects'];

export async function saveProject(formData: FormData) {
  const id = optionalString(formData, 'id');
  const name = String(formData.get('name') || '');
  const values = {
    name,
    slug: optionalString(formData, 'slug') || slugify(name),
    description: String(formData.get('description') || ''),
    cover_url: optionalString(formData, 'cover_url'),
    start_date: optionalString(formData, 'start_date'),
    end_date: optionalString(formData, 'end_date'),
    status: String(formData.get('status') || 'idea'),
    tools: jsonField(formData, 'tools'),
    link: optionalString(formData, 'link'),
    github_link: optionalString(formData, 'github_link'),
    learned: String(formData.get('learned') || ''),
    challenges: String(formData.get('challenges') || ''),
    outcome: String(formData.get('outcome') || ''),
    is_featured: formData.get('is_featured') === 'on',
    visibility: String(formData.get('visibility') || 'private'),
    updated_at: new Date().toISOString(),
  };
  if (id) return updateRow('projects', id, values, paths);
  return insertRow('projects', values, paths);
}

export async function deleteProject(id: string) {
  return deleteRow('projects', id, paths);
}
