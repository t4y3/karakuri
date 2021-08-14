type Vec3 = [number, number, number] | Float32Array;

export const cross = (a: Vec3, b: Vec3): Vec3 => {
  // prettier-ignore
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0]
  ];
};

export const distance = (a: Vec3, b: Vec3): Vec3 => {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
};

export const length = (v: Vec3): number => {
  return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
};

export const normalize = (v: Vec3): Vec3 => {
  const l = length(v);
  if (l > 0) {
    return [v[0] / l, v[1] / l, v[2] / l];
  }
  return [0, 0, 0];
};
