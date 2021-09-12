type Color = [number, number, number, number];

export type Geometry = {
  position: number[];
  color: number[];
  index?: number[];
  normal?: number[];
};

export const axis = (size: number, color?: Color): Geometry => {
  // prettier-ignore
  const pos = [
    // X
    size * -1, 0.0, 0.0,
    size, 0.0, 0.0,
    // Y
    0.0, size * -1, 0.0,
    0.0, size, 0.0,
    // Z
    0.0, 0.0, size,
    0.0, 0.0, size * -1,
  ];

  // prettier-ignore
  const col = color ? [
    ...color,
    ...color,
    ...color,
    ...color,
    ...color,
    ...color,
  ] : [
    1.0, 0.0, 0.0, 1.0,
    1.0, 0.0, 0.0, 1.0,
    0.0, 1.0, 0.0, 1.0,
    0.0, 1.0, 0.0, 1.0,
    0.0, 0.0, 1.0, 1.0,
    0.0, 0.0, 1.0, 1.0,
  ]

  return { position: pos, color: col };
};

export const plane = (width: number, height: number, color?: Color) => {
  const w = width / 2;
  const h = height / 2;
  // prettier-ignore
  let pos = [
    -w,  h,  0.0,
    w,  h,  0.0,
    -w, -h,  0.0,
    w, -h,  0.0
  ];
  // prettier-ignore
  let nor = [
    0.0, 0.0, 1.0,
    0.0, 0.0, 1.0,
    0.0, 0.0, 1.0,
    0.0, 0.0, 1.0
  ];
  // prettier-ignore
  let col = [
    color[0], color[1], color[2], color[3],
    color[0], color[1], color[2], color[3],
    color[0], color[1], color[2], color[3],
    color[0], color[1], color[2], color[3]
  ];
  // prettier-ignore
  let st  = [
    0.0, 0.0,
    1.0, 0.0,
    0.0, 1.0,
    1.0, 1.0
  ];
  // prettier-ignore
  let idx = [
    0, 2, 1,
    1, 2, 3
  ];
  return { position: pos, normal: nor, color: col, texCoord: st, index: idx };
};

// TODO: 変更
export const cube = (side: number, color: Color) => {
  const hs = side * 0.5;
  // prettier-ignore
  const position = [
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
  ];
  let v = 1.0 / Math.sqrt(3.0);
  // prettier-ignore
  const normal = [
    -v, -v,  v,  v, -v,  v,  v,  v,  v, -v,  v,  v,
    -v, -v, -v, -v,  v, -v,  v,  v, -v,  v, -v, -v,
    -v,  v, -v, -v,  v,  v,  v,  v,  v,  v,  v, -v,
    -v, -v, -v,  v, -v, -v,  v, -v,  v, -v, -v,  v,
    v, -v, -v,  v,  v, -v,  v,  v,  v,  v, -v,  v,
    -v, -v, -v, -v, -v,  v, -v,  v,  v, -v,  v, -v
  ];
  let col = [];
  for (let i = 0; i < position.length / 3; i++) {
    col.push(color[0], color[1], color[2], color[3]);
  }
  // prettier-ignore
  let st = [
    0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
    0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
    0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
    0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
    0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
    0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0
  ];
  // prettier-ignore
  let idx = [
    0,  1,  2,  0,  2,  3,
    4,  5,  6,  4,  6,  7,
    8,  9, 10,  8, 10, 11,
    12, 13, 14, 12, 14, 15,
    16, 17, 18, 16, 18, 19,
    20, 21, 22, 20, 22, 23
  ];
  return { position, normal, color: col, texCoord: st, index: idx };
};

export const cubeWireframe = (width, height, depth, color: Color): Geometry => {
  let hw = width * 0.5;
  let hh = height * 0.5;
  let hd = depth * 0.5;
  // prettier-ignore
  let pos = [
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
  ];

  let col = [];
  for (let i = 0; i < pos.length / 3; i++) {
    col.push(color[0], color[1], color[2], color[3]);
  }
  return { position: pos, color: col };
};

export const box = (width, height, depth, color) => {
  let hw = width * 0.5;
  let hh = height * 0.5;
  let hd = depth * 0.5;
  // prettier-ignore
  let pos = [
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
  ];
  let v = 1.0 / Math.sqrt(3.0);
  // prettier-ignore
  let nor = [
    -v, -v,  v,  v, -v,  v,  v,  v,  v, -v,  v,  v,
    -v, -v, -v, -v,  v, -v,  v,  v, -v,  v, -v, -v,
    -v,  v, -v, -v,  v,  v,  v,  v,  v,  v,  v, -v,
    -v, -v, -v,  v, -v, -v,  v, -v,  v, -v, -v,  v,
    v, -v, -v,  v,  v, -v,  v,  v,  v,  v, -v,  v,
    -v, -v, -v, -v, -v,  v, -v,  v,  v, -v,  v, -v
  ];
  let col = [];
  for (let i = 0; i < pos.length / 3; i++) {
    col.push(color[0], color[1], color[2], color[3]);
  }
  // prettier-ignore
  let st = [
    0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
    0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
    0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
    0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
    0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
    0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0
  ];
  // prettier-ignore
  let idx = [
    0,  1,  2,  0,  2,  3,
    4,  5,  6,  4,  6,  7,
    8,  9, 10,  8, 10, 11,
    12, 13, 14, 12, 14, 15,
    16, 17, 18, 16, 18, 19,
    20, 21, 22, 20, 22, 23
  ];
  return { position: pos, normal: nor, color: col, texCoord: st, index: idx };
};

// TODO: 命名変更
export const boxLine = (width, height, depth, color) => {
  let hw = width * 0.5;
  let hh = height * 0.5;
  let hd = depth * 0.5;
  // prettier-ignore
  let pos = [
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
  ];
  let v = 1.0 / Math.sqrt(3.0);

  let col = [];
  for (let i = 0; i < pos.length / 3; i++) {
    col.push(color[0], color[1], color[2], color[3]);
  }
  return { position: pos, color: col };
};
