import { derived, writable } from "svelte/store";

const Steps = [
  {
    title: 'Sampling',
    list: [
      'Sampling the original image for color statistics.'
    ]
  },
  {
    title: 'Splitting',
    list: [
      'Put all the pixels of the image (that is, their RGB values) in a bucket.',
      'Find out which color channel (red, green, or blue) among the pixels in the bucket has the greatest range, then sort the pixels according to that channel\'s values.',
      'After the bucket has been sorted, move the upper half of the pixels into a new bucket.'
    ]
  },
  {
    title: 'Calculate the average color',
    list: [
      'Average the pixels in each bucket and you have a palette of 16 colors.'
    ]
  },
  {
    title: 'Mapping',
    list: [
      'Mapping the colors to their representative in the color map.'
    ]
  },
];

const initialState = {
  steps: Steps,
  current: 0
}

function createSteps() {
  const { subscribe, set, update } = writable(initialState);

  return {
    subscribe,
    reset: () => set(initialState),
    update: (val) => set({...initialState, current: val}),
    set: (val) => set(val),
  };
}
export const steps = createSteps();
