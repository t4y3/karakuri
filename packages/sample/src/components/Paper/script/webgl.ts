import { BigNumber } from 'bignumber.js';
import { Height, Width, DecimalPlacesPoint } from './constants';
import type { Point, Vector } from './types';
import { equalPoint, equalPointLax, getIntersectionPoint } from './math';
import { mat3, quat, vec3 } from 'gl-matrix';
import { cross, normalize } from 'shared/lib/src/vec3';

export const getDrawArraysPositions = (polygons: Array<Point[]>) => {
  const position = [];
  const st = [];
  polygons.forEach((points) => {
    points.forEach((point) => {
      position.push(point.x / 10, 0, point.y / 10);

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
  });
  return {
    position,
    st,
  };
};

export const getDrawElementsPositions = (points: Point[]) => {
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
  origin: Float32Array;
  // 折線から動かす点までのvector
  vectors: Float32Array;
  start: Float32Array;
  end: Float32Array;
  intersections: Float32Array;
  afterPosition: Float32Array;
} => {
  const foldLineVecX = foldLineVec.x1 - foldLineVec.x0;
  const foldLineVecY = foldLineVec.y1 - foldLineVec.y0;

  // ２つのベクトルの回転軸
  const __axis = normalize(vec3.fromValues(foldLineVecX, 0.0, foldLineVecY));

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
  const __intersections: number[] = [];
  const __afterPosition: number[] = [];

  const setDefaultOptions = (x, y, z) => {
    __origin.push(...[position[x], position[y], position[z]]);
    __start.push(...baseStart);
    __end.push(...baseEnd);
    __vectors.push(0.0, 0.0, 0.0);
    __afterPosition.push(...[position[x], position[y], position[z]]);
  };

  const setMovedVertexOptions = (x, y, z, intersectionPoint: Point) => {
    __origin.push(...[intersectionPoint.x, 0, intersectionPoint.y]);
    __start.push(...start);
    __end.push(...end);
    __vectors.push(position[x] - intersectionPoint.x, 0.0, position[z] - intersectionPoint.y);
    __afterPosition.push(intersectionPoint.x + end[x], 0, intersectionPoint.y + end[y]);
  };

  [...Array(position.length / 3)].forEach((_, i) => {
    const x = i * 3;
    const y = i * 3 + 1;
    const z = i * 3 + 2;

    const __cross = cross(
      [foldLineVecX, 0, foldLineVecY],
      normalize([position[x] - foldLineVec.x0, position[y], position[z] - foldLineVec.y0]),
    );

    // 交点を求める
    const intersectionPoint = getIntersectionPoint(foldLineVec, {
      x: position[x],
      y: position[z],
    });
    __intersections.push(intersectionPoint.x, 0, intersectionPoint.y);

    if (__cross[1] === 0) {
      // 今の頂点が線分上にある場合、隣接している頂点を調べて折り返す際に動く三角形なのかによって処理を変える
      const [ap1X, ap1Y, ap1Z, ap2X, ap2Y, ap2Z] = getAdjacentVertexIndex(position, i);

      const __cross = cross(
        [foldLineVecX, 0, foldLineVecY],
        normalize([position[ap1X] - foldLineVec.x0, position[ap1Y], position[ap1Z] - foldLineVec.y0]),
      );
      const __cross2 = cross(
        [foldLineVecX, 0, foldLineVecY],
        normalize([position[ap2X] - foldLineVec.x0, position[ap2Y], position[ap2Z] - foldLineVec.y0]),
      );
      // 線分上にあっても法線の関係でどちらかが右側にあれば動かす頂点として処理する
      if (__cross[1] < 0 || __cross2[1] < 0) {
        setMovedVertexOptions(x, y, z, intersectionPoint);
      } else {
        setDefaultOptions(x, y, z);
      }
    }
    // 右側
    if (__cross[1] < 0) {
      setMovedVertexOptions(x, y, z, intersectionPoint);
    }
    // 左側
    if (__cross[1] > 0) {
      setDefaultOptions(x, y, z);
    }
  });

  return {
    origin: new Float32Array(__origin),
    vectors: new Float32Array(__vectors),
    start: new Float32Array(__start),
    end: new Float32Array(__end),
    intersections: new Float32Array(__intersections),
    afterPosition: new Float32Array(__afterPosition),
  };
};

export const getAdjacentVertexIndex = (
  position: Float32Array,
  i: number,
): [number, number, number, number, number, number] => {
  let adjacentPointIndex1 = 0;
  let adjacentPointIndex2 = 0;
  if (i === 0) {
    adjacentPointIndex1 = 1;
    adjacentPointIndex2 = 2;
  }
  if (i !== 0 && i !== position.length / 3 && i % 3 === 0) {
    adjacentPointIndex1 = i + 1;
    adjacentPointIndex2 = i + 2;
  }
  if (i % 3 === 1) {
    adjacentPointIndex1 = i - 1;
    adjacentPointIndex2 = i + 1;
  }
  if (i % 3 === 2 || i === position.length / 3) {
    adjacentPointIndex1 = i - 1;
    adjacentPointIndex2 = i - 2;
  }

  return [
    adjacentPointIndex1 * 3,
    adjacentPointIndex1 * 3 + 1,
    adjacentPointIndex1 * 3 + 2,
    adjacentPointIndex2 * 3,
    adjacentPointIndex2 * 3 + 1,
    adjacentPointIndex2 * 3 + 2,
  ];
};

export const getPolygonColors = (position: Float32Array): Float32Array => {
  const color: number[] = [];
  const colors = [
    [227, 242, 253],
    [187, 222, 251],
    [232, 234, 246],
    [197, 202, 233],
    [237, 231, 246],
    [209, 196, 233],
    [225, 245, 254],
    [179, 229, 252],
  ];
  const length = position.length / 3;
  [...Array(length)].forEach((_, i) => {
    color.push(
      colors[i % colors.length][0] / 255,
      colors[i % colors.length][1] / 255,
      colors[i % colors.length][2] / 255,
      1.0,
      colors[i % colors.length][0] / 255,
      colors[i % colors.length][1] / 255,
      colors[i % colors.length][2] / 255,
      1.0,
      colors[i % colors.length][0] / 255,
      colors[i % colors.length][1] / 255,
      colors[i % colors.length][2] / 255,
      1.0,
    );
  });
  return new Float32Array(color);
};
