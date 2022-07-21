import { BigNumber } from 'bignumber.js';
import { mat4, mat3, quat, vec2, vec3 } from 'gl-matrix';
import type { Point, Vector } from './types';
import { cross, normalize } from './vec3';
import { Height, DecimalPlacesPoint, DecimalPlacesPointLax } from './constants';

export const round = (n: number) => {
  return Math.round(n * 100000000000000) / 100000000000000;
};

export const round2 = (n: number) => {
  return Math.round(n * 1000000) / 1000000;
};

// 2Dベクトルの外積
export const cross2D = (x1, y1, x2, y2) => {
  return x1 * y2 - y1 * x2;
};

// 線分の衝突
export const ColSegments = (
  seg1: { s: { x: number; y: number }; v: { x: number; y: number } }, // 線分1
  seg2: { s: { x: number; y: number }; v: { x: number; y: number } }, // 線分2
): { x: number; y: number } | boolean => {
  // const v = seg2.s - seg1.s;
  const v = {
    x: seg2.s.x - seg1.s.x,
    y: seg2.s.y - seg1.s.y,
  };

  const Crs_v1_v2 = cross2D(seg1.v.x, seg1.v.y, seg2.v.x, seg2.v.y);

  if (Crs_v1_v2 === 0) {
    // 平行状態
    return false;
  }

  const Crs_v_v1 = cross2D(v.x, v.y, seg1.v.x, seg1.v.y);
  const Crs_v_v2 = cross2D(v.x, v.y, seg2.v.x, seg2.v.y);

  const t1 = Crs_v_v2 / Crs_v1_v2;
  const t2 = Crs_v_v1 / Crs_v1_v2;

  const eps = 0.00001;
  if (t1 + eps < 0 || t1 - eps > 1 || t2 + eps < 0 || t2 - eps > 1) {
    // 交差していない
    return false;
  }

  // TODO: aaaa
  const xx = BigNumber(seg1.s.x)
    .plus(seg1.v.x * t1)
    .decimalPlaces(8)
    .toNumber();
  const yy = BigNumber(seg1.s.y)
    .plus(seg1.v.y * t1)
    .decimalPlaces(8)
    .toNumber();
  // const xx = BigNumber(seg1.s.x).plus(seg1.v.x * t1).decimalPlaces(12).toNumber();
  // const yy = BigNumber(seg1.s.y).plus(seg1.v.y * t1).decimalPlaces(12).toNumber();

  // console.warn({
  //   xx,
  //   x: round(seg1.s.x + seg1.v.x * t1), //Math.round((seg1.s.x + seg1.v.x * t1) * 100000000000000) / 100000000000000,
  //   yy,
  //   y: round(seg1.s.y + seg1.v.y * t1), //Math.round((seg1.s.y + seg1.v.y * t1) * 100000000000000) / 100000000000000,
  // })

  return {
    // TODO: 丸めてみる
    x: xx,
    y: yy,
    // x: round(seg1.s.x + seg1.v.x * t1), //Math.round((seg1.s.x + seg1.v.x * t1) * 100000000000000) / 100000000000000,
    // y: round(seg1.s.y + seg1.v.y * t1), //Math.round((seg1.s.y + seg1.v.y * t1) * 100000000000000) / 100000000000000,
    // x: seg1.s.x + seg1.v.x * t1,
    // y: seg1.s.y + seg1.v.y * t1,
  };
};

export const isEdge = (vector: Vector, point: Point) => {
  if ((point.x === vector.x0 && point.y === vector.y0) || (point.x === vector.x1 && point.y === vector.y1)) {
    return true;
  }
  return false;
};

export const isEdgeLax = (vector: Vector, point: Point) => {
  if (
    equalPointLax(point, { x: vector.x0, y: vector.y0 }, 6) ||
    equalPointLax(point, { x: vector.x1, y: vector.y1 }, 6)
  ) {
    return true;
  }
  return false;
};

export const hasLine = (v: Vector, p: Point) => {
  // 線分の始点からPまでの線分
  const b = [p.x - v.x0, p.y - v.y0];
  // 線分
  const a = [v.x1 - v.x0, v.y1 - v.y0];

  const cr = cross2D(b[0], b[1], a[0], a[1]);

  if (0.0001 < Math.abs(cr)) {
    return false;
  }

  const dot = vec2.dot(a, b);

  const al = vec2.length(a);
  const bl = vec2.length(b);

  // a と b の長さを掛け合わせたものを ab
  const ab = al * bl;

  // // if (dot !== ab) {
  // // TODO: 丸めてみる
  // if (
  //   round2(dot) !== round2(ab)
  //   // Math.round(dot * 1000000) / 1000000 !==
  //   // Math.round(ab * 1000000) / 1000000
  // ) {
  //   return false;
  // }

  // bの長さが a の長さより短ければ当たっているといえる
  return bl <= al;
};

export const hasLineLax = (v: Vector, p: Point) => {
  // 線分の始点からPまでの線分
  const b = [p.x - v.x0, p.y - v.y0];
  // 線分
  const a = [v.x1 - v.x0, v.y1 - v.y0];

  const cr = cross2D(b[0], b[1], a[0], a[1]);

  if (0.0001 < Math.abs(cr)) {
    return false;
  }

  const al = vec2.length(a);
  const bl = vec2.length(b);

  // bの長さが a の長さより短ければ当たっているといえる
  return -0.1 < al - bl;
  return bl <= al;
};

export const equalPoint = (a: Point, b: Point) => {
  return a.x === b.x && a.y === b.y;
};

export const equalPointLax = (a: Point, b: Point, place = DecimalPlacesPointLax) => {
  const aX = new BigNumber(a.x).decimalPlaces(place).toNumber();
  const aY = new BigNumber(a.y).decimalPlaces(place).toNumber();
  const bX = new BigNumber(b.x).decimalPlaces(place).toNumber();
  const bY = new BigNumber(b.y).decimalPlaces(place).toNumber();
  return aX === bX && aY === bY;
};

export const equalVector = (a: Vector, b: Vector) => {
  return a.x0 === b.x0 && a.y0 === b.y0 && a.x1 === b.x1 && a.y1 === b.y1;
};

export const equalVectorLax = (a: Vector, b: Vector, place = DecimalPlacesPointLax) => {
  const aX0 = new BigNumber(a.x0).decimalPlaces(place).toNumber();
  const aY0 = new BigNumber(a.y0).decimalPlaces(place).toNumber();
  const aX1 = new BigNumber(a.x1).decimalPlaces(place).toNumber();
  const aY1 = new BigNumber(a.y1).decimalPlaces(place).toNumber();
  const bX0 = new BigNumber(b.x0).decimalPlaces(place).toNumber();
  const bY0 = new BigNumber(b.y0).decimalPlaces(place).toNumber();
  const bX1 = new BigNumber(b.x1).decimalPlaces(place).toNumber();
  const bY1 = new BigNumber(b.y1).decimalPlaces(place).toNumber();
  return aX0 === bX0 && aY0 === bY0 && aX1 === bX1 && aY1 === bY1;
};

export const reverseVector = (v: Vector) => {
  return {
    x0: v.x1,
    y0: v.y1,
    x1: v.x0,
    y1: v.y0,
  };
};

export const getStartPoint = (v: Vector) => {
  return {
    x: v.x0,
    y: v.y0,
  };
};

export const getEndPoint = (v: Vector) => {
  return {
    x: v.x1,
    y: v.y1,
  };
};

export const getIntersectionPointsFromLine = (lines): Point[] => {
  const points = [];
  for (let i = 0, length = lines.length; i < length; i++) {
    for (let j = 0, length = lines.length; j < length; j++) {
      if (j === i) {
        continue;
      }
      const { x0, y0, x1, y1 } = lines[i];
      const { x0: x2, y0: y2, x1: x3, y1: y3 } = lines[j];

      const point = ColSegments(
        { s: { x: x0, y: y0 }, v: { x: x1 - x0, y: y1 - y0 } },
        { s: { x: x2, y: y2 }, v: { x: x3 - x2, y: y3 - y2 } },
      );

      if (point) {
        points.push(point);
        continue;
      }
    }
  }
  return points;
};

export const findLineSegment = (vectors: Vector[], a: Vector, b: Vector) => {
  const results = [];
  const v0 = {
    x0: a.x0,
    y0: a.y0,
    x1: b.x0,
    y1: b.y0,
  };
  const v1 = {
    x0: a.x1,
    y0: a.y1,
    x1: b.x1,
    y1: b.y1,
  };
  const v2 = {
    x0: a.x1,
    y0: a.y1,
    x1: b.x0,
    y1: b.y0,
  };
  const v3 = {
    x0: a.x0,
    y0: a.y0,
    x1: b.x1,
    y1: b.y1,
  };
  vectors.forEach((vector) => {
    if (equalVector(vector, a) || equalVector(vector, b)) {
      return;
    }
    if (equalVector(vector, v0)) {
      results.push(vector);
    }
    if (equalVector(vector, v1)) {
      results.push(vector);
    }
    if (equalVector(vector, v2)) {
      results.push(vector);
    }
    if (equalVector(vector, v3)) {
      results.push(vector);
    }
  });
  return results;
};

export const toPoints = (vectors: Vector[]) => {
  const points: Point[] = [];
  vectors.forEach((vector) => {
    points.push({ x: vector.x0, y: vector.y0 });
    points.push({ x: vector.x1, y: vector.y1 });
  });

  return Array.from(new Map(points.map((point) => [`${point.x},${point.y}`, point])).values());
};

export const calcAngleDegrees = ({ x, y }: Point) => {
  return (Math.atan2(y, x) * 180) / Math.PI;
};

// @see https://gihyo.jp/dev/serial/01/geometry/0006?page=2
export const isConvexPolygon = (points: Point[]) => {
  // console.log({ points });
  const direction = [];
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    const c = points[(i + 2) % points.length];
    direction.push(isCCW([a, b, c]));
  }
  if (direction.some((dir) => Math.abs(dir) === 0)) {
    return false;
  }
  // console.log({direction})
  const formattedDirection = direction
    .filter((dir) => Math.abs(dir) !== 0) // TODO: 消す時注意
    .map((dir) => dir > 0);

  return formattedDirection.every((dir) => dir === formattedDirection[0]);
};

// 正: CCW, 負: CW
export const isCCW = (points: [Point, Point, Point]) => {
  const a = points[0];
  const b = points[1];
  const c = points[2];
  const cross = vec3.create();
  const aVector = vec3.create();
  const bVector = vec3.create();
  vec3.normalize(aVector, [b.x - a.x, b.y - a.y, 0]);
  vec3.normalize(bVector, [c.x - b.x, c.y - b.y, 0]);
  vec3.cross(cross, aVector, bVector);
  return cross[2];
};

export const getCenterOfTriangle = (points: [Point, Point, Point]): Point => {
  const totalX = points.map((p) => p.x).reduce((sum, currentValue) => sum + currentValue, 0);
  const totalY = points.map((p) => p.y).reduce((sum, currentValue) => sum + currentValue, 0);
  return {
    x: totalX / 3,
    y: totalY / 3,
  };
};

export const getCenterOfPolygon = (points: Point[]): Point => {
  let totalArea = 0;
  let totalX = 0;
  let totalY = 0;
  [...Array(points.length - 2)].forEach((_, i) => {
    const p0 = points[0];
    const p1 = points[i + 1];
    const p2 = points[i + 2];
    const { x, y } = getCenterOfTriangle([p0, p1, p2]);
    // TODO: 関数か
    const area = Math.abs((p0.x - p2.x) * (p1.y - p2.y) - (p1.x - p2.x) * (p0.y - p2.y)) / 2;

    totalX += x * area;
    totalY += y * area;
    totalArea += area;

    // 12|(x1−x3)(y2−y3)−(x2−x3)(y1−y3)|
    //     例えば、座標平面上の３点 (1,2),(3,4),(0,0) を頂点とする三角形の面積は、
    // 12|1×4−3×2|=12|4−6|=1
    //     となりま
  });

  return {
    x: totalX / totalArea,
    y: totalY / totalArea,
  };
};

/**
 * 各点の座標を反時計回りになるようにソート
 * @param points
 */
export const sortPoints = (points: Point[]) => {
  const center = getCenterOfPolygon(points);
  return points.sort((a, b) => {
    return (
      calcAngleDegrees({
        x: b.x - center.x,
        y: b.y - center.y,
      }) -
      calcAngleDegrees({
        x: a.x - center.x,
        y: a.y - center.y,
      })
    );
  });
};

export const makeSplitVectors = (points: Point[], vectors: Vector[]) => {
  // 線分上に交点があった場合は線分を分割する
  let splitVectors: Vector[] = vectors;
  points.forEach((point) => {
    const list = [...splitVectors];
    splitVectors.forEach((vector, i) => {
      const has = hasLine(vector, point);
      // const has = hasLineLax(vector, point);
      if (has) {
        // console.count('makeSplitVectors > has');
        // 12: 790
        // 8:  606

        // 交点が線分の末端だった場合
        if (isEdge(vector, point)) {
          return;
        }

        list.push({
          x0: vector.x0,
          y0: vector.y0,
          x1: point.x,
          y1: point.y,
        });
        list.push({
          x0: point.x,
          y0: point.y,
          x1: vector.x1,
          y1: vector.y1,
        });
      }
    });

    // 入れ直し
    splitVectors = list;
  });

  return splitVectors;
};

export const makeUniquePoints = (points: Point[]) => {
  const uniquePoints: Point[] = [];
  points.forEach((point) => {
    if (
      !uniquePoints.find((p) => {
        return equalPointLax(p, point, 2);
      })
    ) {
      uniquePoints.push(point);
    }
  });
  return uniquePoints;
};

export const makeUniqueVectors = (vectors: Vector[]) => {
  const uniqueSplitVectors = [];
  vectors.forEach((vector) => {
    if (
      !uniqueSplitVectors.find((v) => {
        return equalVector(v, vector);
      })
    ) {
      uniqueSplitVectors.push(vector);
    }
  });
  return uniqueSplitVectors;
};

export const isRightSide = (point: Point, vector: Vector) => {
  const __cross = cross(
    [vector.x1 - vector.x0, vector.y1 - vector.y0, 0],
    normalize([point.x - vector.x0, point.y - vector.y0, 0]),
  );

  // 右側
  if (__cross[2] < 0) {
    return true;
  }
  return false;
};

export const isLeftSide = (point: Point, vector: Vector) => {
  const __cross = cross(
    [vector.x1 - vector.x0, vector.y1 - vector.y0, 0],
    normalize([point.x - vector.x0, point.y - vector.y0, 0]),
  );

  // 左側
  if (__cross[2] > 0) {
    return true;
  }
  return false;
};

/**
 * 交点を求める
 * @see http://atelier-peppe.jp/programTips/GEOMETRIC/KIKA_8.html
 * @param vector
 */
export const getIntersectionPoint = (vector: Vector, point: Point) => {
  const foldLineVecX = vector.x1 - vector.x0;
  const foldLineVecY = vector.y1 - vector.y0;

  let intersectionPointX = 0;
  let intersectionPointY = 0;

  // 線分が垂直の場合
  if (foldLineVecX === 0) {
    intersectionPointX = vector.x0;
    intersectionPointY = point.y;
  }
  // 線分が水平の場合
  else if (foldLineVecY === 0) {
    intersectionPointX = point.x;
    intersectionPointY = vector.y0;
  } else {
    // そ
    // 垂線の足を求める
    // 線分の傾き ey - sy / ex - sx
    const m1 = foldLineVecY / foldLineVecX;
    // 線分のY切片
    // const b1 = line.sp.y - (m1 * line.sp.x);
    const b1 = vector.y0 - m1 * vector.x0;

    // 点ptを通り、線分lineに垂直な線の傾き
    const m2 = -1.0 / m1;
    // 点ptを通り、線分lineに垂直な線のY切片
    const b2 = point.y - m2 * point.x;

    // 交点算出
    intersectionPointX = (b2 - b1) / (m1 - m2);
    intersectionPointY = (b2 * m1 - b1 * m2) / (m1 - m2);
  }

  return {
    x: intersectionPointX,
    y: intersectionPointY,
  };
};

export const getRightPoint = (points: Point[], vector: Vector, right: Boolean = true): Point[] => {
  const results = [];
  points.forEach((point) => {
    if (right && isRightSide(point, vector)) {
      results.push(point);
    }
    if (!right && isLeftSide(point, vector)) {
      results.push(point);
    }
  });
  return results;
};
