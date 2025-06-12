import { Country, Group, GroupType, UserData, VisitStatus } from 'src/models';
import { useFiltersStore } from 'stores/filters';

export function omitId<T extends { id: string }>(obj: T): Omit<T, 'id'> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, ...rest } = obj;
  return rest;
}

export function filterCountries(
  countries: Country[],
  groups: Group[],
  userData: UserData[]
): Country[] {
  const filters = useFiltersStore();

  // Early return for search query
  if (filters.searchQuery) {
    const query = filters.searchQuery.toLowerCase();
    return countries.filter((c) => c.name.toLowerCase().includes(query));
  }

  // Pre-compute filtered groups
  const regionGroups =
    filters.selectedRegions.length > 0
      ? groups.filter((g) => g.type === GroupType.Region)
      : [];

  const sovereigntyGroups =
    filters.selectedSovereignties.length > 0
      ? groups.filter((g) => g.type === GroupType.Sovereignty)
      : [];

  // Create lookup map for userData
  const userDataMap = new Map(userData.map((data) => [data.countryId, data]));

  return countries.filter((country) => {
    // Region filter
    if (filters.selectedRegions.length > 0) {
      const countryRegions = regionGroups.filter((g) =>
        g.countries.includes(country.id)
      );
      if (!countryRegions.some((r) => filters.selectedRegions.includes(r.id))) {
        return false;
      }
    }

    // Sovereignty filter
    if (filters.selectedSovereignties.length > 0) {
      const countrySovereignties = sovereigntyGroups.filter((g) =>
        g.countries.includes(country.id)
      );
      if (
        !countrySovereignties.some((s) =>
          filters.selectedSovereignties.includes(s.id)
        )
      ) {
        return false;
      }
    }

    // User status filter
    if (filters.selectedUserStatus.length > 0) {
      const countryUserData = userDataMap.get(country.id);
      const isUnvisited =
        !countryUserData &&
        filters.selectedUserStatus.includes(VisitStatus.Unvisited);
      const hasMatchingStatus =
        countryUserData &&
        filters.selectedUserStatus.includes(countryUserData.status);

      return isUnvisited || hasMatchingStatus;
    }

    return true;
  });
}
