import { Taxis } from 'taxis';
import { mat4, vec3 } from 'gl-matrix';
import * as geometry from 'shared/lib/src/geometry';
import type { Geometry } from 'shared/lib/src/geometry';
import { createProgram, createShaderObject, createVBO, createIBO, enableAttribute } from 'shared/lib/src/utils';
import { Camera } from 'shared/lib/src/camera';
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
  camera: Camera;
  taxis: Taxis;
  parameters: Parameters = {
    cullFace: true,
    depthTest: true,
    light: {
      position: {
        x: 1,
        y: 1,
        z: 1,
      },
    },
    ambientLight: {
      enable: true,
      intensity: 0.2,
    },
    specularLight: {
      enable: true,
      shininess: 2.0
    },
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
  items: {
    geometry: Geometry;
    VBO: WebGLBuffer[];
    IBO: WebGLBuffer;
    position: vec3;
  }[] = [];

  constructor() {
    this.taxis = new Taxis();
  }

  init(canvas: HTMLCanvasElement, paneElement: HTMLElement) {
    this.canvas = canvas;
    this.gl = canvas.getContext(`webgl`);
    this.camera = new Camera(canvas, {
      position: {
        direction: [ 0, 1, 1],
        distance: 15
      }
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

  setupRendering() {
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
    this.gl.uniform1f(this.uniLocation.ambient, this.parameters.ambientLight.intensity);
    this.gl.uniform1i(this.uniLocation.enableSpecular, Number(this.parameters.specularLight.enable));
    this.gl.uniform1f(this.uniLocation.shininess, this.parameters.specularLight.shininess);
    this.gl.uniform1i(this.uniLocation.enableAmbientLight, Number(this.parameters.ambientLight.enable));

    // 自作の
    mat4.invert(this.vMatrix, this.camera.update());

    mat4.perspective(this.pMatrix, 45, this.canvas.width / this.canvas.height, 0.1, 20.0);
    mat4.multiply(this.vpMatrix, this.pMatrix, this.vMatrix);
  }

  setupItemsGeometry() {
    for (let i = 0; i < 20; i++) {
      const r = Math.random();
      const g = Math.random();
      const b = Math.random();

      const position: vec3 = [Math.random() * 10 - 5, Math.random() * 10 - 5, Math.random() * 10 - 5];
      const cube: Geometry = geometry.cube(1, [r, g, b, 1.0]);
      const VBO = [
        createVBO(this.gl, cube.position),
        createVBO(this.gl, cube.color),
        createVBO(this.gl, cube.normal),
      ];
      const IBO = createIBO(this.gl, cube.indices);

      this.items[i] = {
        geometry: cube,
        VBO,
        IBO,
        position
      };
    }
  }

  renderItemsGeometry(delta) {
    for (let i = 0; i < this.items.length; i++) {
      enableAttribute(this.gl, this.items[i].VBO, this.attLocation, this.attStride);
      this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.items[i].IBO);



      let mMatrix = mat4.create();
      mat4.translate(mMatrix, mMatrix, this.items[i].position);
      mat4.rotate(mMatrix, mMatrix, delta / 1000, [1.0, 1.0, 1.0]);

      this.setupMvp(mMatrix);
      this.gl.drawElements(this.gl.TRIANGLES, this.items[i].geometry.indices.length, this.gl.UNSIGNED_SHORT, 0);
    }
  }

  setupAxisGeometry() {
    this.axis.geometry = geometry.axis(20 /*[0.45, 0.45, 0.45, 1.0]*/);
    this.axis.VBO = [createVBO(this.gl, this.axis.geometry.position), createVBO(this.gl, this.axis.geometry.color)];
  }

  renderAxis(position) {
    enableAttribute(this.gl, this.axis.VBO, this.attLocation, this.attStride);

    let mMatrix = mat4.create();
    mat4.translate(mMatrix, mMatrix, position);

    this.setupMvp(mMatrix);
    this.gl.drawArrays(this.gl.LINES, 0, this.axis.geometry.position.length / 3);
  }

  setupMvp(mMatrix) {
    // normalMatrix
    const normalMatrix = mat4.create();
    mat4.invert(normalMatrix, mMatrix);
    mat4.transpose(normalMatrix, normalMatrix);
    this.gl.uniformMatrix4fv(this.uniLocation.normalMatrix, false, normalMatrix);

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
      this.setupRendering();
      this.renderItemsGeometry(delta);
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
