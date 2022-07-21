import Snap from "snapsvg";
import type { Point, Vector } from "./types";
import { Width, Height } from "./constants";
const Colors = [
  "#E3F2FD", // 227, 242, 253
  "#BBDEFB", // 187, 222, 251
  "#E8EAF6", // 232, 234, 246
  "#C5CAE9", // 197, 202, 233
  "#EDE7F6", // 237, 231, 246
  "#D1C4E9", // 209, 196, 233
  "#E1F5FE", // 225, 245, 254
  "#B3E5FC", // 179, 229, 252
];

/**
 * Line要素から座標を取得
 */
export const getPointsFromLine = (line: SVGLineElement) => {
  const x0 = Number(line.getAttribute('x1'));
  const y0 = Number(line.getAttribute('y1'));
  const x1 = Number(line.getAttribute('x2'));
  const y1 = Number(line.getAttribute('y2'));
  return {
    x0,
    y0,
    x1,
    y1,
  };
};

export const generateSvg = () => {
  // const svg = document.createElement('svg');
  const svg = Snap();
  svg.attr("viewBox", `0 0 ${Width} ${Height}`);
  return svg.node;
};

export const drawPoints = (svg: SVGElement, points: Point[], opts: {
  size: number, fill:string, stroke: string
} = { size: 1, fill: '#000', stroke: '#000' }) => {
  const paper = Snap(svg);
  points.forEach((point) => {
    paper.circle(point.x, point.y, opts.size).attr({
      id: `p-${point.x}-${point.y}`.replace(/\./g, '-'),
      fill: opts.fill,
      stroke: opts.stroke,
    });
  });
  return paper.node;
};

export const fillPoints = (
  svg: SVGElement,
  points: Point[],
  color: string
) => {
  const paper = Snap(svg);
  points.forEach((point) => {
    const target = paper.select(`#p-${point.x}-${point.y}`.replace(/\./g, '-'));
    target.attr({
      fill: color,
      stroke: color
    });
  });
  return paper.node;
};

export const removePointsAll = (
  svg: SVGElement
) => {
  const targets = svg.querySelectorAll(`circle`);
  targets.forEach((point) => {
    svg.removeChild(point);
  });
};

export const drawLines = (svg: SVGElement, lines: Vector[]) => {
  const paper = Snap(svg);
  lines.forEach((vec) => {
    paper.line(vec.x0, vec.y0, vec.x1, vec.y1).attr({
      id: `l-${vec.x0}-${vec.y0}-${vec.x1}-${vec.y1}`,
      stroke: "#000",
      'stroke-width': '1px'
    });
  });
  return paper.node;
};

export const fillLine = (svg: SVGElement, line: Vector) => {
  const paper = Snap(svg);
  const lines = svg.querySelectorAll(`line`);
  lines.forEach((vec) => {
    const vecPoint = getPointsFromLine(vec);
    if (line.x0 === vecPoint.x0 && line.y0 === vecPoint.y0 &&
      line.x1 === vecPoint.x1 && line.y1 === vecPoint.y1) {
      Snap(vec).attr({
        fill: '#f00',
        stroke: "#f00",
      })
    } else {
      Snap(vec).attr({
        fill: '#000',
        stroke: "#000",
      })
    }
  });
  return paper.node;
};

export const drawPolygons = (
  svg: SVGElement,
  polygons: Array<Point[]>
) => {
  const paper = Snap(svg);
  polygons.forEach((points, i) => {
    let path = "";
    path += `M${points[0].x},${points[0].y}`;
    points.forEach((point, i) => {
      if (i === 0) {
        return;
      }
      path += `L${point.x},${point.y}`;
    })
    path += `L${points[0].x},${points[0].y}`;

    paper.path(path).attr({
      fill: Colors[i % Colors.length],
      stroke: '#fff',
      'stroke-width': '1px'
    });

  });
  return paper.node;
};

export const drawTriangle = (
  svg: SVGElement,
  trianglePoints: Array<Point[]>
) => {
  const paper = Snap(svg);
  trianglePoints.forEach((points, i) => {
    let path = "";
    path += `M${points[0].x},${points[0].y}`;
    path += `L${points[1].x},${points[1].y}`;
    path += `L${points[2].x},${points[2].y}`;
    path += `L${points[0].x},${points[0].y}`;
    paper.path(path).attr({
      fill: Colors[i % Colors.length],
      stroke: '#bbb',
      'stroke-width': '1px'
    });
  });
  return paper.node;
};
