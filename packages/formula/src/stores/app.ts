import { derived, writable } from 'svelte/store';

const initialState = {
  file: null
};

function createApp() {
  const { subscribe, set, update } = writable(initialState);

  return {
    subscribe,
    reset: () => set(initialState),
    set: (val) => set(val),
  };
}
export const app = createApp();
