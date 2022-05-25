import { BigNumber } from 'bignumber.js';
import {
  hasLine,
  equalPoint,
  getIntersectionPoints,
  sortPoints,
  reverseVector,
  getEndPoint,
  getStartPoint,
  calcAngleDegrees,
  isEdge,
  isConvexPolygon,
  makeSplitVectors,
  makeUniquePoints,
  makeUniqueVectors,
  isCCW,
  isEdgeLax,
  hasLineLax,
  equalPointLax,
  getRightPoint,
} from './math';
import type { Point, Vector, SegmentKey } from './types';
import {
  getPointsFromLine,
  drawLines,
  drawPoints as drawPointsSvg,
  drawPolygons,
  drawTriangle,
  fillPoints,
  generateSvg,
} from './svg';
import { vec2, vec3 } from 'gl-matrix';
import { getIndices, getPositions, getSt } from './webgl';

type CalcAdjacentVector = {
  vector: Vector;
  point: Point;
  length: number;
  vectorToFulcrumAngle: number;
  angle: number;
};

const matchSegment = (point: Point, lineSegment): Vector[] => {
  const keys = Object.keys(lineSegment);
  for (let i = 0; i < keys.length; i++) {
    const [x, y] = keys[i].split(',');
    if (
      new BigNumber(x).decimalPlaces(6).toNumber() === new BigNumber(point.x).decimalPlaces(6).toNumber() &&
      new BigNumber(y).decimalPlaces(6).toNumber() === new BigNumber(point.y).decimalPlaces(6).toNumber()
    ) {
      return lineSegment[keys[i]];
    }
  }
  return [];
};

const makeSegmentKey = (point: Point): SegmentKey => {
  return `${point.x},${point.y}`;
};

const getPointFromSegmentKey = (key: SegmentKey): Point => {
  return {
    x: Number(key.split(',')[0]),
    y: Number(key.split(',')[1]),
  };
};

const calcAdjacentVectors = (points: Point[], vectors: Vector[]): CalcAdjacentVector[] => {
  const fulcrum = points[0];
  const lastPoint = points[points.length - 1];
  const beforeLastPoint = points[points.length - 2];
  const vector = {
    x0: lastPoint.x,
    y0: lastPoint.y,
    x1: beforeLastPoint.x,
    y1: beforeLastPoint.y,
  };

  const formattedVectors = vectors.map((v) => {
    const aVector = vec2.create();
    const bVector = vec2.create();
    const cross = vec2.create();

    const fulcrumX = fulcrum.x - vector.x0;
    const fulcrumY = fulcrum.y - vector.y0;
    const vectorX = vector.x1 - vector.x0;
    const vectorY = vector.y1 - vector.y0;
    const vX = v.x1 - v.x0;
    const vY = v.y1 - v.y0;
    vec2.normalize(aVector, [vectorX, vectorY]);
    vec2.normalize(bVector, [vX, vY]);
    vec2.cross(cross, aVector, bVector);

    return {
      vector: v,
      point: getEndPoint(v),
      length: vec2.length([v.x1 - v.x0, v.y1 - v.y0]),
      // ちょっと丸める
      angle: new BigNumber((Math.atan2(vectorX * vY - vectorY * vX, vectorX * vX + vectorY * vY) * 180) / Math.PI)
        .decimalPlaces(2)
        .toNumber(),
      vectorToFulcrumAngle:
        (Math.atan2(vectorX * fulcrumY - vectorY * fulcrumX, vectorX * fulcrumX + vectorY * fulcrumY) * 180) / Math.PI,
    };
  });
  return formattedVectors;
};

const filterAdjacentVectors = (points: Point[], vectors: CalcAdjacentVector[]): CalcAdjacentVector[] => {
  const sortedVectors = vectors
    .filter((v) => {
      if (equalPoint(points[0], v.point)) {
        return isConvexPolygon(points);
      }
      const isConvex = isConvexPolygon([...points, v.point]);
      return isConvex;
    })
    // // TODO: 0.1を変数に
    // .filter(v => 5< v.length)
    .filter((v) => {
      // 線分の間にあるかどうかをかくにん
      // vectorとvの間にfulcrumまでの線分がある必要がある
      if (v.vectorToFulcrumAngle === 0) {
        return true;
      }

      // 反時計回り
      if (0 < v.vectorToFulcrumAngle) {
        return 0 < v.angle;
      }
      return v.angle < 0;
    })
    .filter((v) => {
      // 並行な直線は除外
      return Math.abs(v.angle) !== 180 && Math.abs(v.angle) !== 0;
    })
    .sort((a, b) => {
      if (Math.abs(a.angle) !== Math.abs(b.angle)) {
        return Math.abs(a.angle) - Math.abs(b.angle);
      }

      // 線分の長さでソート
      return (
        vec2.length([b.vector.x1 - b.vector.x0, b.vector.y1 - b.vector.y0]) -
        vec2.length([a.vector.x1 - a.vector.x0, a.vector.y1 - a.vector.y0])
      );

      // return 0;
      return (
        vec2.length([b.vector.x1 - b.vector.x0, b.vector.y1 - b.vector.y0]) -
        vec2.length([a.vector.x1 - a.vector.x0, a.vector.y1 - a.vector.y0])
      );
    });

  return sortedVectors;
};

const getAdjacentVectors = (points: Point[], vectors: Vector[]): Vector[] => {
  const formattedVectors = calcAdjacentVectors(points, vectors);

  const sortedVectors = filterAdjacentVectors(points, formattedVectors);

  const min = Math.min(...sortedVectors.map((v) => Math.abs(v.angle)));
  return sortedVectors.filter((v) => Math.abs(v.angle) === min).map((v) => v.vector);
};

const makePolygons = (points: [Point, Point], lineSegment): Array<Point[]> | null => {
  // pointsの先頭を起点とする
  const fulcrum = points[0];
  const lastPoint = points[points.length - 1];

  const formattedVectors = calcAdjacentVectors(points, matchSegment(lastPoint, lineSegment));

  const sortedVectors = filterAdjacentVectors(points, formattedVectors);
  const sortedVectorsWithCCW = sortedVectors.map((v) => {
    return {
      ...v,
      ccw: isCCW([...points, { x: v.vector.x1, y: v.vector.y1 }]),
    };
  });

  const ccwMin = Math.min(...sortedVectorsWithCCW.filter((v) => v.ccw > 0).map((v) => Math.abs(v.angle)));
  const cwMin = Math.min(...sortedVectorsWithCCW.filter((v) => v.ccw < 0).map((v) => Math.abs(v.angle)));

  const sortedVectorsCCW = sortedVectorsWithCCW.filter((v) => v.ccw > 0 && Math.abs(v.angle) - ccwMin < 0.1);
  const sortedVectorsCW = sortedVectorsWithCCW.filter((v) => v.ccw < 0 && Math.abs(v.angle) - cwMin < 0.1);

  const ccwList = sortedVectorsCCW.map((sortedVector) => {
    // 線分の途中に始点が含まれていた場合中断
    if (hasLine(sortedVector.vector, fulcrum) && !isEdge(sortedVector.vector, fulcrum)) {
      return null;
    }

    const nextStartPoint = getEndPoint(sortedVector.vector);

    // fulcrumになったら返えす
    if (nextStartPoint.x !== fulcrum.x || nextStartPoint.y !== fulcrum.y) {
      return findAdjacentPoint([...points, nextStartPoint], lineSegment);
    }

    return [...points, nextStartPoint];
  });

  const cwList = sortedVectorsCW.map((sortedVector) => {
    // 線分の途中に始点が含まれていた場合中断
    if (hasLine(sortedVector.vector, fulcrum) && !isEdge(sortedVector.vector, fulcrum)) {
      return null;
    }

    const nextStartPoint = getEndPoint(sortedVector.vector);

    // fulcrumになったら返えす
    if (nextStartPoint.x !== fulcrum.x || nextStartPoint.y !== fulcrum.y) {
      return findAdjacentPoint([...points, nextStartPoint], lineSegment);
    }

    return [...points, nextStartPoint];
  });

  const filteredCcwList = ccwList.filter((list) => list !== null);
  const filteredCwList = cwList.filter((list) => list !== null);

  return [filteredCcwList[filteredCcwList.length - 1], filteredCwList[filteredCwList.length - 1]].filter(
    (val) => !!val,
  );
};

const findAdjacentPoint = (points: Point[], lineSegment): Point[] | null => {
  // pointsの先頭を起点とする
  const fulcrum = points[0];
  const lastPoint = points[points.length - 1];

  const adjacentVectors = getAdjacentVectors(points, matchSegment(lastPoint, lineSegment));

  if (adjacentVectors.length === 0) {
    return null;
  }

  for (let i = 0; i < adjacentVectors.length; i++) {
    const vector = adjacentVectors[i];
    if (equalPoint(getEndPoint(vector), fulcrum)) {
      return [...points];
    }
  }

  const bbbbb = {};
  adjacentVectors.forEach((a, i) => {
    const __adjacentVectors = getAdjacentVectors(
      [...points, getEndPoint(a)],
      matchSegment(getEndPoint(a), lineSegment),
    );
    if (__adjacentVectors.length) {
      bbbbb[i] = __adjacentVectors;
    }
  });

  if (Object.keys(bbbbb).length === 0) {
    return null;
  }

  const adjacentVector = adjacentVectors[Math.max(...Object.keys(bbbbb))];

  const nextStartPoint = getEndPoint(adjacentVector);

  // 線分の途中に始点が含まれていた場合中断
  if (hasLine(adjacentVector, fulcrum) && !isEdge(adjacentVector, fulcrum)) {
    return null;
  }

  // fulcrumになったら返えす
  if (nextStartPoint.x !== fulcrum.x || nextStartPoint.y !== fulcrum.y) {
    return findAdjacentPoint([...points, nextStartPoint], lineSegment);
  }

  return [...points];
};

/**
 * SVG要素分処理を行う
 */
export const generatePolygons = (element) => {
  const results: {
    data: {
      position: number[];
      st: number[];
      indices: number[];
    };
    onLineClick: (fn) => void;
  }[] = [];

  const views = element.querySelectorAll('svg');
  views.forEach((view, i) => {
    const lines = view.querySelectorAll('line');

    // lineから線分情報を取得する
    const vectors: Vector[] = [...lines].map((line) => getPointsFromLine(line));

    // 各線分の交点を求める。重複点は削除する
    const points = getIntersectionPoints(vectors);

    // uniqueなpointsにする
    // TODO: 微妙な誤差の点がある
    const uniquePoints = makeUniquePoints(points);

    // console.warn('uniquePoints', uniquePoints);

    // pointを加味して分割した線分を作成する
    const splitVectors = makeSplitVectors(uniquePoints, vectors);

    // console.warn('splitVectors', splitVectors);

    // uniqueなvectorにする
    const uniqueSplitVectors = makeUniqueVectors(splitVectors);

    // console.warn('uniqueSplitVectors', uniqueSplitVectors.sort((a, b) => {
    //   if (a.x0 !== b.x0) {
    //     return a.x0 - b.x0;
    //   }
    //   if (a.y0 !== b.y0) {
    //     return a.y0 - b.y0;
    //   }
    //   if (a.x1 !== b.x1) {
    //     return a.x1 - b.x1;
    //   }
    //   if (a.y1 !== b.y1) {
    //     return a.y1 - b.y1;
    //   }
    //   return 0;
    // }));

    // console.warn('uniqueSplitVectors', uniqueSplitVectors);

    // 点をkeyとして、点を含むvectorをまとめる
    const lineSegment: { [key: `${number},${number}`]: Vector[] } = {};
    uniquePoints.forEach((point) => {
      const vectors = [];
      uniqueSplitVectors.forEach((vector) => {
        // TODO: 確認
        const has = hasLineLax(vector, point);

        // pointから始める線分で、線分の途中に交点がないもの
        if (has && isEdgeLax(vector, point)) {
          // if (equalPoint(point, getEndPoint(vector)))

          // keyとなるpointがx0, y0になるようにする
          if (equalPointLax(point, getStartPoint(vector), 6)) {
            vectors.push({
              x0: point.x,
              y0: point.y,
              x1: vector.x1,
              y1: vector.y1,
            });
          } else {
            vectors.push({
              x0: point.x,
              y0: point.y,
              x1: vector.x0,
              y1: vector.y0,
            });
            vectors.push(reverseVector(vector));
          }

          // // keyとなるpointがx0, y0になるようにする
          // if (equalPoint(point, getStartPoint(vector))) {
          //   vectors.push(vector);
          // } else {
          //   vectors.push(reverseVector(vector));
          // }
        }
      });
      lineSegment[makeSegmentKey(point)] = makeUniqueVectors(vectors);
    });

    // console.warn(lineSegment)

    const trianglePolygons = [];
    const allPolygons = [];

    Object.entries(lineSegment).forEach(([key, lsVectors]) => {
      // 今の多角形の始点
      const fulcrum = getPointFromSegmentKey(key);

      // console.group('fulcrum', fulcrum);

      const angleOfVectors = {};
      lsVectors.forEach((lsVector) => {
        const aVector = vec3.create();
        vec3.normalize(aVector, [lsVector.x1 - lsVector.x0, lsVector.y1 - lsVector.y0, 0]);
        const angle = calcAngleDegrees({
          x: aVector[0],
          y: aVector[1],
        });
        const length = vec2.length([lsVector.x1 - lsVector.x0, lsVector.y1 - lsVector.y0]);

        if (!angleOfVectors[angle]) {
          angleOfVectors[angle] = length;
        } else if (length < angleOfVectors[angle]) {
          angleOfVectors[angle] = length;
        }
      });

      const filteredVectors = lsVectors.filter((lsVector) => {
        const aVector = vec3.create();
        vec3.normalize(aVector, [lsVector.x1 - lsVector.x0, lsVector.y1 - lsVector.y0, 0]);
        const angle = calcAngleDegrees({
          x: aVector[0],
          y: aVector[1],
        });
        const length = vec2.length([lsVector.x1 - lsVector.x0, lsVector.y1 - lsVector.y0]);
        return angleOfVectors[angle] === length;
      });

      filteredVectors.forEach((lsVector) => {
        // console.group('lsVector', { x: lsVector.x1, y: lsVector.y1 });

        const polygons = makePolygons([fulcrum, getEndPoint(lsVector)], lineSegment);

        polygons.forEach((polygon) => {
          const sortedPoints = sortPoints(polygon);
          const triangleCount = sortedPoints.length - 2;

          allPolygons.push(polygon);

          for (let j = 0; j < triangleCount; j++) {
            if (
              !trianglePolygons.some((points) => {
                return (
                  equalPointLax(points[0], sortedPoints[0], 6) &&
                  equalPointLax(points[1], sortedPoints[j + 1], 6) &&
                  equalPointLax(points[2], sortedPoints[j + 2], 6)
                );
              })
            ) {
              trianglePolygons.push([sortedPoints[0], sortedPoints[j + 1], sortedPoints[j + 2]]);
            }
          }
        });
        // console.groupEnd();
      });

      // console.groupEnd();
    });

    const triangles = [...trianglePolygons];

    // 確認のためにcanvasに情報を表示する
    const container = document.querySelectorAll('.wrapper')[i];

    // pointsの描画
    {
      let svg = generateSvg();
      container.appendChild(svg);
      drawPointsSvg(svg, uniquePoints, { size: 1, fill: '#000', stroke: '#000' });

      // clickで線分を表示
      svg.querySelectorAll('circle').forEach((circle) => {
        circle.addEventListener('click', (e) => {
          svg.querySelectorAll('line').forEach((line) => {
            line.remove();
          });
          const lines = matchSegment(
            {
              x: e.target.getAttribute('cx'),
              y: e.target.getAttribute('cy'),
            },
            lineSegment,
          );
          drawLines(svg, lines);
        });
      });
    }

    // // linesの描画
    // {
    //   let svg = generateSvg();
    //   container.appendChild(svg);
    //   drawLines(svg, uniqueSplitVectors);
    // }

    // // polygonsの描画
    // {
    //   let svg = generateSvg();
    //   container.appendChild(svg);
    //   drawPolygons(svg, allPolygons);
    // }

    // 全部の描画
    let svg = generateSvg();
    container.appendChild(svg);
    drawTriangle(svg, triangles);
    drawLines(svg, uniqueSplitVectors);

    // // TODO: htmlもけす
    // {
    //   triangles.forEach((tr) => {
    //     const ww = document.querySelectorAll('.triangles')[i];
    //     let svg = generateSvg();
    //     // ww.classList.add('w-[200px]');
    //     // ww.classList.add('h-[200px]');
    //     // svg.classList.add('absolute');
    //     // svg.classList.add('top-0');
    //     // svg.classList.add('left-0');
    //     document.querySelectorAll('.triangles')[i].appendChild(svg);
    //     drawLines(svg, uniqueSplitVectors);
    //     drawTriangle(svg, [tr]);
    //   });
    // }

    // TODO: WebGL用の処理
    const position = getPositions(uniquePoints);
    const st = getSt(uniquePoints);
    const indices = getIndices(uniquePoints, triangles);
    // pointsの描画
    {
      const right = getRightPoint(uniquePoints, { x0: 0, y0: 0, x1: 150, y1: 150 });
      const left = getRightPoint(uniquePoints, { x0: 0, y0: 0, x1: 150, y1: 150 }, false);
      let svg = generateSvg();
      container.appendChild(svg);
      drawPointsSvg(svg, right, { size: 3, fill: '#f00', stroke: '#f00' });
      drawPointsSvg(svg, left, { size: 3, fill: '#00f', stroke: '#00f' });
    }
    console.warn('頂点の数：', uniquePoints.length);
    console.warn('三角形の数：', triangles.length);

    const onLineClick = (callback) => {
      // clickで線分を表示
      svg.querySelectorAll('line').forEach((line) => {
        line.addEventListener('click', (e) => {
          callback(line);
        });
      });
    };
    results.push({
      data: {
        position,
        st,
        indices,
      },
      onLineClick,
    });
  });

  return results.map(a=>a.data);
};
