export interface Country {
  readonly id: string;
  readonly name: string;
  readonly size: number;
  readonly flag: string;
  readonly nonSovereignParent?: string;
  readonly nonSovereignType?: string;
  readonly safety: number; // 1 (safe) - 4 (do not travel)
  readonly cost_index: number; // 1 (cheapest) - 5 (most expensive) - 3 = The Netherlands
  readonly travel_price_nl: number; // 1 (cheapest) - 5 (most expensive)
}

export enum GroupType {
  Region = 'Region',
  Sovereignty = 'Sovereignty',
}

export interface Group {
  readonly id: string;
  readonly name: string;
  readonly type: GroupType;
  readonly countries: readonly string[];
}

export enum VisitStatus {
  Unvisited = 'Unvisited',
  Upcoming = 'Upcoming',
  Visited = 'Visited',
}

export interface UserData {
  readonly id: string;
  readonly userId: string;
  readonly countryId: string;
  readonly status: VisitStatus;
  readonly note: string;
  readonly photos: readonly string[];
}

export interface User {
  readonly id: string;
  readonly displayName: string;
  readonly email: string;
  readonly isAdmin: boolean;
  readonly sharingEnabled: boolean;
  readonly shareCode: string;
}

export type NullableUser = User | null;

export interface CountryImportData {
  readonly id: string;
  readonly name: string;
  readonly size: number;
  readonly flag: string;
  readonly region: string;
  readonly sovereignty: string;
  readonly parent: string;
  readonly type: string;
  readonly safety: number;
  readonly cost_index: number;
  readonly travel_price_nl: number;
}

export interface Itinerary {
  readonly id: string;
  readonly ownerId: string;
  readonly name: string;
  readonly completed: boolean;
}

export enum ItineraryItemType {
  None = 'None',
  Flight = 'Flight',
  Train = 'Train',
  Bus = 'Bus',
  Accommodation = 'Accommodation',
}

export interface ItineraryItem {
  readonly id: string;
  readonly itineraryId: string;
  readonly booked: boolean;
  readonly startDate: Date;
  readonly endDate: Date;
  readonly itemType: ItineraryItemType;

  // Only Trains / Flights
  readonly startTime?: string;
  readonly endTime?: string;
  readonly departurePort: string;
  readonly arrivalPort: string;
  // Only Trains / Flights End

  // Only Non-Trains / Flights
  readonly detailedLocation: string;
  readonly countryId: string;
  // Only Non-Trains / Flights End

  readonly note: string;
  readonly pricePerPerson: number;
}
