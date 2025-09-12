import { useState, useCallback } from 'react';
import { Project } from '../types';
import { translateProject, ProjectTranslation } from '../services/openaiService';

const TRANSLATION_CACHE_KEY = 'project_translations';

interface TranslationCache {
  [projectId: string]: {
    [language: string]: ProjectTranslation;
  };
}

export function useProjectTranslation() {
  const [translatingProjects, setTranslatingProjects] = useState<Set<string>>(new Set());

  // Load translations from localStorage
  const getCachedTranslations = useCallback((): TranslationCache => {
    try {
      const cached = localStorage.getItem(TRANSLATION_CACHE_KEY);
      return cached ? JSON.parse(cached) : {};
    } catch {
      return {};
    }
  }, []);

  // Save translations to localStorage
  const saveCachedTranslations = useCallback((cache: TranslationCache) => {
    try {
      localStorage.setItem(TRANSLATION_CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.error('Failed to save translation cache:', error);
    }
  }, []);

  // Get translated content for a project
  const getTranslatedContent = useCallback((project: Project, language: string) => {
    console.log('getTranslatedContent called for project:', project.id, 'language:', language);
    
    if (language === 'ru') {
      // Russian is the original language, return original content
      console.log('Returning original content for Russian');
      return {
        title: project.title,
        tagline: project.tagline,
        description: project.description,
        problems: project.problems,
        creatorBio: project.creatorBio,
        faq: project.faq,
        rewards: project.rewards
      };
    }

    const cache = getCachedTranslations();
    const projectTranslations = cache[project.id];
    
    console.log('Cache for project:', project.id, ':', projectTranslations);
    
    if (projectTranslations && projectTranslations[language]) {
      console.log('Found cached translation for language:', language);
      return projectTranslations[language];
    }

    console.log('No cached translation found, returning null');
    return null;
  }, [getCachedTranslations]);

  // Translate a project
  const translateProjectContent = useCallback(async (project: Project, targetLanguage: string): Promise<ProjectTranslation | null> => {
    if (targetLanguage === 'ru') {
      return null; // No translation needed for Russian
    }

    // Check if already translating
    if (translatingProjects.has(project.id)) {
      return null;
    }

    // Check cache first
    const cache = getCachedTranslations();
    const projectTranslations = cache[project.id];
    
    if (projectTranslations && projectTranslations[targetLanguage]) {
      return projectTranslations[targetLanguage];
    }

    // Set loading state
    setTranslatingProjects(prev => new Set(prev).add(project.id));

    try {
      const translation = await translateProject(project, targetLanguage);
      
      // Cache the translation
      const updatedCache = {
        ...cache,
        [project.id]: {
          ...projectTranslations,
          [targetLanguage]: translation
        }
      };
      saveCachedTranslations(updatedCache);

      return translation;
    } catch (error) {
      console.error('Translation failed:', error);
      return null;
    } finally {
      setTranslatingProjects(prev => {
        const newSet = new Set(prev);
        newSet.delete(project.id);
        return newSet;
      });
    }
  }, [translatingProjects, getCachedTranslations, saveCachedTranslations]);

  // Check if project is currently being translated
  const isTranslating = useCallback((projectId: string) => {
    return translatingProjects.has(projectId);
  }, [translatingProjects]);

  // Clear translation cache
  const clearTranslationCache = useCallback(() => {
    localStorage.removeItem(TRANSLATION_CACHE_KEY);
  }, []);

  return {
    getTranslatedContent,
    translateProjectContent,
    isTranslating,
    clearTranslationCache
  };
}
