type Color = [number, number, number, number];

export type Geometry = {
  position: Float32Array;
  color: Float32Array;
  index?: number[];
  normal?: Float32Array;
};

/**
 * @example
 * // Render using drawArrays with mode gl.LINES.
 * this.gl.drawArrays(this.gl.LINES, 0, this.axis.position.length / 3);
 */
export const axis = (size: number, color?: Color): Geometry => {
  // prettier-ignore
  const position = new Float32Array([
    // X
    size * -1, 0.0, 0.0,
    size, 0.0, 0.0,
    // Y
    0.0, size * -1, 0.0,
    0.0, size, 0.0,
    // Z
    0.0, 0.0, size,
    0.0, 0.0, size * -1,
  ]);

  // prettier-ignore
  const defaultColor = [
    // x: red
    1.0, 0.0, 0.0, 1.0,
    1.0, 0.0, 0.0, 1.0,
    // y: green
    0.0, 1.0, 0.0, 1.0,
    0.0, 1.0, 0.0, 1.0,
    // z: blue
    0.0, 0.0, 1.0, 1.0,
    0.0, 0.0, 1.0, 1.0,
  ]

  // prettier-ignore
  const col = color ? [
    ...color,
    ...color,
    ...color,
    ...color,
    ...color,
    ...color,
  ] : defaultColor;

  return { position, color: new Float32Array(col) };
};

export const plane = (width: number, height: number, color: Color): Geometry => {
  const w = width / 2;
  const h = height / 2;
  // prettier-ignore
  const position = new Float32Array([
    -w,  h,  0.0,
     w,  h,  0.0,
    -w, -h,  0.0,
     w, -h,  0.0
  ]);
  // prettier-ignore
  const nor = new Float32Array([
    0.0, 0.0, 1.0,
    0.0, 0.0, 1.0,
    0.0, 0.0, 1.0,
    0.0, 0.0, 1.0
  ]);
  // prettier-ignore
  const col = new Float32Array([
    color[0], color[1], color[2], color[3],
    color[0], color[1], color[2], color[3],
    color[0], color[1], color[2], color[3],
    color[0], color[1], color[2], color[3]
  ]);
  // prettier-ignore
  // let st  = [
  //   0.0, 0.0,
  //   1.0, 0.0,
  //   0.0, 1.0,
  //   1.0, 1.0
  // ];
  // prettier-ignore
  const idx = [
    0, 2, 1,
    1, 2, 3
  ];
  return { position, normal: nor, color: col, index: idx };
};

/**
 * @example
 * // Render using drawElements with mode gl.TRIANGLES.
 * this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.floor.IBO);
 * this.gl.drawElements(this.gl.TRIANGLES, this.floor.geometry.index.length, this.gl.UNSIGNED_SHORT, 0);
 */
export const floor = (width: number, depth: number, color: Color): Geometry => {
  const w = width / 2;
  const d = depth / 2;
  // prettier-ignore
  const position = new Float32Array([
    -w, 0.0,  d,
     w, 0.0,  d,
    -w, 0.0, -d,
     w, 0.0, -d
  ]);
  // prettier-ignore
  const normal = new Float32Array([
    0.0, 1.0, 0.0,
    0.0, 1.0, 0.0,
    0.0, 1.0, 0.0,
    0.0, 1.0, 0.0
  ]);
  // prettier-ignore
  let col = new Float32Array([
    color[0], color[1], color[2], color[3],
    color[0], color[1], color[2], color[3],
    color[0], color[1], color[2], color[3],
    color[0], color[1], color[2], color[3]
  ]);
  // prettier-ignore
  // let st  = [
  //   0.0, 0.0,
  //   1.0, 0.0,
  //   0.0, 1.0,
  //   1.0, 1.0
  // ];
  // prettier-ignore
  let idx = [
    0, 1, 2,
    2, 1, 3
  ];
  return { position, normal, color: col, index: idx };
};

// TODO: 変更
export const cube = (side: number, color: Color): Geometry => {
  const hs = side * 0.5;
  // prettier-ignore
  const position = new Float32Array([
    -hs, -hs,  hs, // 左下前
     hs, -hs,  hs, // 右下前
     hs,  hs,  hs, // 右上前
    -hs,  hs,  hs, // 左上前
    -hs, -hs, -hs,　// 左下奥
    -hs,  hs, -hs,　// 左上奥
     hs,  hs, -hs,　// 右上奥
     hs, -hs, -hs,　// 右下奥
    -hs,  hs, -hs,　// 左上奥
    -hs,  hs,  hs,　// 左上前
     hs,  hs,  hs,　// 右上前
     hs,  hs, -hs,　// 右上奥
    -hs, -hs, -hs,　// 左下奥
     hs, -hs, -hs,　// 右下奥
     hs, -hs,  hs,　// 右下前
    -hs, -hs,  hs,　// 左下前
     hs, -hs, -hs,　// 右下奥
     hs,  hs, -hs,　// 右上奥
     hs,  hs,  hs,　// 右上前
     hs, -hs,  hs,　// 右下前
    -hs, -hs, -hs,　// 左下奥
    -hs, -hs,  hs,　// 左下前
    -hs,  hs,  hs,　// 左上前
    -hs,  hs, -hs　// 左上奥
  ]);
  let v = 1.0 / Math.sqrt(3.0);
  // prettier-ignore
  const normal = new Float32Array([
    -v, -v,  v,  v, -v,  v,  v,  v,  v, -v,  v,  v,
    -v, -v, -v, -v,  v, -v,  v,  v, -v,  v, -v, -v,
    -v,  v, -v, -v,  v,  v,  v,  v,  v,  v,  v, -v,
    -v, -v, -v,  v, -v, -v,  v, -v,  v, -v, -v,  v,
    v, -v, -v,  v,  v, -v,  v,  v,  v,  v, -v,  v,
    -v, -v, -v, -v, -v,  v, -v,  v,  v, -v,  v, -v
  ]);
  const col = [];
  for (let i = 0; i < position.length / 3; i++) {
    col.push(color[0], color[1], color[2], color[3]);
  }
  // prettier-ignore
  // let st = [
  //   0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
  //   0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
  //   0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
  //   0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
  //   0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
  //   0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0
  // ];
  // prettier-ignore
  let index = [
    0,  1,  2,  0,  2,  3,
    4,  5,  6,  4,  6,  7,
    8,  9, 10,  8, 10, 11,
    12, 13, 14, 12, 14, 15,
    16, 17, 18, 16, 18, 19,
    20, 21, 22, 20, 22, 23
  ];
  return { position, normal, color: new Float32Array(col), index };
};

export const cubeWireframe = (width, height, depth, color: Color): Geometry => {
  let hw = width * 0.5;
  let hh = height * 0.5;
  let hd = depth * 0.5;
  // prettier-ignore
  let position = new Float32Array([
    // 前面
    -hw, -hh,  hd, // 左下前
    hw, -hh,  hd, // 右下前
    hw, -hh,  hd, // 右下前
    hw,  hh,  hd, // 右上前
    hw,  hh,  hd, // 右上前
    -hw,  hh,  hd, // 左上前
    -hw,  hh,  hd, // 左上前
    -hw, -hh,  hd, // 左下前
    // 奥面
    -hw, -hh, -hd, // 左下奥
    -hw,  hh, -hd, // 左上奥
    -hw,  hh, -hd, // 左上奥
    hw,  hh, -hd, // 右上奥
    hw,  hh, -hd, // 右上奥
    hw, -hh, -hd, // 右下奥
    hw, -hh, -hd, // 右下奥
    -hw, -hh, -hd, // 左下奥
    // 天井
    -hw,  hh, -hd, // 左上奥
    -hw,  hh,  hd, // 左上前
    -hw,  hh,  hd, // 左上前
    hw,  hh,  hd, // 右上前
    hw,  hh,  hd, // 右上前
    hw,  hh, -hd, // 右上奥
    hw,  hh, -hd, // 右上奥
    -hw,  hh, -hd, // 左上奥
    // 下面
    -hw, -hh, -hd, // 左下奥
    hw, -hh, -hd, // 右下奥
    hw, -hh, -hd, // 右下奥
    hw, -hh,  hd, // 右下前
    hw, -hh,  hd, // 右下前
    -hw, -hh,  hd, // 左下前
    -hw, -hh,  hd, // 左下前
    -hw, -hh, -hd, // 左下奥
    // 右面
    hw, -hh, -hd, // 右下奥
    hw,  hh, -hd, // 右上奥
    hw,  hh, -hd, // 右上奥
    hw,  hh,  hd, // 右上前
    hw,  hh,  hd, // 右上前
    hw, -hh,  hd, // 右下前
    hw, -hh,  hd, // 右下前
    hw, -hh, -hd, // 右下奥
    // 左面
    -hw, -hh, -hd, // 左下奥
    -hw, -hh,  hd, // 左下前
    -hw, -hh,  hd, // 左下前
    -hw,  hh,  hd, // 左上前
    -hw,  hh,  hd, // 左上前
    -hw,  hh, -hd // 左上奥
    // -hw,  hh, -hd // 左上奥
    // -hw, -hh, -hd, // 左下奥
  ]);

  const col = [];
  for (let i = 0; i < position.length / 3; i++) {
    col.push(color[0], color[1], color[2], color[3]);
  }
  return { position, color: new Float32Array(col) };
};

export const box = (width, height, depth, color): Geometry => {
  let hw = width * 0.5;
  let hh = height * 0.5;
  let hd = depth * 0.5;
  // prettier-ignore
  const position = new Float32Array([
    -hw, -hh,  hd, // 左下前
    hw, -hh,  hd, // 右下前
    hw,  hh,  hd, // 右上前
    -hw,  hh,  hd, // 左上前
    -hw, -hh, -hd, // 左下奥
    -hw,  hh, -hd, // 左上奥
    hw,  hh, -hd, // 右上奥
    hw, -hh, -hd, // 右下奥
    -hw,  hh, -hd, // 左上奥
    -hw,  hh,  hd, // 左上前
    hw,  hh,  hd, // 右上前
    hw,  hh, -hd, // 右上奥
    -hw, -hh, -hd, // 左下奥
    hw, -hh, -hd, // 右下奥
    hw, -hh,  hd, // 右下前
    -hw, -hh,  hd, // 左下前
    hw, -hh, -hd, // 右下奥
    hw,  hh, -hd, // 右上奥
    hw,  hh,  hd, // 右上前
    hw, -hh,  hd, // 右下前
    -hw, -hh, -hd, // 左下奥
    -hw, -hh,  hd, // 左下前
    -hw,  hh,  hd, // 左上前
    -hw,  hh, -hd // 左上奥
  ]);
  let v = 1.0 / Math.sqrt(3.0);
  // prettier-ignore
  const normal = new Float32Array([
    -v, -v,  v,  v, -v,  v,  v,  v,  v, -v,  v,  v,
    -v, -v, -v, -v,  v, -v,  v,  v, -v,  v, -v, -v,
    -v,  v, -v, -v,  v,  v,  v,  v,  v,  v,  v, -v,
    -v, -v, -v,  v, -v, -v,  v, -v,  v, -v, -v,  v,
    v, -v, -v,  v,  v, -v,  v,  v,  v,  v, -v,  v,
    -v, -v, -v, -v, -v,  v, -v,  v,  v, -v,  v, -v
  ]);
  const col = [];
  for (let i = 0; i < position.length / 3; i++) {
    col.push(color[0], color[1], color[2], color[3]);
  }
  // prettier-ignore
  // let st = [
  //   0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
  //   0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
  //   0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
  //   0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
  //   0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
  //   0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0
  // ];
  // prettier-ignore
  const index = [
    0,  1,  2,  0,  2,  3,
    4,  5,  6,  4,  6,  7,
    8,  9, 10,  8, 10, 11,
    12, 13, 14, 12, 14, 15,
    16, 17, 18, 16, 18, 19,
    20, 21, 22, 20, 22, 23
  ];
  return { position, normal, color: new Float32Array(col), index };
};

// TODO: 命名変更
export const boxLine = (width, height, depth, color): Geometry => {
  let hw = width * 0.5;
  let hh = height * 0.5;
  let hd = depth * 0.5;
  // prettier-ignore
  const position = new Float32Array([
    // 前面
    -hw, -hh,  hd, // 左下前
    hw, -hh,  hd, // 右下前
    hw, -hh,  hd, // 右下前
    hw,  hh,  hd, // 右上前
    hw,  hh,  hd, // 右上前
    -hw,  hh,  hd, // 左上前
    -hw,  hh,  hd, // 左上前
    -hw, -hh,  hd, // 左下前
    // 奥面
    -hw, -hh, -hd, // 左下奥
    -hw,  hh, -hd, // 左上奥
    -hw,  hh, -hd, // 左上奥
    hw,  hh, -hd, // 右上奥
    hw,  hh, -hd, // 右上奥
    hw, -hh, -hd, // 右下奥
    hw, -hh, -hd, // 右下奥
    -hw, -hh, -hd, // 左下奥
    // 天井
    -hw,  hh, -hd, // 左上奥
    -hw,  hh,  hd, // 左上前
    -hw,  hh,  hd, // 左上前
    hw,  hh,  hd, // 右上前
    hw,  hh,  hd, // 右上前
    hw,  hh, -hd, // 右上奥
    hw,  hh, -hd, // 右上奥
    -hw,  hh, -hd, // 左上奥
    // 下面
    -hw, -hh, -hd, // 左下奥
    hw, -hh, -hd, // 右下奥
    hw, -hh, -hd, // 右下奥
    hw, -hh,  hd, // 右下前
    hw, -hh,  hd, // 右下前
    -hw, -hh,  hd, // 左下前
    -hw, -hh,  hd, // 左下前
    -hw, -hh, -hd, // 左下奥
    // 右面
    hw, -hh, -hd, // 右下奥
    hw,  hh, -hd, // 右上奥
    hw,  hh, -hd, // 右上奥
    hw,  hh,  hd, // 右上前
    hw,  hh,  hd, // 右上前
    hw, -hh,  hd, // 右下前
    hw, -hh,  hd, // 右下前
    hw, -hh, -hd, // 右下奥
    // 左面
    -hw, -hh, -hd, // 左下奥
    -hw, -hh,  hd, // 左下前
    -hw, -hh,  hd, // 左下前
    -hw,  hh,  hd, // 左上前
    -hw,  hh,  hd, // 左上前
    -hw,  hh, -hd // 左上奥
    // -hw,  hh, -hd // 左上奥
    // -hw, -hh, -hd, // 左下奥
  ]);

  const col = [];
  for (let i = 0; i < position.length / 3; i++) {
    col.push(color[0], color[1], color[2], color[3]);
  }
  return { position, color: new Float32Array(col) };
};
