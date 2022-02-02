import { Taxis } from 'taxis';
import { mat4, vec3 } from 'gl-matrix';
import * as geometry from 'shared/lib/src/geometry';
import type { Geometry } from 'shared/lib/src/geometry';
import { createProgram, createShaderObject, createVBO, createIBO, enableAttribute } from 'shared/lib/src/utils';
import { Camera } from 'shared/lib/src/camera';
import { fragment, vertex, attribute, uniLocation } from '../shader/shader';
import { addParameters } from '../../../utils/parameters';
import type { Parameters } from '../../../utils/parameters';

const ITEMS_COUNT = 40;
const AREA_SIZE = 20;
const BOX_SIZE = 1.0;

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
    depthTest: true,
    light: {
      position: {
        x: 30,
        y: 30,
        z: 30
      }
    }
  };
  // model系
  floor: {
    geometry: Geometry;
    VBO: WebGLBuffer[];
    IBO: WebGLBuffer
  } = {
    geometry: null,
    VBO: [],
    IBO: [],
  };
  items: {
    geometry: Geometry;
    VBO: WebGLBuffer[];
    IBO: WebGLBuffer;
  }[] = [];
  itemsPosition: [x: number, y: number, z: number][] = [];
  camera: Camera;

  constructor() {
    this.taxis = new Taxis();
  }

  init(canvas: HTMLCanvasElement, paneElement: HTMLElement) {
    this.canvas = canvas;
    this.gl = canvas.getContext(`webgl`);
    this.camera = new Camera(canvas, {
      isMovable: false,
      position: {
        direction: [0.0, 1.0, 1.0],
        distance: 20.0,
      },
      maxDistance: 50,
    });
    addParameters(this.parameters, paneElement);
    this.addResizeEvent();

    this.setupProgram();

    // 個別の処理
    this.setupItemsGeometry();
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

    mat4.perspective(this.pMatrix, 45, this.canvas.width / this.canvas.height, 0.1, 40.0);
    mat4.multiply(this.vpMatrix, this.pMatrix, this.vMatrix);
  }

  setupItemsGeometry() {
    for (let i = 0; i < ITEMS_COUNT; i++) {
      // 配置をランダムに
      const x = (Math.random() - 0.5) * AREA_SIZE;
      const y = (Math.random() - 0.5) * AREA_SIZE;
      const z = (Math.random() - 0.5) * AREA_SIZE;
      this.itemsPosition[i] = [x, 0, z];

      this.items[i] = {
        geometry: null,
        VBO: [],
        IBO: [],
      };
      this.items[i].geometry = geometry.cube(1, [x / AREA_SIZE, y / AREA_SIZE, z / AREA_SIZE, 1.0]);
      this.items[i].VBO = [
        createVBO(this.gl, this.items[i].geometry.position),
        createVBO(this.gl, this.items[i].geometry.color),
        createVBO(this.gl, this.items[i].geometry.normal),
      ];
      this.items[i].IBO = createIBO(this.gl, this.items[i].geometry.indices);
    }
  }

  renderItemsGeometry() {
    this.items.forEach((item, i) => {
      enableAttribute(this.gl, this.items[i].VBO, this.attLocation, this.attStride);
      this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.items[i].IBO);

      let mMatrix = mat4.create();
      mat4.translate(mMatrix, mMatrix, this.itemsPosition[i]);
      // 箱のサイズ分上にずらす
      mat4.translate(mMatrix, mMatrix, [0.0, BOX_SIZE/ 2, 0.0]);

      this.setupMvp(mMatrix);
      this.gl.drawElements(this.gl.TRIANGLES, this.items[i].geometry.indices.length, this.gl.UNSIGNED_SHORT, 0);
    });
  }

  setupAxisGeometry() {
    this.floor.geometry = geometry.floor(20, 20, [0.45, 0.45, 0.45, 1.0]);
    this.floor.VBO = [createVBO(this.gl, this.floor.geometry.position), createVBO(this.gl, this.floor.geometry.color)];
    this.floor.IBO = createIBO(this.gl, this.floor.geometry.indices);
  }

  renderAxis(position) {
    enableAttribute(this.gl, this.floor.VBO, this.attLocation, this.attStride);

    let mMatrix = mat4.create();
    mat4.translate(mMatrix, mMatrix, position);

    this.setupMvp(mMatrix);
    // this.gl.drawArrays(this.gl.LINES, 0, this.floor.geometry.position.length / 3);
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.floor.IBO);
    this.gl.drawElements(this.gl.TRIANGLES, this.floor.geometry.indices.length, this.gl.UNSIGNED_SHORT, 0);
  }

  setupMvp(mMatrix) {
    // normalMatrix
    const normalMatrix = mat4.create();
    mat4.invert(normalMatrix, mMatrix);
    mat4.transpose(normalMatrix, normalMatrix);
    this.gl.uniformMatrix4fv(this.uniLocation.normalMatrix, false, normalMatrix);

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
      this.renderItemsGeometry();
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
