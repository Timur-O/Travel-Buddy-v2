import { defineStore } from 'pinia';

type FilterState = {
  selectedRegions: string[];
  selectedSovereignties: string[];
  selectedUserStatus: string[];
  searchQuery: string;
  simpleMode: boolean;
};

export const useFiltersStore = defineStore('filters', {
  state: (): FilterState => ({
    selectedRegions: [],
    selectedSovereignties: [],
    selectedUserStatus: [],
    searchQuery: '',
    simpleMode: false,
  }),
  getters: {
    getSelectedRegions: (state): string[] => state.selectedRegions,
    getSelectedSovereignties: (state): string[] => state.selectedSovereignties,
    getSelectedUserStatus: (state): string[] => state.selectedUserStatus,
    getSearchQuery: (state): string => state.searchQuery,
  },
  actions: {
    setSelectedRegions(regions: readonly string[]): void {
      this.selectedRegions = [...regions];
    },
    setSelectedSovereignties(sovereignties: readonly string[]): void {
      this.selectedSovereignties = [...sovereignties];
    },
    setSelectedUserStatus(statuses: readonly string[]): void {
      this.selectedUserStatus = [...statuses];
    },
    setSearchQuery(query: string): void {
      this.searchQuery = query.trim();
    },
    clearAllFilters(): void {
      this.selectedRegions = [];
      this.selectedSovereignties = [];
      this.selectedUserStatus = [];
      this.searchQuery = '';
    },
  },
});
