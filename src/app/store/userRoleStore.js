// stores/userRoleStore.js
import { create } from 'zustand';

const useUserRoleStore = create((set) => ({
  role: null,
  setRole: (role) => set({ role }),
}));

export default useUserRoleStore;
