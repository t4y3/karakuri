import { Taxis } from 'taxis';
import { mat4 } from 'gl-matrix';
import * as geometry from 'shared/lib/geometry';
import type { Geometry } from 'shared/lib/geometry';
import { createProgram, createShaderObject, createVBO, enableAttribute } from 'shared/lib/utils';
import { Camera } from 'shared/lib/camera';
import { fragment, vertex, attribute, uniLocation } from '../shader/shader';
import { addParameters } from '../../../utils/parameters';
import type { Parameters } from '../../../utils/parameters';

export class Scene {
  canvas: HTMLCanvasElement;
  gl: WebGLRenderingContext;
  program: WebGLProgram = null;
  pMatrix: mat4 = mat4.create();
  vMatrix: mat4 = mat4.create();
  vpMatrix: mat4 = mat4.create();
  attLocation: GLint[] = [];
  attStride: number[] = [];
  uniLocation: {
    [key: string]: WebGLUniformLocation;
  } = uniLocation;
  taxis: Taxis;
  parameters: Parameters = {
    cullFace: false,
    depthTest: false,
    view: {
      fovy: 45,
      near: 0.0,
      far: 20.0,
    },
  };
  // model系
  axis: Geometry;
  axisVBO: WebGLBuffer[];

  box: Geometry;
  boxVBO: WebGLBuffer[];

  targetPosition = [0.0, 3.0, 0.0];
  camera: Camera;

  constructor() {
    this.taxis = new Taxis();
  }

  init(canvas: HTMLCanvasElement, paneElement: HTMLElement) {
    this.canvas = canvas;
    this.gl = canvas.getContext(`webgl`);
    this.camera = new Camera(canvas, {
      position: {
        direction: [0.0, 1.0, 1.0],
        distance: 10.0,
      },
    });
    addParameters(this.parameters, paneElement);
    this.addResizeEvent();

    this.setupProgram();

    // 個別の処理
    this.setupBoxGeometry();
    this.setupAxisGeometry();
    this.setupLocation();

    this.render();
  }

  /**
   * Stop ticker
   */
  destroy() {
    this.taxis.reset();
  }

  setupProgram() {
    const mainVs = createShaderObject(this.gl, vertex, this.gl.VERTEX_SHADER);
    const mainFs = createShaderObject(this.gl, fragment, this.gl.FRAGMENT_SHADER);
    this.program = createProgram(this.gl, mainVs, mainFs);
    this.gl.useProgram(this.program);
  }

  addResizeEvent() {
    this.resizeCanvas();
    window.addEventListener('resize', this.resizeCanvas, { passive: true });
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  setupLocation() {
    attribute.forEach((v, i) => {
      this.attLocation[i] = this.gl.getAttribLocation(this.program, v.variable);
      this.attStride[i] = v.attStride;
    });
    Object.keys(this.uniLocation).forEach((uniform) => {
      this.uniLocation[uniform] = this.gl.getUniformLocation(this.program, uniform);
    });
  }

  setupRendering(delta: number) {
    // clear処理
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.gl.clearColor(0.1, 0.12, 0.14, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    this.reflectParameters();

    // 自作の
    mat4.invert(this.vMatrix, this.camera.update());

    mat4.perspective(
      this.pMatrix,
      this.parameters.view.fovy,
      this.canvas.width / this.canvas.height,
      this.parameters.view.near,
      this.parameters.view.far,
    );
    mat4.multiply(this.vpMatrix, this.pMatrix, this.vMatrix);
  }

  setupBoxGeometry() {
    this.box = geometry.cubeWireframe(0.5, 0.5, 0.5, [1.0, 0.45, 0.45, 1.0]);
    this.boxVBO = [createVBO(this.gl, this.box.position), createVBO(this.gl, this.box.color)];
  }

  renderTargetBoxGeometry(position, delta?: number) {
    enableAttribute(this.gl, this.boxVBO, this.attLocation, this.attStride);

    const x = Math.cos(delta / 1000) * 5;
    const z = Math.sin(delta / 1000) * 5;
    this.targetPosition[0] = x;
    this.targetPosition[2] = z;

    let mMatrix = mat4.create();
    mat4.translate(mMatrix, mMatrix, this.targetPosition);

    this.setupMvp(mMatrix);
    this.gl.drawArrays(this.gl.LINES, 0, this.box.position.length / 3);
  }

  renderBoxGeometry(position) {
    enableAttribute(this.gl, this.boxVBO, this.attLocation, this.attStride);

    let mMatrix = mat4.create();
    mat4.translate(mMatrix, mMatrix, position);
    mat4.targetTo(mMatrix, position, this.targetPosition, [0.0, 1.0, 0.0]);

    this.setupMvp(mMatrix);
    this.gl.drawArrays(this.gl.LINES, 0, this.box.position.length / 3);
  }

  setupAxisGeometry() {
    this.axis = geometry.axis(20/*, [1.0, 0.45, 0.45, 1.0]*/);
    this.axisVBO = [createVBO(this.gl, this.axis.position), createVBO(this.gl, this.axis.color)];
  }

  renderAxis(position) {
    enableAttribute(this.gl, this.axisVBO, this.attLocation, this.attStride);

    let mMatrix = mat4.create();
    mat4.translate(mMatrix, mMatrix, position);

    this.setupMvp(mMatrix);
    this.gl.drawArrays(this.gl.LINES, 0, this.axis.position.length / 3);
  }

  setupMvp(mMatrix) {
    // // mvp 行列を生成してシェーダに送る
    const mvpMatrix = mat4.create();
    mat4.multiply(mvpMatrix, this.vpMatrix, mMatrix);

    this.gl.uniformMatrix4fv(this.uniLocation.mvpMatrix, false, mvpMatrix);
  }

  /**
   * render処理
   */
  render() {
    this.taxis.begin();

    this.taxis.ticker((delta, axes) => {
      this.setupRendering(delta);

      // target
      this.renderTargetBoxGeometry([0.0, 3.0, 0.0], delta);

      for (let i = 0; i < 10; i++) {
        for (let j = 0; j < 10; j++) {
          const x = (j - 5) * 1 + 0.5;
          const z = (i - 5) * 1 + 0.5;
          this.renderBoxGeometry([x, 0.0, z]);
        }
      }

      this.renderAxis([0.0, 0.0, 0.0]);
    });
  }

  reflectParameters() {
    if (this.parameters.cullFace) {
      this.gl.enable(this.gl.CULL_FACE);
    } else {
      this.gl.disable(this.gl.CULL_FACE);
    }
    if (this.parameters.depthTest) {
      this.gl.enable(this.gl.DEPTH_TEST);
    } else {
      this.gl.disable(this.gl.DEPTH_TEST);
    }
  }
}
