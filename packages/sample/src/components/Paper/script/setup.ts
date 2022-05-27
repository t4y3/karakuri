import { Taxis } from 'taxis';
import { mat4, mat3, quat, vec3 } from 'gl-matrix';
import * as geometry from 'shared/lib/src/geometry';
import { cross, dot, normalize } from 'shared/lib/src/vec3';
import type { Geometry } from 'shared/lib/src/geometry';
import { createIBO, createProgram, createShaderObject, createVBO, enableAttribute } from 'shared/lib/src/utils';
import { Camera } from 'shared/lib/src/camera';
import { fragment, vertex, attribute, uniLocation } from '../shader/shader';
import { addParameters } from '../../../utils/parameters';
import type { Parameters } from '../../../utils/parameters';
import { loadImage } from '../../../utils/utils';
import { getVertexOption } from './webgl';
import type { Vector } from './types';

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
  parameters: Parameters & { interporation: number } = {
    cullFace: true,
    depthTest: true,
    light: {
      position: {
        x: 0,
        y: 1,
        z: 0,
      },
    },
    clockWise: false,
    view: {
      fovy: 45,
      near: 0.1,
      far: 30.0,
    },
    interporation: 0.0,
  };
  paperGeometry: {
    position: number[];
    st: number[];
    indices: number[];
  };
  // model系
  axis: {
    geometry: Geometry;
    VBO: WebGLBuffer[];
    IBO: WebGLBuffer;
  } = {
    geometry: null,
    VBO: [],
    IBO: [],
  };
  paper: {
    geometry: Geometry;
    VBO: WebGLBuffer[];
    IBO: WebGLBuffer;
  } = {
    geometry: null,
    VBO: [],
    IBO: [],
  };
  camera: Camera;
  texture0: WebGLTexture;
  texture1: WebGLTexture;

  constructor() {
    this.taxis = new Taxis();
  }

  init(
    canvas: HTMLCanvasElement,
    paneElement: HTMLElement,
    paperGeometry: {
      position: number[];
      st: number[];
      indices: number[];
    },
  ) {
    this.canvas = canvas;
    this.gl = canvas.getContext(`webgl`);
    this.paperGeometry = paperGeometry;
    this.camera = new Camera(canvas, {
      position: {
        direction: [0.0, 1.0, 0.5],
        distance: 20.0,
      },
    });

    /**
     * debug
     */
    const pane = addParameters(this.parameters, paneElement);
    pane
      .addInput(
        {
          interporation: this.parameters.interporation,
        },
        'interporation',
        {
          min: 0.0,
          max: 1.0,
        },
      )
      .on('change', (v) => {
        this.parameters.interporation = v.value;
      });

    this.addResizeEvent();

    this.setupProgram();

    // 個別の処理
    this.setupPaperGeometry();
    this.setupAxisGeometry();
    this.setupLocation();

    window.Promise.resolve()
      .then(() =>
        window.Promise.all([
          loadImage('/assets/blue.png'),
          loadImage('/assets/sample.jpg'),
          // loadImage('/assets/white.jpg'),
        ]),
      )
      .then((ress) => {
        const [frontTexture, backTexture] = ress;
        [frontTexture, backTexture].forEach((texture, i) => {
          // テクスチャオブジェクトの生成
          const tex = this.gl.createTexture();

          // テクスチャをバインドする
          this.gl.bindTexture(this.gl.TEXTURE_2D, tex);

          // テクスチャへイメージを適用
          this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, texture);

          // ミップマップを生成
          this.gl.generateMipmap(this.gl.TEXTURE_2D);

          // テクスチャのバインドを無効化
          this.gl.bindTexture(this.gl.TEXTURE_2D, null);

          // 生成したテクスチャをグローバル変数に代入
          this[`texture${i}`] = tex;
        });

        this.render();
      });

    return {
      updateGeometry: (vector: Vector) => {
        this.setupPaperGeometry({
          x0: vector.x0 / 10,
          y0: vector.y0 / 10,
          x1: vector.x1 / 10,
          y1: vector.y1 / 10,
        });
      },
    };
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
    this.canvas.width = this.canvas.clientWidth;
    this.canvas.height = this.canvas.clientHeight;
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

    this.gl.uniform3fv(this.uniLocation.eyePosition, this.camera.position);
    this.gl.uniform3fv(this.uniLocation.lightDirection, [
      this.parameters.light.position.x,
      this.parameters.light.position.y,
      this.parameters.light.position.z,
    ]);
    this.gl.uniform1f(this.uniLocation.interporation, this.parameters.interporation);

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

  setupPaperGeometry(vector: Vector = { x0: 0, y0: 0, x1: 0, y1: 0 }) {
    // this.paper.geometry = kami(15.0, [1.0, 1.0, 0.0, 1.0]);
    this.paper.geometry = kamiTest(
      this.paperGeometry.position,
      this.paperGeometry.st,
      this.paperGeometry.indices,
      vector,
    );

    this.paper.VBO = [
      // createVBO(this.gl, this.paper.geometry.position),
      createVBO(this.gl, this.paper.geometry.start),
      createVBO(this.gl, this.paper.geometry.end),
      createVBO(this.gl, this.paper.geometry.vectors),
      createVBO(this.gl, this.paper.geometry.origin),
      createVBO(this.gl, this.paper.geometry.color),
      createVBO(this.gl, this.paper.geometry.normal),
      createVBO(this.gl, this.paper.geometry.texCoord),
    ];
    this.paper.IBO = createIBO(this.gl, this.paper.geometry.indices);
  }

  renderPaperGeometry(position) {
    let mMatrix = mat4.create();
    mat4.translate(mMatrix, mMatrix, position);
    enableAttribute(this.gl, this.paper.VBO, this.attLocation, this.attStride);
    this.gl.enableVertexAttribArray(this.attLocation[2]);
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.paper.IBO);

    this.setupMvp(mMatrix);

    // this.gl.drawElements(this.gl.TRIANGLES, this.paper.geometry.indices.length, this.gl.UNSIGNED_SHORT, 0);
    this.gl.drawArrays(this.gl.TRIANGLES, 0, this.paper.geometry.position.length / 3);
  }

  setupAxisGeometry() {
    this.axis.geometry = geometry.axis(20 /*[0.45, 0.45, 0.45, 1.0]*/);
    this.axis.VBO = [
      createVBO(this.gl, this.axis.geometry.position),
      // createVBO(this.gl, this.axis.geometry.position),
      createVBO(this.gl, this.axis.geometry.color),
    ];
  }

  renderAxis(position) {
    enableAttribute(this.gl, this.axis.VBO, this.attLocation, this.attStride);

    this.gl.disableVertexAttribArray(this.attLocation[2]);

    let mMatrix = mat4.create();
    mat4.translate(mMatrix, mMatrix, position);

    this.setupMvp(mMatrix);
    this.gl.drawArrays(this.gl.LINES, 0, this.axis.geometry.position.length / 3);
  }

  setupMvp(mMatrix) {
    // mvp 行列を生成してシェーダに送る
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

      {
        this.gl.frontFace(this.gl.CCW);
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture0);
        this.renderPaperGeometry([-7.5, 0.0, -7.5]);
      }
      {
        this.gl.frontFace(this.gl.CW);
        // this.gl.activeTexture(this.gl.TEXTURE1);
        // this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture1);
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture1);
        this.renderPaperGeometry([-7.5, 0.0, -7.5]);
      }

      // this.renderAxis([0.0, 0.0, 0.0]);
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
    // if (this.parameters.clockWise) {
    //   this.gl.frontFace(this.gl.CW);
    // } else {
    //   this.gl.frontFace(this.gl.CCW);
    // }
  }
}

/**
 * いったんこのファイルにおく
 */
type Color = [number, number, number, number];

/**
 * @example
 * // Render using drawElements with mode gl.TRIANGLES.
 * this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.floor.IBO);
 * this.gl.drawElements(this.gl.TRIANGLES, this.floor.geometry.indices.length, this.gl.UNSIGNED_SHORT, 0);
 */
export const kami = (
  size: number,
  color: Color,
): Geometry & {
  vectors: number[];
  origin: Float32Array;
  start: number[];
  end: number[];
} => {
  const w = size / 2;
  const d = size / 2;

  // 1/4のとこ
  const ww = w / 2;

  // prettier-ignore
  const position = new Float32Array([
    0.0, 0.0,  size,
    w + ww, 0.0,  size,
    0.0, 0.0, 0.0,
    w + ww, 0.0, 0.0,

    // yの部分を計算で変えてみる
    size, 0.0, size,
    size, 0.0, 0.0,
    // -w, 0.0,  d,
    // ww, 0.0,  d,
    // -w, 0.0, -d,
    // ww, 0.0, -d,
    //
    // // yの部分を計算で変えてみる
    // ww + ww, 0.0, d,
    // ww + ww, 0.0, -d,
  ]);
  // prettier-ignore
  const normal = new Float32Array([
    0.0, 1.0, 0.0,
    0.0, 1.0, 0.0,
    0.0, 1.0, 0.0,
    0.0, 1.0, 0.0,

    0.0, 1.0, 0.0,
    0.0, 1.0, 0.0,
  ]);
  // prettier-ignore
  let col = new Float32Array([
    color[0], color[1], color[2], color[3],
    color[0], color[1], color[2], color[3],
    color[0], color[1], color[2], color[3],
    color[0], color[1], color[2], color[3],

    color[0], color[1], color[2], color[3],
    color[0], color[1], color[2], color[3],
  ]);
  // prettier-ignore
  let st  = [
    0.0, 0.0,
    1.0 * 0.75, 0.0,
    0.0, 1.0, // TODO
    1.0 * 0.75, 1.0, // TODO

    1.0, 0.0,
    1.0, 1.0
  ];
  // prettier-ignore
  let idx = [
    0, 2, 1,
    1, 2, 3,

    1, 3, 4,
    4, 3, 5
  ];

  const startVec = vec3.fromValues(w, 0.0, 0.0);
  const endVec = vec3.fromValues(0, w, 0.0);

  // ２つのベクトルの回転軸
  const __axis = normalize(cross(startVec, endVec));

  const start = quat.create();
  const end = quat.create();
  quat.setAxisAngle(start, __axis, 0 * (Math.PI / 180));
  quat.setAxisAngle(end, __axis, 180 * (Math.PI / 180));
  quat.normalize(start, start);
  quat.normalize(end, end);

  const baseStart = quat.create();
  const baseEnd = quat.create();
  quat.identity(baseStart);
  quat.identity(baseEnd);

  return {
    position,
    normal,
    color: col,
    indices: idx,
    texCoord: st,
    // prettier-ignore
    vectors: [
      ...[0.0, 0.0, 0.0],
      ...[0.0, 0.0, 0.0],
      ...[0.0, 0.0, 0.0],
      ...[0.0, 0.0, 0.0],
      ...[ww, 0.0, 0.0],
      ...[ww, 0.0, 0.0],
    ],
    // prettier-ignore
    origin: [
      position[0], position[1], position[2],
      position[3], position[4], position[5],
      position[6], position[7], position[8],
      position[9], position[10], position[11],

      position[3], position[4], position[5],
      position[9], position[10], position[11],
    ],
    // prettier-ignore
    start: [
      ...baseStart,
      ...baseStart,
      ...baseStart,
      ...baseStart,
      ...start,
      ...start
    ],
    // prettier-ignore
    end: [
      ...baseEnd,
      ...baseEnd,
      ...baseEnd,
      ...baseEnd,
      ...end,
      ...end
    ],
  };
};

/**
 * 軌道の座標を配列で返します。
 *
 * @param {THREE.Vector3} startPos 開始点です。
 * @param {THREE.Vector3} endPos 終了点です。
 * @param {number} segmentNum セグメント分割数です。
 * @returns {THREE.Vector3[]} 軌跡座標の配列です。
 * @see ics media
 */

export const kamiTest = (
  position,
  st,
  indices,
  vector: Vector,
): Geometry & {
  vectors: Float32Array;
  origin: Float32Array;
  start: Float32Array;
  end: Float32Array;
} => {
  // prettier-ignore
  const normal: number[] = [];
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
  console.warn(position.length / 3);
  [...Array(position.length / 3)].forEach(() => {
    normal.push(0.0, 1.0, 0.0);
    // color.push(1, 1, 1, 1.0);
  });
  [...Array(position.length / 3)].forEach((_, i) => {
    console.warn(i % colors.length)
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

  const vertexOption = getVertexOption(position, vector);

  return {
    position,
    normal: new Float32Array(normal),
    color: new Float32Array(color),
    origin: new Float32Array(vertexOption.origin),
    vectors: new Float32Array(vertexOption.vectors),
    start: new Float32Array(vertexOption.start),
    end: new Float32Array(vertexOption.end),
    indices,
    texCoord: st,
  };
};
