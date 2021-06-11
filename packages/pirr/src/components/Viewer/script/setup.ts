import { WebGLUtility, WebGLMath, WebGLGeometry, WebGLOrbitCamera } from './webgl';
import { Taxis } from 'taxis';
import { get } from 'svelte/store';
import { settings } from '../../../stores/settings';
// import { createProgram, createShaderObject, enableAttribute } from '../../../utils';
import * as geometry from 'shared/lib/geometry';
import { createProgram, createShaderObject, enableAttribute } from 'shared/lib/utils';

export const setup = (canvas) => {
  const webgl = new WebGLUtility(); // WebGL API をまとめたユーティリティ
  const taxis = new Taxis();

  // キャンバスのセットアップ
  webgl.initialize(canvas);

  // プログラムオブジェクト
  let programMain = null;

  // axis
  let axis;
  let axisVBO;
  let circle: any = {};
  let circleVBO;
  let rectangle: any = {};
  let rectangleVBO;

  let attLocation: GLint[];
  let attStride: number[];
  const uniLocation = {
    mvpMatrix: WebGLUniformLocation
  };

  let vMatrix = null; // ビュー行列
  let pMatrix = null; // プロジェクション行列
  let vpMatrix = null; // ビュー x プロジェクション行列
  // カメラのセットアップ
  const cameraOption = {
    distance: 10.0,
    min: 1.0,
    max: 20.0,
    move: 2.0,
  };
  const camera = new WebGLOrbitCamera(canvas, cameraOption);

  webgl.width = window.innerWidth;
  webgl.height = window.innerHeight;
  updateSize();
  window.addEventListener('resize', updateSize);

  window.Promise.resolve()
    .then(() =>
      window.Promise.all([WebGLUtility.loadFile('./shader/main.vert'), WebGLUtility.loadFile('./shader/main.frag')]),
    )
    .then((ress) => {
      // shaderをprogram紐付ける
      const [mainVert, mainFrag] = ress;
      const mainVs = createShaderObject(webgl.gl, mainVert, webgl.gl.VERTEX_SHADER);
      const mainFs = createShaderObject(webgl.gl, mainFrag, webgl.gl.FRAGMENT_SHADER);
      programMain = createProgram(webgl.gl, mainVs, mainFs);
      webgl.program = programMain;

      setupCircleGeometry();
      setupAxisGeometry();
      setupLocation();

      render();
    });

  function updateSize() {
    webgl.width = window.innerWidth;
    webgl.height = window.innerHeight;
  }

  function setupCircleGeometry() {
    const position = [];
    const rectanglePosition = [];
    const color = [];

    const vertexCount = 360 / get(settings).fanCount;
    const fanWidth = Math.cos((90 - vertexCount / 2) * (Math.PI / 180));
    const fanStartY = Math.sin((90 - vertexCount / 2) * (Math.PI / 180));

    for (let i = 0; i < get(settings).fanCount; i++) {
      // 一つの扇型の頂点の数
      const vertexCount = 360 / get(settings).fanCount;
      const fanStartDeg = i * vertexCount;
      const fanEndDeg = (i + 1) * vertexCount;
      const fanStartX = Math.cos(fanStartDeg * (Math.PI / 180));
      const fanEndX = Math.cos(fanEndDeg * (Math.PI / 180));

      for (let j = 0; j < vertexCount; j++) {
        const deg1 = fanStartDeg + j;
        const deg2 = fanStartDeg + j + 1;
        const rad1 = deg1 * (Math.PI / 180);
        const rad2 = deg2 * (Math.PI / 180);
        const x = Math.cos(rad1);
        const y = Math.sin(rad1);
        const x2 = Math.cos(rad2);
        const y2 = Math.sin(rad2);

        // 矩形用の計算
        // 90度の±で計算
        {
          const isTop = i % 2 === 0;
          const base = isTop ? 90 : 270;
          const deg1 = base - (fanEndDeg - fanStartDeg) / 2 + j;
          const deg2 = base - (fanEndDeg - fanStartDeg) / 2 + j + 1;
          const rad1 = deg1 * (Math.PI / 180);
          const rad2 = deg2 * (Math.PI / 180);
          const x = Math.cos(rad1);
          const y = Math.sin(rad1);
          const x2 = Math.cos(rad2);
          const y2 = Math.sin(rad2);

          const interpolatedY = isTop ? -0.5 + (1 - fanStartY) : 0.5;

          // prettier-ignore
          rectanglePosition.push(
            x + (i * fanWidth), y + interpolatedY, 0,
            x2 + (i * fanWidth), y2 + interpolatedY, 0,
            0 + (i * fanWidth), interpolatedY, 0
          );
        }


        let fanColor = i % 2 ? [0.6, 0.87, 1.0, 1.0]: [1.0, 0.87, 0.93, 1.0];
        // prettier-ignore
        color.push(
          ...fanColor,
          ...fanColor,
          ...fanColor
        )

        // prettier-ignore
        position.push(
          x, y, 0,
          x2, y2, 0,
          0, 0, 0
        );
      }
    }

    circle.position = position;
    circle.color = color;
    rectangle.position = rectanglePosition;
    rectangle.color = color;
    circleVBO = [webgl.createVBO(position), webgl.createVBO(color)];
    rectangleVBO = [webgl.createVBO(rectanglePosition), webgl.createVBO(color)];
  }

  function setupAxisGeometry() {
    axis = geometry.axis(10, [0.45, 0.45, 0.45, 1.0]);
    axisVBO = [webgl.createVBO(axis.position), webgl.createVBO(axis.color)];
  }

  function setupLocation() {
    const gl = webgl.gl;
    webgl.program = programMain;
    // attribute location の取得と有効化
    attLocation = [gl.getAttribLocation(webgl.program, 'position'), gl.getAttribLocation(webgl.program, 'color')];
    attStride = [3, 4];

    uniLocation.mvpMatrix = gl.getUniformLocation(webgl.program, 'mvpMatrix');
  }

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

  function setupMvp(position) {
    const gl = webgl.gl;
    // モデル行列を生成する
    let mMatrix = WebGLMath.mat4.identity(WebGLMath.mat4.create());
    mMatrix = WebGLMath.mat4.translate(mMatrix, position);
    // mvp 行列を生成してシェーダに送る
    const mvpMatrix = WebGLMath.mat4.multiply(vpMatrix, mMatrix);
    gl.uniformMatrix4fv(uniLocation.mvpMatrix, false, mvpMatrix);
  }

  function renderAxis(position) {
    const gl = webgl.gl;
    enableAttribute(gl, axisVBO, attLocation, attStride);
    setupMvp(position);
    gl.drawArrays(gl.LINES, 0, axis.position.length / 3);
  }

  function renderCircle(position) {
    const gl = webgl.gl;
    enableAttribute(gl, circleVBO, attLocation, attStride);
    setupMvp(position);
    gl.drawArrays(gl.TRIANGLES, 0, circle.position.length / 3);
  }

  function renderRectangle(position) {
    const gl = webgl.gl;
    enableAttribute(gl, rectangleVBO, attLocation, attStride);
    setupMvp(position);
    gl.drawArrays(gl.TRIANGLES, 0, rectangle.position.length / 3);
  }

  function render() {
    taxis.begin();

    // TODO: 何度もticketAddされちゃうのを修正
    taxis.ticker((delta, axes) => {
      setupCircleGeometry();

      // レンダリング時のクリア処理など
      setupRendering();

      renderAxis([0.0, 0.0, 0.0]);
      renderCircle([-1.5, 0.0, 0.0]);
      renderRectangle([1.5, 0.0, 0.0]);
    });
  }
};
