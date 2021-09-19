import MedianCut from 'mediancut';
import { Taxis } from 'taxis';
import { mat4 } from 'gl-matrix';
import { get } from 'svelte/store';
import {
  createProgram,
  createShaderObject,
  createVBO,
  createIBO,
  createTexture,
  enableAttribute,
} from 'shared/lib/src/utils';
import { Camera } from 'shared/lib/src/camera';
import { axis, box as boxGeometry, boxLine as boxLineGeometry, plane, Geometry } from 'shared/lib/src/geometry';
import {
  fragment,
  vertex,
  attribute,
  uniform,
  uniLocation,
  subFragment,
  subVertex,
  subAttribute,
  subUniform,
  subUniLocation,
} from '../shader/shader';
import { app } from '../../../stores/app';
import { settings } from '../../../stores/settings';
import { steps } from '../../../stores/steps';

const CANVAS_SIZE = 128;
const DISPLAY_TEXTURE_SIZE = 1.0;
const HALF_DISPLAY_TEXTURE_SIZE = DISPLAY_TEXTURE_SIZE / 2;
const CAMARA_DISTANCE = 7.5;
let BEFORE_TEXTURE_POSITION = [-1.5, 0.0, 0.0];
let AFTER_TEXTURE_POSITION = [1.5, 0.0, 0.0];
let BOXES_POSITION = [0.0, 0.0, 0.0];

// TODO: 検討
let currentBucket = 0;
let paintedBucket = -1;
let imageData = null;
let medianCut;
let reduceImageData;
let bucketsPerStep;
let beforeTexture;
let afterTexture;

export class Scene {
  canvas: HTMLCanvasElement;
  gl: WebGLRenderingContext;
  programMain: WebGLProgram = null;
  programSub: WebGLProgram = null;
  pMatrix: mat4 = mat4.create();
  vMatrix: mat4 = mat4.create();
  vpMatrix: mat4 = mat4.create();
  attLocation: GLint[] = [];
  attStride: number[] = [];
  uniLocation: {
    [key: string]: WebGLUniformLocation;
  } = uniLocation;
  attLocationSub: GLint[] = [];
  attStrideSub: number[] = [];
  uniLocationSub: {
    [key: string]: WebGLUniformLocation;
  } = subUniLocation;
  taxis: Taxis;
  camera: Camera;
  // model系
  // 減色前のテクスチャ
  beforeImage: {
    geometry: Geometry;
    VBO: WebGLBuffer[];
    IBO: WebGLBuffer;
  } = {
    geometry: null,
    VBO: [],
    IBO: [],
  };
  // 減色後のテクスチャ
  afterImage: {
    geometry: Geometry;
    VBO: WebGLBuffer[];
    IBO: WebGLBuffer;
  } = {
    geometry: null,
    VBO: [],
    IBO: [],
  };
  // buckets
  boxes = [];
  boxesPosition = [];
  boxesVBO = [];
  boxesIBO = [];
  boxesLine = [];
  boxesLineVBO = [];
  // points
  pointsFromPosition = [];
  pointsToPosition = [];
  pointsColor = [];
  pointsVBO = [];
  afterPointsFromPosition = [];
  afterPointsToPosition = [];
  afterPointsColor = [];
  afterPointsVBO = [];
  // axis
  axis;
  axisVBO;

  constructor() {}

  init(canvas: HTMLCanvasElement, timeline: HTMLElement) {
    // Taxisの設定
    this.taxis = new Taxis({
      timeline: {
        container: timeline,
        debug: false,
      },
    });

    this.taxis.add('Sampling', 3 * 1000);
    for (let i = 0; i < get(settings).bucketsCount; i++) {
      if (i === 0) {
        this.taxis.add(`split#${i}`, 0.5 * 1000, 500);
      } else {
        this.taxis.add(`split#${i}`, 0.5 * 1000);
      }
    }
    for (let i = 0; i < get(settings).bucketsCount; i++) {
      this.taxis.add(`Average color#${i}`, 0.5 * 1000);
    }
    this.taxis.add('Mapping', 3 * 1000, 500);

    this.canvas = canvas;
    this.gl = canvas.getContext(`webgl`);
    this.camera = new Camera(canvas, {
      position: {
        direction: [0.0, 0.0, 1.0],
        distance: CAMARA_DISTANCE,
      },
    });

    // 画像の減色
    {
      const image = get(app).file;
      const canvas = document.createElement('canvas');
      canvas.width = CANVAS_SIZE;
      canvas.height = CANVAS_SIZE;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(image, 0, 0, image.width, image.height, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
      imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // 圧縮処理のbucketsを取得
      medianCut = new MedianCut(imageData, { strict: true });

      reduceImageData = medianCut.reduce(get(settings).bucketsCount);
      bucketsPerStep = medianCut.bucketsPerStep;

      beforeTexture = createTexture(this.gl, image, this.gl.TEXTURE0);
      afterTexture = createTexture(this.gl, reduceImageData, this.gl.TEXTURE1);
    }

    // resize
    this.addResizeEvent();
    this.resizeCanvas();

    // programオブジェクトの設定
    this.programMain = this.setupProgram(vertex, fragment);
    this.programSub = this.setupProgram(subVertex, subFragment);
    this.gl.useProgram(this.programMain);

    this.setupBeforeTexture();
    this.setupAfterTexture();
    this.setupPointGeometry();
    this.setupAfterPointGeometry();
    this.setupBoxesGeometry();
    this.setupAxisGeometry();
    this.setupLocation();
    this.setupLocationSub();

    this.render();
  }

  /**
   * Stop ticker
   */
  destroy() {
    this.taxis.reset();
  }

  setupProgram(v, f) {
    const mainVs = createShaderObject(this.gl, v, this.gl.VERTEX_SHADER);
    const mainFs = createShaderObject(this.gl, f, this.gl.FRAGMENT_SHADER);
    return createProgram(this.gl, mainVs, mainFs);
  }

  addResizeEvent() {
    this.resizeCanvas();
    window.addEventListener('resize', this.resizeCanvas.bind(this), { passive: true });
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    // TODO: mobile
    if (window.innerWidth < window.innerHeight) {
      this.camera.distance = (1000 / window.innerHeight) * CAMARA_DISTANCE;
      BEFORE_TEXTURE_POSITION = [0.0, 1.5, 0.0];
      AFTER_TEXTURE_POSITION = [0.0, -1.5, 0.0];
      BOXES_POSITION = [0.0, 0.0, 0.0];
    } else {
      this.camera.distance = (900 / window.innerWidth) * CAMARA_DISTANCE;
      BEFORE_TEXTURE_POSITION = [-1.5, 0.0, 0.0];
      AFTER_TEXTURE_POSITION = [1.5, 0.0, 0.0];
      BOXES_POSITION = [0.0, 0.0, 0.0];
    }
  }

  setupLocation() {
    attribute.forEach((v, i) => {
      this.attLocation[i] = this.gl.getAttribLocation(this.programMain, v.variable);
      this.attStride[i] = v.attStride;
    });
    Object.keys(this.uniLocation).forEach((uniform) => {
      this.uniLocation[uniform] = this.gl.getUniformLocation(this.programMain, uniform);
    });
  }

  setupLocationSub() {
    subAttribute.forEach((v, i) => {
      this.attLocationSub[i] = this.gl.getAttribLocation(this.programSub, v.variable);
      this.attStrideSub[i] = v.attStride;
    });
    Object.keys(this.uniLocationSub).forEach((uniform) => {
      this.uniLocationSub[uniform] = this.gl.getUniformLocation(this.programSub, uniform);
    });
  }

  setupRendering() {
    // clear処理
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.gl.clearColor(0.1, 0.12, 0.14, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    // 震度テストを有効に
    this.gl.enable(this.gl.DEPTH_TEST);
    // 裏面も表示
    this.gl.disable(this.gl.CULL_FACE);
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFuncSeparate(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA, this.gl.ONE, this.gl.ONE); // アルファブレンディング

    mat4.invert(this.vMatrix, this.camera.update());
    mat4.perspective(this.pMatrix, 45, this.canvas.width / this.canvas.height, 0.1, 20.0);
    mat4.multiply(this.vpMatrix, this.pMatrix, this.vMatrix);
  }

  setupBeforeTexture() {
    this.beforeImage.geometry = plane(DISPLAY_TEXTURE_SIZE, DISPLAY_TEXTURE_SIZE, 0, [1.0, 0.1, 0.0, 1.0]);
    this.beforeImage.VBO = [
      createVBO(this.gl, this.beforeImage.geometry.position),
      createVBO(this.gl, this.beforeImage.geometry.color),
      createVBO(this.gl, this.beforeImage.geometry.texCoord),
    ];
    // インデックスバッファを生成
    this.beforeImage.IBO = createIBO(this.gl, this.beforeImage.geometry.indices);
  }

  setupAfterTexture() {
    this.afterImage.geometry = plane(DISPLAY_TEXTURE_SIZE, DISPLAY_TEXTURE_SIZE, 0, [1.0, 0.1, 0.0, 1.0]);
    this.afterImage.VBO = [
      createVBO(this.gl, this.afterImage.geometry.position),
      createVBO(this.gl, this.afterImage.geometry.color),
      createVBO(this.gl, this.afterImage.geometry.texCoord),
    ];
    // インデックスバッファを生成
    this.afterImage.IBO = createIBO(this.gl, this.afterImage.geometry.indices);
  }

  setupPointGeometry() {
    const len = imageData.data.length / 4;
    for (let i = 0; i < len; i++) {
      const r = imageData.data[i * 4];
      const g = imageData.data[i * 4 + 1];
      const b = imageData.data[i * 4 + 2];
      const a = imageData.data[i * 4 + 3];

      // 画像のst座標的なもの
      const index = i;
      const x = index % imageData.width;
      const y = Math.floor(index / imageData.width);

      this.pointsFromPosition.push(
        x / CANVAS_SIZE - HALF_DISPLAY_TEXTURE_SIZE + BEFORE_TEXTURE_POSITION[0],
        (y / CANVAS_SIZE - HALF_DISPLAY_TEXTURE_SIZE) * -1 + BEFORE_TEXTURE_POSITION[1],
        BEFORE_TEXTURE_POSITION[2],
      );
      this.pointsToPosition.push(
        r / 255 - HALF_DISPLAY_TEXTURE_SIZE + BOXES_POSITION[0],
        g / 255 - HALF_DISPLAY_TEXTURE_SIZE + BOXES_POSITION[1],
        b / 255 - HALF_DISPLAY_TEXTURE_SIZE + BOXES_POSITION[2],
      );
      this.pointsColor.push(r / 255, g / 255, b / 255, a / 255);
    }
    this.pointsVBO = [
      createVBO(this.gl, this.pointsFromPosition),
      createVBO(this.gl, this.pointsToPosition),
      createVBO(this.gl, this.pointsColor),
    ];
  }

  setupAfterPointGeometry() {
    const len = imageData.data.length / 4;
    for (let i = 0; i < len; i++) {
      const r = imageData.data[i * 4];
      const g = imageData.data[i * 4 + 1];
      const b = imageData.data[i * 4 + 2];
      const a = imageData.data[i * 4 + 3];

      // 画像のst座標的なもの
      const index = i;
      const x = index % imageData.width;
      const y = Math.floor(index / imageData.width);

      this.afterPointsFromPosition.push(
        r / 255 - HALF_DISPLAY_TEXTURE_SIZE + BOXES_POSITION[0],
        g / 255 - HALF_DISPLAY_TEXTURE_SIZE + BOXES_POSITION[1],
        b / 255 - HALF_DISPLAY_TEXTURE_SIZE + BOXES_POSITION[2],
      );
      this.afterPointsToPosition.push(
        x / CANVAS_SIZE - HALF_DISPLAY_TEXTURE_SIZE + AFTER_TEXTURE_POSITION[0],
        (y / CANVAS_SIZE - HALF_DISPLAY_TEXTURE_SIZE) * -1 + AFTER_TEXTURE_POSITION[1],
        AFTER_TEXTURE_POSITION[2],
      );

      const reduceR = reduceImageData.data[i * 4];
      const reduceG = reduceImageData.data[i * 4 + 1];
      const reduceB = reduceImageData.data[i * 4 + 2];
      const reduceA = reduceImageData.data[i * 4 + 3];
      this.afterPointsColor.push(reduceR / 255, reduceG / 255, reduceB / 255, reduceA / 255);
    }
    this.afterPointsVBO = [
      createVBO(this.gl, this.afterPointsFromPosition),
      createVBO(this.gl, this.afterPointsToPosition),
      createVBO(this.gl, this.afterPointsColor),
    ];
  }

  /**
   *
   */
  setupBoxesGeometry() {
    bucketsPerStep.forEach((bucketList, i) => {
      this.boxes[i] = [];
      this.boxesPosition[i] = [];
      this.boxesVBO[i] = [];
      this.boxesIBO[i] = [];
      this.boxesLine[i] = [];
      this.boxesLineVBO[i] = [];
      bucketList.forEach((bucket, j) => {
        const { total, colors, channel, minR, minG, minB, maxR, maxG, maxB } = bucketsPerStep[i][j];
        const width = (maxR - minR) / 255;
        const height = (maxG - minG) / 255;
        const depth = (maxB - minB) / 255;
        const color = MedianCut.averageColor(colors);

        const box = boxGeometry(width, height, depth, [color[0] / 255, color[1] / 255, color[2] / 255, 0.8]);

        const boxLine = boxLineGeometry(width, height, depth, [0.65, 0.65, 0.65, 1.0]);

        // boxの枠線を作る
        this.boxesLine[i][j] = boxLine;
        this.boxesLineVBO[i][j] = [createVBO(this.gl, boxLine.position), createVBO(this.gl, boxLine.color)];

        this.boxes[i][j] = box;

        this.boxesPosition[i][j] = [
          minR / 255 - (1 - width) / 2,
          minG / 255 - (1 - height) / 2,
          minB / 255 - (1 - depth) / 2,
        ];
        this.boxesVBO[i][j] = [createVBO(this.gl, box.position), createVBO(this.gl, box.color)];
        // インデックスバッファを生成
        this.boxesIBO[i][j] = createIBO(this.gl, box.indices);
      });
    });
  }

  setupAxisGeometry() {
    this.axis = axis(10, [0.45, 0.45, 0.45, 1.0]);
    this.axisVBO = [createVBO(this.gl, this.axis.position), createVBO(this.gl, this.axis.color)];
  }

  setupMvp(position) {
    let mMatrix = mat4.create();
    mat4.translate(mMatrix, mMatrix, position);
    const mvpMatrix = mat4.create();
    mat4.multiply(mvpMatrix, this.vpMatrix, mMatrix);
    this.gl.uniformMatrix4fv(this.uniLocation.mvpMatrix, false, mvpMatrix);
  }

  /**
   *
   * @param position
   */
  setupMvpSub(position) {
    let mMatrix = mat4.create();
    mat4.translate(mMatrix, mMatrix, position);

    this.gl.uniformMatrix4fv(this.uniLocationSub.mMatrix, false, mMatrix);

    const mvpMatrix = mat4.create();
    mat4.multiply(mvpMatrix, this.vpMatrix, mMatrix);
    this.gl.uniformMatrix4fv(this.uniLocationSub.mvpMatrix, false, mvpMatrix);
  }

  renderBeforeTexture(position) {
    enableAttribute(this.gl, this.beforeImage.VBO, this.attLocation, this.attStride);
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.beforeImage.IBO);

    // テクスチャを使うかどうかのフラグをシェーダに送る @@@
    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, beforeTexture);
    this.gl.uniform1i(this.uniLocation.textureUnit, 0);
    this.gl.uniform1i(this.uniLocation.isTexture, 1);

    this.gl.enableVertexAttribArray(this.attLocation[2]);

    this.setupMvp(position);

    this.gl.drawElements(this.gl.TRIANGLES, this.beforeImage.geometry.indices.length, this.gl.UNSIGNED_SHORT, 0);
  }

  /**
   *
   * @param position
   */
  renderBoxes(position) {
    this.gl.disableVertexAttribArray(this.attLocation[2]);
    this.gl.uniform1i(this.uniLocation.isTexture, 0);

    const lastIndex = this.boxes.length - 1;

    for (let i = 0; i <= paintedBucket; i++) {
      enableAttribute(this.gl, this.boxesVBO[lastIndex][i], this.attLocation, this.attStride);
      this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.boxesIBO[lastIndex][i]);

      const pos = [
        position[0] + this.boxesPosition[lastIndex][i][0],
        position[1] + this.boxesPosition[lastIndex][i][1],
        position[2] + this.boxesPosition[lastIndex][i][2],
      ];
      this.setupMvp(pos);

      this.gl.drawElements(this.gl.TRIANGLES, this.boxes[lastIndex][i].indices.length, this.gl.UNSIGNED_SHORT, 0);
    }
  }

  renderBoxesLine(position) {
    this.gl.disableVertexAttribArray(this.attLocation[2]);
    // テクスチャを使うかどうかのフラグをシェーダに送る @@@
    this.gl.uniform1i(this.uniLocation.isTexture, 0);

    for (let i = 0; i < this.boxes[currentBucket].length; i++) {
      enableAttribute(this.gl, this.boxesLineVBO[currentBucket][i], this.attLocation, this.attStride);

      const pos = [
        position[0] + this.boxesPosition[currentBucket][i][0],
        position[1] + this.boxesPosition[currentBucket][i][1],
        position[2] + this.boxesPosition[currentBucket][i][2],
      ];
      this.setupMvp(pos);

      this.gl.drawArrays(this.gl.LINES, 0, this.boxesLine[currentBucket][i].position.length / 3);
    }
  }

  renderAxis(position) {
    this.gl.uniform1i(this.uniLocation.isTexture, 0);

    this.gl.disableVertexAttribArray(this.attLocation[2]);

    enableAttribute(this.gl, this.axisVBO, this.attLocation, this.attStride);

    this.setupMvp(position);

    this.gl.drawArrays(this.gl.LINES, 0, this.axis.position.length / 3);
  }

  /**
   *
   * @param position
   */
  renderMovePoints(position) {
    const axis = this.taxis.getAxis({ key: 'Sampling' });
    this.gl.uniform1f(this.uniLocationSub.interporation, axis.progress);

    enableAttribute(this.gl, this.pointsVBO, this.attLocationSub, this.attStrideSub);

    this.setupMvpSub(position);

    this.gl.drawArrays(this.gl.POINTS, 0, this.pointsToPosition.length / 3);
  }

  renderMoveAfterPoints(position) {
    const axis = this.taxis.getAxis({ key: 'Mapping' });
    if (axis.progress === 0) {
      return;
    }
    this.gl.uniform1f(this.uniLocationSub.interporation, axis.progress);

    enableAttribute(this.gl, this.afterPointsVBO, this.attLocationSub, this.attStrideSub);

    this.setupMvpSub(position);

    this.gl.drawArrays(this.gl.POINTS, 0, this.afterPointsToPosition.length / 3);
  }

  /**
   * render処理
   */
  render() {
    this.taxis.begin();

    this.taxis.ticker((delta, axes) => {
      let currentStep = 0;
      if (axes.get('Sampling').pass) {
        currentStep = 1;
      }
      if (axes.get('split#7').pass) {
        currentStep = 2;
      }
      if (axes.get('Average color#7').pass) {
        currentStep = 3;
      }

      for (let i = 0; i < get(settings).bucketsCount; i++) {
        if (axes.get(`split#${i}`).enter) {
          if (currentBucket < i) {
            currentBucket = i;
          }
        }
        if (axes.get(`Average color#${i}`).enter) {
          if (paintedBucket < i) {
            paintedBucket = i;
          }
        }
        if (axes.get(`split#${i}`).progress <= 0) {
          if (i <= currentBucket) {
            currentBucket = i - 1;
          }
        }
        if (axes.get(`Average color#${i}`).progress <= 0) {
          if (i <= paintedBucket) {
            paintedBucket = i - 1;
          }
        }
      }
      steps.update(currentStep);

      this.setupRendering();

      // subの描画
      this.gl.useProgram(this.programSub);
      this.gl.uniform3fv(this.uniLocationSub.eyePosition, this.camera.position);
      this.renderMovePoints([0.0, 0.0, 0.0]);
      this.renderMoveAfterPoints([0.0, 0.0, 0.0]);

      // mainの描画
      this.gl.useProgram(this.programMain);
      this.renderAxis([0.0, 0.0, 0.0]);
      this.renderBeforeTexture(BEFORE_TEXTURE_POSITION);

      if (axes.get('split#0').enter) {
        this.renderBoxesLine(BOXES_POSITION);
        if (-1 < paintedBucket) {
          this.renderBoxes(BOXES_POSITION);
        }
      }
    });
  }
}
