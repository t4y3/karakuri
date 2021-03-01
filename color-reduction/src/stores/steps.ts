import { derived, writable } from "svelte/store";

// const Steps = [
//   'Sampling the original image for color statistics.',
//   'Find the smallest box which contains all the colors in the image.',
//     'Sort the enclosed colors along the longest axis of the box.',
//     'Split the box into 2 regions at median of the sorted list.',
//     'Repeat the above process until the original color space has been divided into 256 regions.',
//   'The representative colors are found by averaging the colors in each box, and the appropriate color map index assigned to each color in that box.'
// ];
const Steps = [
  '画像内の色をサンプリングして色空間に配置',
  '画像内のすべての色を含む最小のボックスを分割。',
    '囲んだ色を箱の長軸に沿って並べ替えます。',
    'ソートされたリストの中央値でボックスを2つの領域に分割します。',
    '元の色空間が２５６領域に分割されるまで上記の処理を繰り返す。',
  '代表的な色は、各ボックス内の色を平均化し、そのボックス内の各色に割り当てられた適切なカラーマップインデックスによって発見されます。'
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
    set: (val) => set(val),
  };
}
export const steps = createSteps();
