import type { Project } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export async function loadProjectsFromAPI(filters?: { category?: string; featured?: boolean }): Promise<Project[]> {
  try {
    const params = new URLSearchParams();
    if (filters?.category) {
      params.append('category', filters.category);
    }
    if (filters?.featured) {
      params.append('featured', 'true');
    }

    const url = `${API_BASE_URL}/projects${params.toString() ? '?' + params.toString() : ''}`;
    console.log('Fetching projects from API:', url);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.status}`);
    }

    const projects = await response.json();
    console.log(`Successfully loaded ${projects.length} projects from API`);
    return projects;
  } catch (error) {
    console.error('Error loading projects from API:', error);
    throw error;
  }
}

export async function getProjectByIdFromAPI(id: string): Promise<Project> {
  try {
    const url = `${API_BASE_URL}/projects/${id}`;
    console.log('Fetching project from API:', url);

    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Project not found');
      }
      throw new Error(`Failed to fetch project: ${response.status}`);
    }

    const project = await response.json();
    console.log('Successfully loaded project from API:', project.id);
    return project;
  } catch (error) {
    console.error('Error loading project from API:', error);
    throw error;
  }
}

export async function createProjectInAPI(project: Partial<Project>): Promise<{ id: string; message: string }> {
  try {
    const url = `${API_BASE_URL}/projects`;
    console.log('Creating project in API:', url);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(project),
    });

    if (!response.ok) {
      throw new Error(`Failed to create project: ${response.status}`);
    }

    const result = await response.json();
    console.log('Successfully created project:', result);
    return result;
  } catch (error) {
    console.error('Error creating project in API:', error);
    throw error;
  }
}
