/**
 * Utility functions for parsing and managing location areas data
 */

export interface Town {
  name: string;
}

export interface City {
  name: string;
  towns: Town[];
}

/**
 * Parses HTML select element structure into structured city/town data
 * @param htmlContent - HTML content containing optgroups and options
 * @returns Array of cities with their towns
 */
export function parseAreasData(htmlContent: string): City[] {
  const cities: City[] = [];

  // Regular expressions to match optgroups and options
  const optgroupRegex = /<optgroup\s+label="([^"]+)">([\s\S]*?)<\/optgroup>/g;
  const optionRegex = /<option\s+value="\d+">([^<]+)<\/option>/g;

  let optgroupMatch;

  while ((optgroupMatch = optgroupRegex.exec(htmlContent)) !== null) {
    const cityName = optgroupMatch[1];
    const optionsContent = optgroupMatch[2];
    const towns: Town[] = [];

    let optionMatch;
    while ((optionMatch = optionRegex.exec(optionsContent)) !== null) {
      towns.push({
        name: optionMatch[1].trim(),
      });
    }

    if (towns.length > 0) {
      cities.push({
        name: cityName,
        towns: towns,
      });
    }
  }

  return cities;
}

/**
 * Gets all cities from areas data
 * @param areasData - Parsed areas data
 * @returns Array of city names
 */
export function getCities(areasData: City[]): string[] {
  return areasData.map(city => city.name);
}

/**
 * Gets towns for a specific city
 * @param areasData - Parsed areas data
 * @param cityName - Name of the city
 * @returns Array of towns for the city
 */
export function getTownsByCity(areasData: City[], cityName: string): Town[] {
  const city = areasData.find(c => c.name === cityName);
  return city ? city.towns : [];
}

/**
 * Gets a town by name
 * @param areasData - Parsed areas data
 * @param townName - Name of the town
 * @returns Town object or undefined
 */
export function getTownByName(areasData: City[], townName: string): Town | undefined {
  for (const city of areasData) {
    const town = city.towns.find(t => t.name === townName);
    if (town) return town;
  }
  return undefined;
}
