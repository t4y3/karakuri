import { derived, writable } from 'svelte/store';

const initialState = {
  bucketsCount: 8,
};

function createSettings() {
  const { subscribe, set, update } = writable(initialState);

  return {
    subscribe,
    reset: () => set(initialState),
    set: (val) => set(val),
  };
}
export const settings = createSettings();
