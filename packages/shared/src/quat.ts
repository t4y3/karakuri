type Quaternion = [number, number, number, number];

export const create = (): Quaternion => {
  return [0, 0, 0, 1];
};

export const identity = (out: Quaternion) => {
  out[0] = 0;
  out[1] = 0;
  out[2] = 0;
  out[3] = 1;
  return out;
};
