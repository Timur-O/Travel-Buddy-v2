import { Country, Group, GroupType, UserData, VisitStatus } from 'src/models';

export interface RegionStats {
  name: string;
  totalCountries: number;
  visitedCount: number;
  completionPercentage: number;
  areaPercentage: number;
  averageDifficulty: number;
  totalArea: number;
  visitedArea: number;
}

interface DifficultyStats {
  level: number;
  count: number;
  percentage: number;
}

export function calculateCountryDifficulty(country: Country): number {
  const safetyWeight = 0.5;
  const costWeight = 0.25;
  const travelPriceWeight = 0.25;

  const normalizedSafety = (country.safety - 1) / 3;
  const normalizedCost = (country.cost_index - 1) / 4;
  const normalizedTravelPrice = (country.travel_price_nl - 1) / 4;

  return Math.round(
    (normalizedSafety * safetyWeight +
      normalizedCost * costWeight +
      normalizedTravelPrice * travelPriceWeight) *
      4 +
      1
  );
}

export function calculateDifficultyDistribution(
  countries: Country[],
  userData: UserData[],
  groups: Group[] = [],
  selectedSovereignties: string[] = []
): DifficultyStats[] {
  // Filter countries by sovereignty first
  const sovereigntyGroups = groups.filter(
    (g) => g.type === GroupType.Sovereignty
  );
  const filteredCountries =
    selectedSovereignties.length === 0
      ? countries
      : countries.filter((c) =>
          sovereigntyGroups
            .filter((sg) => selectedSovereignties.includes(sg.id))
            .some((sg) => sg.countries.includes(c.id))
        );

  const visitedCountryIds = new Set(
    userData
      .filter((ud) => ud.status === VisitStatus.Visited)
      .map((ud) => ud.countryId)
  );

  const visitedCountries = filteredCountries.filter((country) =>
    visitedCountryIds.has(country.id)
  );
  const totalVisited = visitedCountries.length;

  return [1, 2, 3, 4, 5].map((level) => {
    const count = visitedCountries.filter(
      (country) => calculateCountryDifficulty(country) === level
    ).length;
    return {
      level,
      count,
      percentage: totalVisited ? (count / totalVisited) * 100 : 0,
    };
  });
}

export function calculateRegionStats(
  countries: Country[],
  groups: Group[],
  userData: UserData[],
  selectedSovereignties: string[] = [],
  selectedRegions: string[] = []
): RegionStats[] {
  const visitedCountryIds = new Set(
    userData
      .filter((ud) => ud.status === VisitStatus.Visited)
      .map((ud) => ud.countryId)
  );

  const sovereigntyGroups = groups.filter(
    (g) => g.type === GroupType.Sovereignty
  );
  const allowedCountryIds = new Set(
    selectedSovereignties.length === 0
      ? countries.map((c) => c.id)
      : countries
          .filter((c) =>
            sovereigntyGroups
              .filter((sg) => selectedSovereignties.includes(sg.id))
              .some((sg) => sg.countries.includes(c.id))
          )
          .map((c) => c.id)
  );

  const regions = groups.filter(
    (g) =>
      g.type === GroupType.Region &&
      (selectedRegions.length === 0 || selectedRegions.includes(g.id))
  );

  return regions.map((region) => {
    const regionCountries = countries.filter(
      (c) => allowedCountryIds.has(c.id) && region.countries.includes(c.id)
    );
    const visitedCountries = regionCountries.filter((c) =>
      visitedCountryIds.has(c.id)
    );

    const totalArea = regionCountries.reduce(
      (sum, country) => sum + country.size,
      0
    );
    const visitedArea = visitedCountries.reduce(
      (sum, country) => sum + country.size,
      0
    );
    const averageDifficulty =
      visitedCountries.length > 0
        ? visitedCountries.reduce(
            (sum, country) => sum + calculateCountryDifficulty(country),
            0
          ) / visitedCountries.length
        : 0;

    return {
      name: region.name,
      totalCountries: regionCountries.length,
      visitedCount: visitedCountries.length,
      completionPercentage: regionCountries.length
        ? (visitedCountries.length / regionCountries.length) * 100
        : 0,
      areaPercentage: totalArea ? (visitedArea / totalArea) * 100 : 0,
      averageDifficulty,
      totalArea,
      visitedArea,
    };
  });
}

export function calculateWorldStats(
  countries: Country[],
  userData: UserData[],
  groups: Group[],
  selectedSovereignties: string[] = []
): RegionStats {
  const visitedCountryIds = new Set(
    userData
      .filter((ud) => ud.status === VisitStatus.Visited)
      .map((ud) => ud.countryId)
  );

  const sovereigntyGroups = groups.filter(
    (g) => g.type === GroupType.Sovereignty
  );
  const filteredCountries =
    selectedSovereignties.length === 0
      ? countries
      : countries.filter((c) =>
          sovereigntyGroups
            .filter((sg) => selectedSovereignties.includes(sg.id))
            .some((sg) => sg.countries.includes(c.id))
        );

  const visitedCountries = filteredCountries.filter((c) =>
    visitedCountryIds.has(c.id)
  );

  const totalArea = filteredCountries.reduce(
    (sum, country) => sum + country.size,
    0
  );
  const visitedArea = visitedCountries.reduce(
    (sum, country) => sum + country.size,
    0
  );
  const averageDifficulty =
    visitedCountries.length > 0
      ? visitedCountries.reduce(
          (sum, country) => sum + calculateCountryDifficulty(country),
          0
        ) / visitedCountries.length
      : 0;

  return {
    name: 'World',
    totalCountries: filteredCountries.length,
    visitedCount: visitedCountries.length,
    completionPercentage: filteredCountries.length
      ? (visitedCountries.length / filteredCountries.length) * 100
      : 0,
    areaPercentage: totalArea ? (visitedArea / totalArea) * 100 : 0,
    averageDifficulty,
    totalArea,
    visitedArea,
  };
}
