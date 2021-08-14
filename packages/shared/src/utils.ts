export const createProgram = (
  gl: WebGLRenderingContext,
  vertexShader: WebGLShader,
  fragmentShader: WebGLShader,
): WebGLProgram => {
  const program = gl.createProgram();

  if (!program) {
    throw new Error(`Failed to create program`);
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(`Failed to link: ${gl.getProgramInfoLog(program)}`);
  }
  gl.useProgram(program);
  return program;
};

export const createShaderObject = (gl: WebGLRenderingContext, source: string, type: number): WebGLShader => {
  const shader = gl.createShader(type);

  if (!shader) {
    throw new Error(`Failed to create shader`);
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(`Failed to compile: ${gl.getShaderInfoLog(shader)}`);
  }
  return shader;
};

export const createVBO = (gl: WebGLRenderingContext, vertexArray: Float32Array): WebGLBuffer => {
  const vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexArray), gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  return vbo;
}

export const createIBO = (gl: WebGLRenderingContext, index: number[]) => {
  const ibo = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(index), gl.STATIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  return ibo;
};

export const enableAttribute = (gl: WebGLRenderingContext, vbo: WebGLBuffer[], attribLocation: number[], attribStride: number[]) => {
  vbo.forEach((buffer, i) => {
    gl.bindBuffer(gl.ARRAY_BUFFER ,buffer);
    gl.enableVertexAttribArray(attribLocation[i]);
    gl.vertexAttribPointer(attribLocation[i], attribStride[i], gl.FLOAT, false, 0, 0);
  });
};
