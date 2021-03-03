import { WebGLUtility, WebGLMath, WebGLGeometry, WebGLOrbitCamera } from './webgl';
import MedianCut from 'mediancut';
import { Taxis } from 'taxis';
import { get } from 'svelte/store';
import { app } from '../../../stores/app';
import { settings } from '../../../stores/settings';
import { steps } from '../../../stores/steps';

const CANVAS_SIZE = 128;
const DISPLAY_TEXTURE_SIZE = 1.0;
const HALF_DISPLAY_TEXTURE_SIZE = DISPLAY_TEXTURE_SIZE / 2;
let BEFORE_TEXTURE_POSITION = [-1.5, 0.0, 0.0];
let AFTER_TEXTURE_POSITION = [1.5, 0.0, 0.0];
let BOXES_POSITION = [0.0, 0.0, 0.0];

export const setup = (canvas) => {
  const webgl = new WebGLUtility(); // WebGL API をまとめたユーティリティ
  // 時間軸の設定
  const taxis = new Taxis({
    container: document.querySelector('#timeline')
  });

  taxis.insert('Sampling', 3 * 1000);
  for (let i = 0; i < get(settings).bucketsCount; i++) {
    if (i === 0) {
      taxis.append(`split#${i}`, 0.5 * 1000, 500);
    } else {
      taxis.append(`split#${i}`, 0.5 * 1000);
    }
  }
  for (let i = 0; i < get(settings).bucketsCount; i++) {
    taxis.append(`Average color#${i}`, 0.5 * 1000);
  }
  taxis.append('Mapping', 3 * 1000, 500);

  let medianCut;
  let bucketsPerStep = [];
  let currentBucket = 0;

  let paintedBucket = -1;
  let boxesStep = false;

  // キャンバスのセットアップ
  webgl.initialize(canvas);

  // プログラムオブジェクト
  let programMain = null;
  let programSub = null;

  // 減色前のテクスチャ
  let beforeImage;
  let beforeImageVBO;
  let beforeImageIBO;
  // 減色後のテクスチャ
  let afterImage;
  let afterImageVBO;
  let afterImageIBO;
  // buckets
  let boxes = [];
  let boxesPosition = [];
  let boxesVBO = [];
  let boxesIBO = [];
  let boxesLine = [];
  let boxesLineVBO = [];
  // points
  let pointsFromPosition = [];
  let pointsToPosition = [];
  let pointsColor = [];
  let pointsVBO = [];
  let afterPointsFromPosition = [];
  let afterPointsToPosition = [];
  let afterPointsColor = [];
  let afterPointsVBO = [];
  // axis
  let axis;
  let axisVBO;

  let attLocation;
  let attStride;
  let uniLocation = null; // uniform location
  let attLocationSub;
  let attStrideSub;
  let uniLocationSub = null; // uniform location
  let beforeTexture = null; // テクスチャオブジェクト @@@
  let afterTexture = null; // テクスチャオブジェクト @@@
  let imageData;
  let reduceImageData;

  let vMatrix = null; // ビュー行列
  let pMatrix = null; // プロジェクション行列
  let vpMatrix = null; // ビュー x プロジェクション行列
  // カメラのセットアップ
  const cameraOption = {
    distance: 7.5,
    min: 1.0,
    max: 20.0,
    move: 2.0,
  };
  const camera = new WebGLOrbitCamera(canvas, cameraOption);

  webgl.width = window.innerWidth;
  webgl.height = window.innerHeight;
  updateSize();
  window.addEventListener('resize', updateSize);

  /**
   *
   */
  window.Promise.resolve()
    // .then(() => loadImage('./assets/512.png'))
    .then((image) => {
      // TODO: デバッグ？？？？
      

      
      image = get(app).file;
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

      // 画像がロードできたので、テクスチャオブジェクトを生成する
      beforeTexture = webgl.createTexture(image, webgl.gl.TEXTURE0);
      // 今回はテクスチャを途中で切り替えるわけではないので……
      // ユニット０に対してテクスチャをあらかじめバインドしておく
      // // TODO: 上のテクスチャと共に関数か
      afterTexture = webgl.createTexture(reduceImageData, webgl.gl.TEXTURE1);
      // 今回はテクスチャを途中で切り替えるわけではないので……
      // ユニット０に対してテクスチャをあらかじめバインドしておく
    })
    .then(() =>
      window.Promise.all([
        WebGLUtility.loadFile('./shader/main.vert'),
        WebGLUtility.loadFile('./shader/main.frag'),
        WebGLUtility.loadFile('./shader/sub.vert'),
        WebGLUtility.loadFile('./shader/sub.frag'),
      ]),
    )
    .then((ress) => {
      // shaderをprogram紐付ける
      const [mainVert, mainFrag, subVert, subFrag] = ress;
      const mainVs = webgl.createShaderObject(mainVert, webgl.gl.VERTEX_SHADER);
      const mainFs = webgl.createShaderObject(mainFrag, webgl.gl.FRAGMENT_SHADER);
      programMain = webgl.createProgramObject(mainVs, mainFs);
      const subVs = webgl.createShaderObject(subVert, webgl.gl.VERTEX_SHADER);
      const subFs = webgl.createShaderObject(subFrag, webgl.gl.FRAGMENT_SHADER);
      programSub = webgl.createProgramObject(subVs, subFs);
      webgl.program = programMain;

      const gl = webgl.gl;
      // 震度テストを有効に
      gl.enable(gl.DEPTH_TEST);
      // 裏面も表示
      gl.disable(gl.CULL_FACE);
      gl.enable(gl.BLEND);
      gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE); // アルファブレンディング

      setupBeforeTexture();
      setupAfterTexture();
      setupPointGeometry();
      setupAfterPointGeometry();
      setupBoxesGeometry();
      setupAxisGeometry();
      setupLocation();
      setupLocationSub();

      taxis.begin();

      render();
    });

  function updateSize() {
    webgl.width = window.innerWidth;
    webgl.height = window.innerHeight;

    // TODO: スマホ
    if (window.innerWidth < window.innerHeight) {
      camera.distance = 1000 / window.innerHeight * cameraOption.distance;
      BEFORE_TEXTURE_POSITION = [0.0, 1.5, 0.0];
      AFTER_TEXTURE_POSITION = [0.0, -1.5, 0.0];
      BOXES_POSITION = [0.0, 0.0, 0.0];
    } else {
      camera.distance = 900 / window.innerWidth * cameraOption.distance;
      BEFORE_TEXTURE_POSITION = [-1.5, 0.0, 0.0];
      AFTER_TEXTURE_POSITION = [1.5, 0.0, 0.0];
      BOXES_POSITION = [0.0, 0.0, 0.0];
    }
  }

  /**
   *
   */
  function setupBeforeTexture() {
    beforeImage = WebGLGeometry.plane(DISPLAY_TEXTURE_SIZE, DISPLAY_TEXTURE_SIZE, 0, [1.0, 0.1, 0.0, 1.0]);
    beforeImageVBO = [
      webgl.createVBO(beforeImage.position),
      webgl.createVBO(beforeImage.color),
      webgl.createVBO(beforeImage.texCoord), // テクスチャ座標 @@@
    ];
    // インデックスバッファを生成
    beforeImageIBO = webgl.createIBO(beforeImage.index);
  }

  /**
   *
   */
  function setupAfterTexture() {
    afterImage = WebGLGeometry.plane(DISPLAY_TEXTURE_SIZE, DISPLAY_TEXTURE_SIZE, 0, [1.0, 0.1, 0.0, 1.0]);
    afterImageVBO = [
      webgl.createVBO(afterImage.position),
      webgl.createVBO(afterImage.color),
      webgl.createVBO(afterImage.texCoord), // テクスチャ座標 @@@
    ];
    // インデックスバッファを生成
    afterImageIBO = webgl.createIBO(afterImage.index);
  }

  /**
   *
   */
  function setupPointGeometry() {
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

      pointsFromPosition.push(
        x / CANVAS_SIZE - HALF_DISPLAY_TEXTURE_SIZE + BEFORE_TEXTURE_POSITION[0],
        (y / CANVAS_SIZE - HALF_DISPLAY_TEXTURE_SIZE) * -1 + BEFORE_TEXTURE_POSITION[1],
        BEFORE_TEXTURE_POSITION[2],
      );
      pointsToPosition.push(
        r / 255 - HALF_DISPLAY_TEXTURE_SIZE + BOXES_POSITION[0],
        g / 255 - HALF_DISPLAY_TEXTURE_SIZE + BOXES_POSITION[1],
        b / 255 - HALF_DISPLAY_TEXTURE_SIZE + BOXES_POSITION[2],
      );
      pointsColor.push(r / 255, g / 255, b / 255, a / 255);
    }
    pointsVBO = [webgl.createVBO(pointsFromPosition), webgl.createVBO(pointsToPosition), webgl.createVBO(pointsColor)];
  }

  function setupAfterPointGeometry() {
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

      afterPointsFromPosition.push(
        r / 255 - HALF_DISPLAY_TEXTURE_SIZE + BOXES_POSITION[0],
        g / 255 - HALF_DISPLAY_TEXTURE_SIZE + BOXES_POSITION[1],
        b / 255 - HALF_DISPLAY_TEXTURE_SIZE + BOXES_POSITION[2],
      );
      afterPointsToPosition.push(
        x / CANVAS_SIZE - HALF_DISPLAY_TEXTURE_SIZE + AFTER_TEXTURE_POSITION[0],
        (y / CANVAS_SIZE - HALF_DISPLAY_TEXTURE_SIZE) * -1 + AFTER_TEXTURE_POSITION[1],
        AFTER_TEXTURE_POSITION[2],
      );

      const reduceR = reduceImageData.data[i * 4];
      const reduceG = reduceImageData.data[i * 4 + 1];
      const reduceB = reduceImageData.data[i * 4 + 2];
      const reduceA = reduceImageData.data[i * 4 + 3];
      afterPointsColor.push(reduceR / 255, reduceG / 255, reduceB / 255, reduceA / 255);
    }
    afterPointsVBO = [webgl.createVBO(afterPointsFromPosition), webgl.createVBO(afterPointsToPosition), webgl.createVBO(afterPointsColor)];
  }

  /**
   *
   */
  function setupBoxesGeometry() {
    bucketsPerStep.forEach((bucketList, i) => {
      boxes[i] = [];
      boxesPosition[i] = [];
      boxesVBO[i] = [];
      boxesIBO[i] = [];
      boxesLine[i] = [];
      boxesLineVBO[i] = [];
      bucketList.forEach((bucket, j) => {
        const { total, colors, channel, minR, minG, minB, maxR, maxG, maxB } = bucketsPerStep[i][j];
        const width = (maxR - minR) / 255;
        const height = (maxG - minG) / 255;
        const depth = (maxB - minB) / 255;
        const color = MedianCut.averageColor(colors);

        const box = WebGLGeometry.box(width, height, depth, [color[0] / 255, color[1] / 255, color[2] / 255, 0.8]);

        const boxLine = WebGLGeometry.boxLine(width, height, depth, [0.65, 0.65, 0.65, 1.0]);

        // boxの枠線を作る
        boxesLine[i][j] = boxLine;
        boxesLineVBO[i][j] = [webgl.createVBO(boxLine.position), webgl.createVBO(boxLine.color)];

        boxes[i][j] = box;

        boxesPosition[i][j] = [
          minR / 255 - (1 - width) / 2,
          minG / 255 - (1 - height) / 2,
          minB / 255 - (1 - depth) / 2,
        ];
        boxesVBO[i][j] = [webgl.createVBO(box.position), webgl.createVBO(box.color)];
        // インデックスバッファを生成
        boxesIBO[i][j] = webgl.createIBO(box.index);
      });
    });
  }

  function setupAxisGeometry() {
    axis = WebGLGeometry.axis(10, [0.45, 0.45, 0.45, 1.0]);
    axisVBO = [webgl.createVBO(axis.position), webgl.createVBO(axis.color)];
  }

  /**
   *
   */
  function setupLocation() {
    const gl = webgl.gl;
    webgl.program = programMain;
    // attribute location の取得と有効化
    attLocation = [
      gl.getAttribLocation(webgl.program, 'position'),
      gl.getAttribLocation(webgl.program, 'color'),
      gl.getAttribLocation(webgl.program, 'texCoord'), // テクスチャ座標 @@@
    ];
    attStride = [3, 4, 2];

    uniLocation = {
      mvpMatrix: gl.getUniformLocation(webgl.program, 'mvpMatrix'),
      textureUnit: gl.getUniformLocation(webgl.program, 'textureUnit'),
      isTexture: gl.getUniformLocation(webgl.program, 'isTexture'),
    };
  }

  /**
   *
   */
  function setupLocationSub() {
    const gl = webgl.gl;
    webgl.program = programSub;
    // attribute location の取得と有効化
    attLocationSub = [
      gl.getAttribLocation(webgl.program, 'fromPosition'),
      gl.getAttribLocation(webgl.program, 'toPosition'),
      gl.getAttribLocation(webgl.program, 'color'),
    ];
    attStrideSub = [3, 3, 4];

    uniLocationSub = {
      mMatrix: gl.getUniformLocation(webgl.program, 'mMatrix'),
      mvpMatrix: gl.getUniformLocation(webgl.program, 'mvpMatrix'),
      interporation: gl.getUniformLocation(webgl.program, 'interporation'),
      eyePosition: gl.getUniformLocation(webgl.program, 'eyePosition'),
    };
  }

  /**
   * レンダリングのためのセットアップを行う
   */
  function setupRendering() {
    const gl = webgl.gl;
    // clear処理
    gl.viewport(0, 0, webgl.width, webgl.height);
    gl.clearColor(0.1, 0.12, 0.14, 1.0);

    gl.clear(gl.COLOR_BUFFER_BIT);

    // カメラの状態に応じたビュー行列を生成 @@@
    vMatrix = camera.update();
    // プロジェクション行列を生成
    const fovy = 45;
    const aspect = webgl.width / webgl.height;
    const near = 0.1;
    const far = 20.0;
    pMatrix = WebGLMath.mat4.perspective(fovy, aspect, near, far);
    vpMatrix = WebGLMath.mat4.multiply(pMatrix, vMatrix);
  }

  /**
   *
   * @param position
   */
  function setupMvp(position) {
    const gl = webgl.gl;
    // モデル行列を生成する
    let mMatrix = WebGLMath.mat4.identity(WebGLMath.mat4.create());
    mMatrix = WebGLMath.mat4.translate(mMatrix, position);
    // mvp 行列を生成してシェーダに送る
    const mvpMatrix = WebGLMath.mat4.multiply(vpMatrix, mMatrix);
    gl.uniformMatrix4fv(uniLocation.mvpMatrix, false, mvpMatrix);
  }

  /**
   *
   * @param position
   */
  function setupMvpSub(position) {
    const gl = webgl.gl;
    // モデル行列を生成する
    let mMatrix = WebGLMath.mat4.identity(WebGLMath.mat4.create());
    mMatrix = WebGLMath.mat4.translate(mMatrix, position);

    gl.uniformMatrix4fv(uniLocationSub.mMatrix, false, mMatrix);

    // mvp 行列を生成してシェーダに送る
    const mvpMatrix = WebGLMath.mat4.multiply(vpMatrix, mMatrix);
    gl.uniformMatrix4fv(uniLocationSub.mvpMatrix, false, mvpMatrix);
  }

  /**
   *
   * @param position
   */
  function renderBeforeTexture(position) {
    const gl = webgl.gl;

    webgl.enableAttribute(beforeImageVBO, attLocation, attStride);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, beforeImageIBO);

    // テクスチャを使うかどうかのフラグをシェーダに送る @@@
    gl.activeTexture(webgl.gl.TEXTURE0);
    gl.bindTexture(webgl.gl.TEXTURE_2D, beforeTexture);
    gl.uniform1i(uniLocation.textureUnit, 0);
    gl.uniform1i(uniLocation.isTexture, 1);

    gl.enableVertexAttribArray(attLocation[2]);

    setupMvp(position);

    gl.drawElements(gl.TRIANGLES, beforeImage.index.length, gl.UNSIGNED_SHORT, 0);
  }

  /**
   *
   * @param position
   */
  function renderAfterTexture(position) {
    const gl = webgl.gl;

    const axis = taxis.getAxis({ key: 'Mapping' });
    if (axis.progress !== 1) {
      return;
    }

    webgl.enableAttribute(afterImageVBO, attLocation, attStride);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, afterImageIBO);

    // テクスチャを使うかどうかのフラグをシェーダに送る @@@
    webgl.gl.activeTexture(webgl.gl.TEXTURE1);
    webgl.gl.bindTexture(webgl.gl.TEXTURE_2D, afterTexture);
    gl.uniform1i(uniLocation.textureUnit, 1);
    gl.uniform1i(uniLocation.isTexture, 1);

    gl.enableVertexAttribArray(attLocation[2]);

    setupMvp(position);

    gl.drawElements(gl.TRIANGLES, afterImage.index.length, gl.UNSIGNED_SHORT, 0);
  }

  /**
   *
   * @param position
   */
  function renderBoxes(position) {
    const gl = webgl.gl;
    gl.disableVertexAttribArray(attLocation[2]);
    // テクスチャを使うかどうかのフラグをシェーダに送る @@@
    gl.uniform1i(uniLocation.isTexture, 0);

    const lastIndex = boxes.length - 1;

    for (let i = 0; i <= paintedBucket; i++) {
      webgl.enableAttribute(boxesVBO[lastIndex][i], attLocation, attStride);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, boxesIBO[lastIndex][i]);

      const pos = [
        position[0] + boxesPosition[lastIndex][i][0],
        position[1] + boxesPosition[lastIndex][i][1],
        position[2] + boxesPosition[lastIndex][i][2],
      ];
      setupMvp(pos);

      gl.drawElements(gl.TRIANGLES, boxes[lastIndex][i].index.length, gl.UNSIGNED_SHORT, 0);
    }
  }

  function renderBoxesLine(position) {
    const gl = webgl.gl;
    gl.disableVertexAttribArray(attLocation[2]);
    // テクスチャを使うかどうかのフラグをシェーダに送る @@@
    gl.uniform1i(uniLocation.isTexture, 0);

    for (let i = 0; i < boxes[currentBucket].length; i++) {
      webgl.enableAttribute(boxesLineVBO[currentBucket][i], attLocation, attStride);

      const pos = [
        position[0] + boxesPosition[currentBucket][i][0],
        position[1] + boxesPosition[currentBucket][i][1],
        position[2] + boxesPosition[currentBucket][i][2],
      ];
      setupMvp(pos);

      gl.drawArrays(gl.LINES, 0, boxesLine[currentBucket][i].position.length / 3);
    }
  }

  function renderAxis() {
    const gl = webgl.gl;
    gl.uniform1i(uniLocation.isTexture, 0);

    gl.disableVertexAttribArray(attLocation[2]);

    webgl.enableAttribute(axisVBO, attLocation, attStride);

    setupMvp([0.0, 0.0, 0.0]);

    gl.drawArrays(gl.LINES, 0, axis.position.length / 3);
  }

  /**
   *
   * @param position
   */
  function renderMovePoints(position) {
    const gl = webgl.gl;

    const axis = taxis.getAxis({ key: 'Sampling' });
    gl.uniform1f(uniLocationSub.interporation, axis.progress);

    webgl.enableAttribute(pointsVBO, attLocationSub, attStrideSub);

    setupMvpSub(position);

    gl.drawArrays(gl.POINTS, 0, pointsToPosition.length / 3);
  }

  function renderMoveAfterPoints(position) {
    const gl = webgl.gl;

    const axis = taxis.getAxis({ key: 'Mapping' });
    if (axis.progress === 0) {
      return;
    }
    gl.uniform1f(uniLocationSub.interporation, axis.progress);

    webgl.enableAttribute(afterPointsVBO, attLocationSub, attStrideSub);

    setupMvpSub(position);

    gl.drawArrays(gl.POINTS, 0, afterPointsToPosition.length / 3);
  }

  /**
   *
   */
  function render() {
    const gl = webgl.gl;
    let currentStep = 0;
    // TODO: 何度もticketAddされちゃうのを修正
    taxis.ticker((delta, axes) => {
      if (taxis.entered('split#0')) {
        boxesStep = true;
        currentStep = 1;
      }
      if (taxis.left('split#0')) {
        boxesStep = false;
        currentStep = 0;
      }
      if (taxis.entered(`Average color#0`)) {
        currentStep = 2;
      }
      if (taxis.left(`Average color#0`)) {
        currentStep = 1;
      }
      if (taxis.entered(`Mapping`)) {
        currentStep = 3;
      }

      for (let i = 0; i < get(settings).bucketsCount; i++) {
        if (taxis.entered(`split#${i}`)) {
          if (currentBucket < i) {
            currentBucket = i;
          }
        }
        if (taxis.entered(`Average color#${i}`)) {
          if (paintedBucket < i) {
            paintedBucket = i;
          }
        }
        if (taxis.left(`split#${i}`)) {
          if (i <= currentBucket) {
            currentBucket = i - 1;
          }
        }
        if (taxis.left(`Average color#${i}`)) {
          if (i <= paintedBucket) {
            paintedBucket = i - 1;
          }
        }
      }
      steps.update(currentStep)

      // レンダリング時のクリア処理など
      setupRendering();

      // subの描画
      webgl.program = programSub;
      gl.uniform3fv(uniLocationSub.eyePosition, camera.position);
      renderMovePoints([0.0, 0.0, 0.0]);
      renderMoveAfterPoints([0.0, 0.0, 0.0]);

      // mainの描画
      webgl.program = programMain;
      renderAxis([0.0, 0.0, 0.0]);
      renderBeforeTexture(BEFORE_TEXTURE_POSITION);
      // renderAfterTexture(AFTER_TEXTURE_POSITION);

      if (boxesStep) {
        renderBoxesLine(BOXES_POSITION);
        if (-1 < paintedBucket) {
          renderBoxes(BOXES_POSITION);
        }
      }
    });

  }
};
