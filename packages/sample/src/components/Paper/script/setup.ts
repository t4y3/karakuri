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
import { getAfterFoldedPosition, getPolygonColors, getVertexOption } from './webgl';
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
  foldedLines: Vector[];
  vertexAttributes: {
    position: Float32Array;
    origin: Float32Array;
    // 折線から動かす点までのvector
    vectors: Float32Array;
    start: Float32Array;
    end: Float32Array;
    afterPosition: Float32Array;
  }[];
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
    vectors: Vector[],
  ) {
    this.canvas = canvas;
    this.gl = canvas.getContext(`webgl`);
    this.paperGeometry = paperGeometry;
    this.foldedLines = vectors.map((vector) => {
      return {
        x0: vector.x0 / 10,
        y0: vector.y0 / 10,
        x1: vector.x1 / 10,
        y1: vector.y1 / 10,
      };
    });
    this.vertexAttributes = [];
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
          max: this.foldedLines.length,
          // max: 1.0,
        },
      )
      .on('change', (v) => {
        this.parameters.interporation = v.value;
      });

    this.addResizeEvent();

    this.setupProgram();

    // 個別の処理
    this.foldedLines.forEach((vector, i) => {
      const position = i === 0 ? this.paperGeometry.position : this.vertexAttributes[i - 1].afterPosition;
      const geometry = pagerGeometry(position, this.paperGeometry.st, this.paperGeometry.indices, vector);
      this.vertexAttributes[i] = {
        position: geometry.position,
        origin: geometry.origin,
        vectors: geometry.vectors,
        start: geometry.start,
        end: geometry.end,
        afterPosition: geometry.afterPosition,
      };
    });

    this.setupPaperGeometry(this.foldedLines[0]);

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
    this.gl.uniform1f(this.uniLocation.interporation, this.parameters.interporation % 1);

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
    this.paper.geometry = pagerGeometry(
      this.paperGeometry.position,
      this.paperGeometry.st,
      this.paperGeometry.indices,
      vector,
    );

    // TODO: startとかをthis.paper.geometryにいれない
    this.setupPaperVBO(
      this.paper.geometry.start,
      this.paper.geometry.end,
      this.paper.geometry.vectors,
      this.paper.geometry.origin,
      this.paper.geometry.color,
      this.paper.geometry.normal,
      this.paper.geometry.texCoord,
    );
    this.paper.IBO = createIBO(this.gl, this.paper.geometry.indices);
  }

  setupPaperVBO(start, end, vectors, origin, color, normal, texCoord) {
    this.paper.VBO = [
      // createVBO(this.gl, this.paper.geometry.position),
      createVBO(this.gl, start),
      createVBO(this.gl, end),
      createVBO(this.gl, vectors),
      createVBO(this.gl, origin),
      createVBO(this.gl, color),
      createVBO(this.gl, normal),
      createVBO(this.gl, texCoord),
    ];
  }

  renderPaperGeometry(position) {
    const g = this.vertexAttributes[Math.min(Math.floor(this.parameters.interporation / 1), this.foldedLines.length - 1)];
    this.setupPaperVBO(
      g.start,
      g.end,
      g.vectors,
      g.origin,
      this.paper.geometry.color,
      this.paper.geometry.normal,
      this.paper.geometry.texCoord,
    )

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
 * 軌道の座標を配列で返します。
 *
 * @param {THREE.Vector3} startPos 開始点です。
 * @param {THREE.Vector3} endPos 終了点です。
 * @param {number} segmentNum セグメント分割数です。
 * @returns {THREE.Vector3[]} 軌跡座標の配列です。
 * @see ics media
 */

export const pagerGeometry = (
  position: number[],
  st: number[],
  indices: number[],
  vector: Vector,
): Geometry & {
  vectors: Float32Array;
  origin: Float32Array;
  start: Float32Array;
  end: Float32Array;
  afterPosition: Float32Array;
} => {
  const normal: number[] = [];

  const color = getPolygonColors(new Float32Array(position));

  [...Array(position.length / 3)].forEach(() => {
    normal.push(0.0, 1.0, 0.0);
  });

  const vertexOption = getVertexOption(position, vector);

  return {
    // position,
    position: vertexOption.afterPosition,
    normal: new Float32Array(normal),
    color: new Float32Array(color),
    origin: new Float32Array(vertexOption.origin),
    vectors: new Float32Array(vertexOption.vectors),
    start: new Float32Array(vertexOption.start),
    end: new Float32Array(vertexOption.end),
    afterPosition: vertexOption.afterPosition,
    indices,
    texCoord: st,
  };
};
