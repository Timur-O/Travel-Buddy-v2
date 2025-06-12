import { defineStore } from 'pinia';
import { db } from 'src/firebase/config';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  setDoc,
  query,
  where,
} from 'firebase/firestore';
import {
  Country,
  Group,
  Itinerary,
  ItineraryItem,
  NullableUser,
  UserData,
} from 'src/models';
import { omitId } from 'src/utils/HelperFunctions';

export const useFirestoreStore = defineStore('firestore', {
  state: () => ({
    countries: [] as Country[],
    groups: [] as Group[],
    userData: [] as UserData[],
    currentUser: null as NullableUser,
    itineraries: [] as Itinerary[],
    itineraryItems: [] as ItineraryItem[],
    loading: false,
    error: null as string | null,
  }),
  actions: {
    // EXPORT
    async exportCountries() {
      if (this.countries.length === 0) await this.fetchCountries();
      const jsonData = JSON.stringify(this.countries, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'countries.json';
      link.click();
      URL.revokeObjectURL(url);
    },
    async exportGroups() {
      if (this.groups.length === 0) await this.fetchGroups();
      const jsonData = JSON.stringify(this.groups, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'groups.json';
      link.click();
      URL.revokeObjectURL(url);
    },

    // COUNTRIES
    async fetchCountries() {
      if (this.loading) return;
      this.loading = true;
      try {
        const querySnapshot = await getDocs(collection(db, 'countries'));
        this.countries = querySnapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as Country)
        );
      } catch (error) {
        console.error(error);
        this.error = (error as Error).message;
      } finally {
        this.loading = false;
      }
    },
    async addCountry(country: Country) {
      if (this.loading) return;
      this.loading = true;
      try {
        const countryRef = doc(db, 'countries', country.id);
        await setDoc(countryRef, country);
        this.countries.push(country);
      } catch (error) {
        console.error(error);
        this.error = (error as Error).message;
      } finally {
        this.loading = false;
      }
    },
    async updateCountry(country: Country) {
      if (this.loading) return;
      this.loading = true;
      try {
        const countryRef = doc(db, 'countries', country.id);
        await updateDoc(countryRef, omitId(country));
        const index = this.countries.findIndex((c) => c.id === country.id);
        if (index !== -1) this.countries[index] = country;
      } catch (error) {
        console.error(error);
        this.error = (error as Error).message;
      } finally {
        this.loading = false;
      }
    },

    // GROUPS
    async fetchGroups() {
      if (this.loading) return;
      this.loading = true;
      try {
        const querySnapshot = await getDocs(collection(db, 'groups'));
        this.groups = querySnapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as Group)
        );
      } catch (error) {
        console.error(error);
        this.error = (error as Error).message;
      } finally {
        this.loading = false;
      }
    },
    async addGroup(group: Group) {
      if (this.loading) return;
      this.loading = true;
      try {
        const groupRef = doc(db, 'groups', group.id);
        await setDoc(groupRef, group);
        this.groups.push(group);
      } catch (error) {
        console.error(error);
        this.error = (error as Error).message;
      } finally {
        this.loading = false;
      }
    },
    async updateGroup(group: Group) {
      if (this.loading) return;
      this.loading = true;
      try {
        const groupRef = doc(db, 'groups', group.id);
        await updateDoc(groupRef, omitId(group));
        const index = this.groups.findIndex((g) => g.id === group.id);
        if (index !== -1) this.groups[index] = group;
      } catch (error) {
        console.error(error);
        this.error = (error as Error).message;
      } finally {
        this.loading = false;
      }
    },

    // USER DATA
    async fetchUserData(userId: string) {
      if (this.loading) return;
      this.loading = true;
      try {
        const q = query(
          collection(db, 'userData'),
          where('userId', '==', userId)
        );
        const querySnapshot = await getDocs(q);
        this.userData = querySnapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as UserData)
        );
      } catch (error) {
        console.error(error);
        this.error = (error as Error).message;
      } finally {
        this.loading = false;
      }
    },
    async addUserData(userData: Omit<UserData, 'id'>) {
      if (this.loading) return;
      this.loading = true;
      try {
        const docRef = await addDoc(collection(db, 'userData'), userData);
        this.userData.push({ id: docRef.id, ...userData } as UserData);
      } catch (error) {
        console.error(error);
        this.error = (error as Error).message;
      } finally {
        this.loading = false;
      }
    },
    async updateUserData(userData: UserData) {
      if (this.loading) return;
      this.loading = true;
      try {
        const userDataRef = doc(db, 'userData', userData.id);
        const updateData = {
          status: userData.status,
          note: userData.note,
          photos: userData.photos,
        };
        await updateDoc(userDataRef, updateData);
        const index = this.userData.findIndex((u) => u.id === userData.id);
        if (index !== -1) this.userData[index] = userData;
      } catch (error) {
        console.error(error);
        this.error = (error as Error).message;
      } finally {
        this.loading = false;
      }
    },
    async deleteUserData(userDataId: string) {
      if (this.loading) return;
      this.loading = true;
      try {
        await deleteDoc(doc(db, 'userData', userDataId));
        this.userData = this.userData.filter((u) => u.id !== userDataId);
      } catch (error) {
        console.error(error);
        this.error = (error as Error).message;
      } finally {
        this.loading = false;
      }
    },

    // USER
    async fetchCurrentUser(userId: string) {
      if (this.loading) return;
      this.loading = true;
      try {
        const userDocRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userDocRef);
        this.currentUser = userDoc.exists()
          ? ({ id: userDoc.id, ...userDoc.data() } as NullableUser)
          : null;
      } catch (error) {
        console.error(error);
        this.error = (error as Error).message;
      } finally {
        this.loading = false;
      }
    },
    async createUser(user: NullableUser) {
      if (this.loading) return;
      this.loading = true;
      try {
        await setDoc(doc(db, 'users', user!.id), user);
        this.currentUser = user;
      } catch (error) {
        console.error(error);
        this.error = (error as Error).message;
      } finally {
        this.loading = false;
      }
    },
    async updateUser(user: NullableUser) {
      if (this.loading) return;
      this.loading = true;
      try {
        const userRef = doc(db, 'users', user!.id);
        const shareCode = user!.sharingEnabled
          ? user!.shareCode || crypto.randomUUID().slice(0, 8)
          : '';
        const updateData = {
          email: user!.email,
          isAdmin: user!.isAdmin,
          sharingEnabled: user!.sharingEnabled,
          shareCode,
        };
        await updateDoc(userRef, updateData);
        this.currentUser = user;
      } catch (error) {
        console.error(error);
        this.error = (error as Error).message;
      } finally {
        this.loading = false;
      }
    },

    // ITINERARY
    async fetchItineraries(userId: string) {
      if (this.loading) return;
      this.loading = true;
      try {
        const q = query(
          collection(db, 'itineraries'),
          where('ownerId', '==', userId)
        );
        const querySnapshot = await getDocs(q);
        this.itineraries = querySnapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as Itinerary)
        );
      } catch (error) {
        console.error(error);
        this.error = (error as Error).message;
      } finally {
        this.loading = false;
      }
    },
    async addItinerary(itinerary: Omit<Itinerary, 'id'>) {
      if (this.loading) return;
      this.loading = true;
      try {
        const docRef = await addDoc(collection(db, 'itineraries'), itinerary);
        this.itineraries.push({ id: docRef.id, ...itinerary } as Itinerary);
      } catch (error) {
        console.error(error);
        this.error = (error as Error).message;
      } finally {
        this.loading = false;
      }
    },
    async deleteItinerary(itineraryId: string) {
      if (this.loading) return;
      this.loading = true;
      try {
        await deleteDoc(doc(db, 'itineraries', itineraryId));
        this.itineraries = this.itineraries.filter((i) => i.id !== itineraryId);
      } catch (error) {
        console.error(error);
        this.error = (error as Error).message;
      } finally {
        this.loading = false;
      }
    },
    async updateItinerary(itinerary: Itinerary) {
      if (this.loading) return;
      this.loading = true;
      try {
        const itineraryRef = doc(db, 'itineraries', itinerary.id);
        await updateDoc(itineraryRef, omitId(itinerary));
        const index = this.itineraries.findIndex((i) => i.id === itinerary.id);
        if (index !== -1) this.itineraries[index] = itinerary;
      } catch (error) {
        console.error(error);
        this.error = (error as Error).message;
      } finally {
        this.loading = false;
      }
    },
    async fetchItinerary(itineraryId: string) {
      if (this.loading) return;
      this.loading = true;
      try {
        const itineraryRef = doc(db, 'itineraries', itineraryId);
        const itineraryDoc = await getDoc(itineraryRef);
        if (itineraryDoc.exists()) {
          return { id: itineraryDoc.id, ...itineraryDoc.data() } as Itinerary;
        }
        return null;
      } catch (error) {
        console.error(error);
        this.error = (error as Error).message;
        return null;
      } finally {
        this.loading = false;
      }
    },

    // ITINERARY ITEMS
    async fetchItineraryItems(itineraryId: string) {
      if (this.loading) return;
      this.loading = true;
      try {
        const q = collection(db, `itineraries/${itineraryId}/items`);
        const querySnapshot = await getDocs(q);
        this.itineraryItems = querySnapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
              startDate: doc.data().startDate.toDate(),
              endDate: doc.data().endDate.toDate(),
            } as ItineraryItem)
        );
      } catch (error) {
        console.error(error);
        this.error = (error as Error).message;
      } finally {
        this.loading = false;
      }
    },
    async addItineraryItem(itineraryItem: Omit<ItineraryItem, 'id'>) {
      if (this.loading) return;
      this.loading = true;
      try {
        const docRef = await addDoc(
          collection(db, `itineraries/${itineraryItem.itineraryId}/items`),
          itineraryItem
        );
        this.itineraryItems.push({
          id: docRef.id,
          ...itineraryItem,
        } as ItineraryItem);
      } catch (error) {
        console.error(error);
        this.error = (error as Error).message;
      } finally {
        this.loading = false;
      }
    },
    async updateItineraryItem(itineraryItem: ItineraryItem) {
      if (this.loading) return;
      this.loading = true;
      try {
        const itemRef = doc(
          db,
          `itineraries/${itineraryItem.itineraryId}/items`,
          itineraryItem.id
        );
        await updateDoc(itemRef, omitId(itineraryItem));
        const index = this.itineraryItems.findIndex(
          (item) => item.id === itineraryItem.id
        );
        if (index !== -1) this.itineraryItems[index] = itineraryItem;
      } catch (error) {
        console.error(error);
        this.error = (error as Error).message;
      } finally {
        this.loading = false;
      }
    },
    async deleteItineraryItem(itineraryId: string, itemId: string) {
      if (this.loading) return;
      this.loading = true;
      try {
        await deleteDoc(doc(db, `itineraries/${itineraryId}/items`, itemId));
        this.itineraryItems = this.itineraryItems.filter(
          (item) => item.id !== itemId
        );
      } catch (error) {
        console.error(error);
        this.error = (error as Error).message;
      } finally {
        this.loading = false;
      }
    },
  },
});
