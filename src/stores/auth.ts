import { defineStore } from 'pinia';
import { auth } from 'src/firebase/config';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  User,
  AuthError,
} from 'firebase/auth';
import { useFirestoreStore } from 'stores/firestore';

let firestoreStoreInstance: ReturnType<typeof useFirestoreStore>;

export const useAuthStore = defineStore('auth', {
  state: () => ({
    authUser: null as User | null,
    loading: false,
    error: null as string | null,
  }),
  actions: {
    init() {
      return new Promise((resolve) => {
        onAuthStateChanged(auth, async (user) => {
          this.authUser = user;
          if (user) {
            firestoreStoreInstance =
              firestoreStoreInstance || useFirestoreStore();
            await firestoreStoreInstance.fetchCurrentUser(user.uid);
          }
          resolve(true);
        });
      });
    },
    async register(displayName: string, email: string, password: string) {
      if (this.loading) return;
      this.loading = true;
      this.error = null;

      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        this.authUser = userCredential.user;

        firestoreStoreInstance = firestoreStoreInstance || useFirestoreStore();
        await firestoreStoreInstance.createUser({
          id: this.authUser.uid,
          displayName: displayName,
          email: this.authUser.email!,
          isAdmin: false,
          sharingEnabled: false,
          shareCode: '',
        });
      } catch (error) {
        this.error = (error as AuthError).code || (error as Error).message;
        throw error;
      } finally {
        this.loading = false;
      }
    },
    async login(email: string, password: string) {
      if (this.loading) return;
      this.loading = true;
      this.error = null;

      try {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
        this.authUser = userCredential.user;

        firestoreStoreInstance = firestoreStoreInstance || useFirestoreStore();
        await firestoreStoreInstance.fetchCurrentUser(this.authUser.uid);
      } catch (error) {
        this.error = (error as AuthError).code || (error as Error).message;
        throw error;
      } finally {
        this.loading = false;
      }
    },
    async logout() {
      if (this.loading) return;
      this.loading = true;
      this.error = null;

      try {
        await signOut(auth);
        this.authUser = null;

        firestoreStoreInstance = firestoreStoreInstance || useFirestoreStore();
        firestoreStoreInstance.$reset();
      } catch (error) {
        this.error = (error as AuthError).code || (error as Error).message;
        throw error;
      } finally {
        this.loading = false;
      }
    },
    async forgotPassword(email: string) {
      if (this.loading) return;
      this.loading = true;
      this.error = null;

      try {
        await sendPasswordResetEmail(auth, email);
      } catch (error) {
        this.error = (error as AuthError).code || (error as Error).message;
        throw error;
      } finally {
        this.loading = false;
      }
    },
    async changeEmail(newEmail: string) {
      if (this.loading || !this.authUser) return;
      this.loading = true;
      this.error = null;

      try {
        await updateEmail(this.authUser, newEmail);
        firestoreStoreInstance = firestoreStoreInstance || useFirestoreStore();
        await firestoreStoreInstance.updateUser({
          ...firestoreStoreInstance.currentUser!,
          email: newEmail,
        });
      } catch (error) {
        this.error = (error as AuthError).code || (error as Error).message;
        throw error;
      } finally {
        this.loading = false;
      }
    },
    async changePassword(currentPassword: string, newPassword: string) {
      if (this.loading || !this.authUser) return;
      this.loading = true;
      this.error = null;

      try {
        const credential = EmailAuthProvider.credential(
          this.authUser.email!,
          currentPassword
        );
        await reauthenticateWithCredential(this.authUser, credential);
        await updatePassword(this.authUser, newPassword);
      } catch (error) {
        this.error = (error as AuthError).code || (error as Error).message;
        throw error;
      } finally {
        this.loading = false;
      }
    },
  },
});
