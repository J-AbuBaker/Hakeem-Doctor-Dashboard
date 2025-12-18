import { useState, useEffect } from 'react';
import { parseAreasData, City } from './areasParser';

/**
 * Hook to load and parse areas data
 * @returns Parsed areas data and loading state
 */
export function useAreasData(): { areasData: City[]; isLoading: boolean; error: Error | null } {
  const [areasData, setAreasData] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadAreasData = async () => {
      try {
        const response = await fetch('/areas_en.json');
        if (!response.ok) {
          throw new Error('Failed to load areas data');
        }
        const jsonData = await response.json();
        // If it's already JSON (new format), use it directly
        // Otherwise, parse HTML (backward compatibility)
        if (Array.isArray(jsonData) && jsonData.length > 0 && jsonData[0].name && jsonData[0].towns) {
          setAreasData(jsonData);
        } else {
          // Fallback: try parsing as HTML
          const htmlContent = typeof jsonData === 'string' ? jsonData : JSON.stringify(jsonData);
          const parsed = parseAreasData(htmlContent);
          setAreasData(parsed);
        }
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load areas data'));
        setIsLoading(false);
      }
    };

    loadAreasData();
  }, []);

  return { areasData, isLoading, error };
}
