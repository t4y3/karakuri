import { BigNumber } from 'bignumber.js';
import { Height, Width, DecimalPlacesPoint } from './constants';
import type { Point, Vector } from './types';
import { equalPoint, equalPointLax } from './math';
import { quat, vec3 } from 'gl-matrix';
import { cross, normalize } from 'shared/lib/src/vec3';

export const getPositions = (points: Point[]) => {
  const position = [];
  points.forEach((point) => {
    position.push(point.x / 10, 0, point.y / 10);
  });
  return position;
};

export const getSt = (points: Point[]) => {
  const st = [];
  points.forEach((point) => {
    let x = 0;
    let y = 0;
    if (point.x !== 0) {
      x = point.x / Width;
    }
    if (point.y !== 0) {
      y = point.y / Height;
    }
    st.push(x, y);
  });
  return st;
};

export const getIndices = (points: Point[], polygons: Array<Point[]>) => {
  const indices = [];

  polygons.forEach((triangle) => {
    triangle.forEach((tPoint) => {
      const index = points.findIndex((point) => {
        return equalPointLax(point, tPoint, 6);
      });
      if (index === -1) {
        console.warn(tPoint);
      }
      indices.push(index);
    });
  });
  return indices;
};

export const getVertexOption = (
  position,
  foldLineVec: Vector,
): {
  origin: number[];
  // 折線から動かす点までのvector
  vectors: number[];
  start: number[];
  end: number[];
} => {
  const foldLineVecX = foldLineVec.x1 - foldLineVec.x0;
  const foldLineVecY = foldLineVec.y1 - foldLineVec.y0;

  // // 折線のベクトル
  // const startVec = vec3.fromValues(7.5, 0.0, 7.5);
  // const endVec = vec3.fromValues(0.5, 7.5, 0.0);
  // const __axis = normalize(cross(startVec, endVec));

  // ２つのベクトルの回転軸
  // const __axis = normalize(cross(startVec, endVec));
  const __axis = normalize(vec3.fromValues(foldLineVecX, 0.0, foldLineVecY));
  // const __axis = normalize(vec3.fromValues(0.0, 0.0, 1.0));

  // 動かす点用
  const start = quat.create();
  const end = quat.create();
  quat.setAxisAngle(start, __axis, 0);
  quat.setAxisAngle(end, __axis, 180 * (Math.PI / 180));
  quat.normalize(start, start);
  quat.normalize(end, end);

  // 移動しない点用
  const baseStart = quat.create();
  const baseEnd = quat.create();
  quat.identity(baseStart);
  quat.identity(baseEnd);

  const __origin = [];
  const __vectors = [];
  const __start: number[] = [];
  const __end: number[] = [];

  [...Array(position.length / 3)].forEach((_, i) => {
    const x = i * 3;
    const y = i * 3 + 1;
    const z = i * 3 + 2;

    const yyyy = cross(
      [foldLineVecX, 0, foldLineVecY],
      normalize([position[x] - foldLineVec.x0, position[y], position[z] - foldLineVec.y0]),
    );

    // @see http://atelier-peppe.jp/programTips/GEOMETRIC/KIKA_8.html
    // 線分が垂直の場合
    // TODO: ここは関数か
    let xx = 0;
    let yy = 0;
    if (foldLineVecX === 0) {
      xx = foldLineVec.x0;
      yy = position[z];
    }
    // 線分が水平の場合
    else if (foldLineVecY === 0) {
      xx = position[x];
      yy = foldLineVec.y0;
    } else {
      // そ
      // 垂線の足を求める
      // 線分の傾き ey - sy / ex - sx
      const m1 = foldLineVecY / foldLineVecX;
      // 線分のY切片
      // const b1 = line.sp.y - (m1 * line.sp.x);
      const b1 = foldLineVec.y0 - m1 * foldLineVec.x0;

      // 点ptを通り、線分lineに垂直な線の傾き
      const m2 = -1.0 / m1;
      // 点ptを通り、線分lineに垂直な線のY切片
      const b2 = position[z] - m2 * position[x];

      // 交点算出
      xx = (b2 - b1) / (m1 - m2);
      yy = (b2 * m1 - b1 * m2) / (m1 - m2);
    }

    // 垂線の足を求める ここまで

    if (yyyy[1] === 0) {
      __origin.push(...[position[x], position[y], position[z]]);
      __start.push(...baseStart);
      __end.push(...baseEnd);
      // __start.push(...start);
      // __end.push(...end);
      __vectors.push(0.0, 0.0, 0.0);
      // __origin.push(...[xx, 0, yy]);
      // __start.push(...start);
      // __end.push(...end);
      // // __vectors.push(x - xx, 0.0, z - yy);
      // __vectors.push(position[x] - xx, 0.0, position[z] - yy);
    }
    if (yyyy[1] < 0) {
      __origin.push(...[xx, 0, yy]);
      __start.push(...start);
      __end.push(...end);
      // __vectors.push(x - xx, 0.0, z - yy);
      __vectors.push(position[x] - xx, 0.0, position[z] - yy);
    }
    if (yyyy[1] > 0) {
      __origin.push(...[position[x], position[y], position[z]]);
      __start.push(...baseStart);
      __end.push(...baseEnd);
      // __start.push(...start);
      // __end.push(...end);
      __vectors.push(0.0, 0.0, 0.0);
      // __origin.push(...[xx, 0, yy]);
      // __start.push(...start);
      // __end.push(...end);
      // // __vectors.push(x - xx, 0.0, z - yy);
      // __vectors.push(position[x] - xx, 0.0, position[z] - yy);
    }
  });

  return {
    origin: __origin,
    vectors: __vectors,
    start: __start,
    end: __end,
  };
};
