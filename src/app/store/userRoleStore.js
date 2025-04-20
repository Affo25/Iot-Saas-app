// stores/userRoleStore.js
import { create } from 'zustand';

const useUserRoleStore = create((set) => ({
  role: typeof window !== 'undefined' ? localStorage.getItem('user-role') || null : null,
  setRole: (role) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user-role', role);
    }
    set({ role });
  },
}));

export default useUserRoleStore;
