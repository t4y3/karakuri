import { mat4, quat, vec3 } from 'gl-matrix';
import { ReadonlyVec3 } from 'gl-matrix';

type Options = {
  isMovable?: boolean;
  isScalable?: boolean;
  center?: [number, number, number];
  position?: {
    direction: ReadonlyVec3;
    distance: number;
  };
  minDistance?: number;
  maxDistance?: number;
};

// TODO: scaleの挙動がなんか変
// TODO: オプション
// TODO: 移動系のメソッド
export class Camera {
  private isMovable: boolean = true;
  private isScalable: boolean = true;
  private drag: boolean;

  private __distance: number = 10.0;
  private scale: number = 0.0;

  private rotateX: number = 0.0;
  private rotateY: number = 0.0;
  // private rotateZ: number = 0.0;

  private prevPosition: number[];
  private qt = quat.create();
  private qtx = quat.create();
  private qty = quat.create();

  // TODO: オプションでもらえるように
  private center = [0.0, 0.0, 0.0];
  private __position = [0.0, 7.0, this.__distance];
  private defaultPosition = [0.0, 7.0, this.__distance];

  private defaultUpDirection = [0.0, 1.0, 0.0];
  private upDirection = [0.0, 1.0, 0.0];

  private minDistance: number = 1.0;
  private maxDistance: number = 20.0;

  get position () {
    return this.__position;
  }

  get distance() {
    return this.__distance;
  }

  set distance(value) {
    this.__distance = value;
  }

  constructor(private readonly container: HTMLElement, private readonly option?: Options) {
    this.handleMousedown = this.handleMousedown.bind(this);
    this.handleMousemove = this.handleMousemove.bind(this);
    this.handleMouseup = this.handleMouseup.bind(this);
    this.handleWheel = this.handleWheel.bind(this);

    // TODO: option
    if (this.option && 'isMovable' in this.option) {
      this.isMovable = this.option.isMovable;
    }
    if (this.option && 'isScalable' in this.option) {
      this.isScalable = this.option.isScalable;
    }
    if (this.option && this.option.center) {
      this.center = this.option.center;
    }
    if (this.option && this.option.minDistance) {
      this.minDistance = this.option.minDistance;
    }
    if (this.option && this.option.maxDistance) {
      this.maxDistance = this.option.maxDistance;
    }
    // TODO: position
    if (this.option && this.option.position) {
      const v = vec3.create();
      const n = vec3.create();
      vec3.normalize(n, this.option.position.direction)
      vec3.scale(v, n, this.option.position.distance);
      this.__position = [...v];
      this.defaultPosition = [...v];
    // private position = [0.0, 7.0, this.distance];
    // private defaultPosition = [0.0, 7.0, this.distance];
    //
    // private defaultUpDirection = [0.0, 1.0, 0.0];
    // private upDirection = [0.0, 1.0, 0.0];
    }

    this.addEvent();
  }

  addEvent() {
    if (this.isMovable) {
      this.container.addEventListener('mousedown', this.handleMousedown, { passive: true });
      this.container.addEventListener('mousemove', this.handleMousemove, { passive: true });
      this.container.addEventListener('mouseup', this.handleMouseup, { passive: true });
    }
    if (this.isScalable) {
      this.container.addEventListener('wheel', this.handleWheel, { passive: true });
    }
  }

  removeEvent() {
    if (this.isMovable) {
      this.container.removeEventListener('mousedown', this.handleMousedown);
      this.container.removeEventListener('mousemove', this.handleMousemove);
      this.container.removeEventListener('mouseup', this.handleMouseup);
    }
    if (this.isScalable) {
      this.container.removeEventListener('wheel', this.handleWheel);
    }
  }

  handleMousedown(e) {
    this.drag = true;
    const rect = this.container.getBoundingClientRect();
    this.prevPosition = [e.clientX - rect.left, e.clientY - rect.top];
  }

  handleMousemove(e) {
    if (this.drag !== true) {
      return;
    }
    if (e.buttons !== 1) {
      return;
    }

    const rect = this.container.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    // サイズの小さい辺を基準に計算する
    const s = 1.0 / Math.min(w, h);

    const x = e.clientX;
    const y = e.clientY;

    this.rotateX += (this.prevPosition[0] - x) * s;
    this.rotateY += (this.prevPosition[1] - y) * s;
    this.rotateX = this.rotateX % 1.0;
    // // -0.25 ~ 0.25 ???
    // this.rotateY = Math.min(Math.max(this.rotateY % 1.0, -0.25), 0.25);

    this.prevPosition = [x, y];
  }

  handleMouseup() {
    this.drag = false;
  }

  handleWheel(e) {
    const w = e.wheelDelta;
    if (w > 0) {
      this.scale = -0.5;
    } else if (w < 0) {
      this.scale = 0.5;
    }
  }

  update() {
    const PI2 = Math.PI * 2.0;
    const v: ReadonlyVec3 = [1.0, 0.0, 0.0];

    // rotate
    quat.identity(this.qt);
    quat.identity(this.qtx);
    quat.identity(this.qty);

    quat.setAxisAngle(this.qtx, [0.0, 1.0, 0.0], this.rotateX * PI2);
    vec3.transformQuat(v as [number, number, number], v, this.qtx);

    quat.setAxisAngle(this.qty, v, this.rotateY * PI2);
    quat.multiply(this.qt, this.qty, this.qtx);

    vec3.transformQuat(this.__position, this.defaultPosition, this.qt);
    vec3.transformQuat(this.upDirection, this.defaultUpDirection, this.qt);

    // scale
    this.scale *= 0.7;
    this.__distance += this.scale;
    this.__distance = Math.min(Math.max(this.__distance, this.minDistance), this.maxDistance);
    const d = vec3.create();
    vec3.normalize(d, this.__position);
    vec3.scale(this.__position, d, this.__distance);

    return mat4.targetTo(mat4.create(), this.__position, this.center, this.upDirection);
  }
}
