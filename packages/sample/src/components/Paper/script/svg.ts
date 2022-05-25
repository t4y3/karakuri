import Snap from "snapsvg";
import type { Point, Vector } from "./types";
import { Width, Height } from "./constants";
const Colors = [
  "#E3F2FD",
  "#BBDEFB",
  "#E8EAF6",
  "#C5CAE9",
  "#EDE7F6",
  "#D1C4E9",
  "#E1F5FE",
  "#B3E5FC",
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

export const drawPoints = (svg: HTMLOrSVGElement, points: Point[], opts: {
  size: number, fill:string, stroke: string
} = { size: 1, fill: '#000', stroke: '#000' }) => {
  const paper = Snap(svg);
  points.forEach((point) => {
    paper.circle(point.x, point.y, opts.size).attr({
      id: `p-${point.x}-${point.y}`.replace('.', '-'),
      fill: opts.fill,
      stroke: opts.stroke,
    });
  });
  return paper.node;
};

export const fillPoints = (
  svg: HTMLOrSVGElement,
  points: Point[],
  color: string
) => {
  const paper = Snap(svg);
  points.forEach((point) => {
    const target = paper.select(`#p-${point.x}-${point.y}`.replace('.', '-'));
    target.attr({
      fill: color,
    });
  });
  return paper.node;
};

export const drawLines = (svg: HTMLOrSVGElement, lines: Vector[]) => {
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

export const drawPolygons = (
  svg: HTMLOrSVGElement,
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
  svg: HTMLOrSVGElement,
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
