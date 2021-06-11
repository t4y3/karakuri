type Color = [number, number, number, number];

type Axis = {
  position: number[];
  color: number[];
};

export const axis = (size: number, color: Color): Axis => {
  // prettier-ignore
  const pos = [
    size * -1, 0.0, 0.0,
    size, 0.0, 0.0,
    0.0, size * -1, 0.0,
    0.0, size, 0.0,
    0.0, 0.0, size,
    0.0, 0.0, size * -1,
  ];
  // prettier-ignore
  const col = [
    ...color,
    ...color,
    ...color,
    ...color,
    ...color,
    ...color,
  ];

  return { position: pos, color: col };
};
