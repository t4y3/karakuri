
/**
 * WebGL の API を目的別にまとめたユーティリティクラス
 * @class
 */
export class WebGLUtility {
    /**
     * ファイルをテキストとして開く
     * @static
     * @param {string} path - 読み込むファイルのパス
     * @return {Promise}
     */
    static loadFile(path){
        return new Promise((resolve, reject) => {
            // fetch を使ってファイルにアクセスする
            fetch(path)
              .then((res) => {
                  // テキストとして処理する
                  return res.text();
              })
              .then((text) => {
                  // テキストを引数に Promise を解決する
                  resolve(text);
              })
              .catch((err) => {
                  // なんらかのエラー
                  reject(err);
              });
        });
    }

    /**
     * プロパティとして保持する canvas の幅
     * @type {number} w - canvas に設定する横幅
     */
    set width(w){
        this.canvas.width = w;
    }
    get width(){
        return this.canvas.width;
    }
    /**
     * プロパティとして保持する canvas の高さ
     * @type {number} h - canvas に設定する縦方向の高さ
     */
    set height(h){
        this.canvas.height = h;
    }
    get height(){
        return this.canvas.height;
    }
    /**
     * プロパティとして保持する WebGL コンテキストにプログラムオブジェクトを設定する
     * @type {WebGLProgram} prg - 設定するプログラムオブジェクト
     */
    set program(prg){
        // gl.useProgram で利用するプログラムオブジェクトを設定できる
        this.gl.useProgram(prg);
        // あとで取り出すこともできるようプロパティに保持しておく
        this.currentProgram = prg;
    }
    get program(){
        return this.currentProgram;
    }

    /**
     * @constructor
     */
    constructor(){
        this.canvas = null;
        this.gl = null;
        this.currentProgram = null;
    }
    /**
     * canvas を受け取り WebGL コンテキストを初期化する
     * @param {HTMLCanvasElement} canvas - WebGL コンテキストを取得する canvas 要素
     * @param {boolean} isWebGL2 - WebGL2 コンテキストを利用するかどうかの真偽値
     */
    initialize(canvas, isWebGL2){
        // プロパティに保持しておく
        this.canvas = canvas;
        // canvas から WebGL コンテキスト取得を試みる
        this.gl = this.canvas.getContext(`webgl${isWebGL2 === true ? '2' : ''}`);
        if(this.gl == null){
            // WebGL コンテキストが取得できない場合はエラー
            throw new Error('webgl not supported');
        }
    }
    /**
     * ソースコードからシェーダオブジェクトを生成する
     * @param {string} source - シェーダのソースコード
     * @param {number} type - gl.VERTEX_SHADER or gl.FRAGMENT_SHADER
     * @return {WebGLShader}
     */
    createShaderObject(source, type){
        const gl = this.gl;
        // 空のシェーダオブジェクトを生成する
        const shader = gl.createShader(type);
        // シェーダオブジェクトにソースコードを割り当てる
        gl.shaderSource(shader, source);
        // シェーダをコンパイルする
        gl.compileShader(shader);
        // コンパイル後のステータスを確認し問題なければシェーダオブジェクトを返す
        if(gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
            return shader;
        }else{
            throw new Error(gl.getShaderInfoLog(shader));
            return null;
        }
    }
    /**
     * シェーダオブジェクトからプログラムオブジェクトを生成する
     * @param {WebGLShader} vs - 頂点シェーダのシェーダオブジェクト
     * @param {WebGLShader} fs - フラグメントシェーダのシェーダオブジェクト
     * @return {WebGLProgram}
     */
    createProgramObject(vs, fs){
        const gl = this.gl;
        // 空のプログラムオブジェクトを生成する
        const program = gl.createProgram();
        // ２つのシェーダをアタッチ（関連付け）する
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        // シェーダオブジェクトをリンクする
        gl.linkProgram(program);
        // リンクが完了するとシェーダオブジェクトは不要になるので削除する
        gl.deleteShader(vs);
        gl.deleteShader(fs);
        // リンク後のステータスを確認し問題なければプログラムオブジェクトを返す
        if(gl.getProgramParameter(program, gl.LINK_STATUS)){
            gl.useProgram(program);
            return program;
        }else{
            throw new Error(gl.getProgramInfoLog(program));
            return null;
        }
    }
    /**
     * シェーダオブジェクトからプログラムオブジェクトを生成する（transform feedback 対応版）
     * @param {WebGLShader} vs - 頂点シェーダのシェーダオブジェクト
     * @param {WebGLShader} fs - フラグメントシェーダのシェーダオブジェクト
     * @param {Array.<string>} varyings - 対象の varying 変数名の配列
     * @return {WebGLProgram}
     */
    createProgramObjectTF(vs, fs, varyings){
        const gl = this.gl;
        // 空のプログラムオブジェクトを生成する
        const program = gl.createProgram();
        // ２つのシェーダをアタッチ（関連付け）する
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        // プログラムオブジェクトに対して varying 変数を設定する
        gl.transformFeedbackVaryings(program, varyings, gl.SEPARATE_ATTRIBS);
        // シェーダオブジェクトをリンクする
        gl.linkProgram(program);
        // リンクが完了するとシェーダオブジェクトは不要になるので削除する
        gl.deleteShader(vs);
        gl.deleteShader(fs);
        // リンク後のステータスを確認し問題なければプログラムオブジェクトを返す
        if(gl.getProgramParameter(program, gl.LINK_STATUS)){
            gl.useProgram(program);
            return program;
        }else{
            throw new Error(gl.getProgramInfoLog(program));
            return null;
        }
    }
    /**
     * JavaScript の配列から VBO（Vertex Buffer Object）を生成する
     * @param {Array.<number>} vertexArray - 頂点属性情報の配列
     * @return {WebGLBuffer}
     */
    createVBO(vertexArray){
        const gl = this.gl;
        // 空のバッファオブジェクトを生成する
        const vbo = gl.createBuffer();
        // バッファを gl.ARRAY_BUFFER としてバインドする
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        // バインドしたバッファに Float32Array オブジェクトに変換した配列を設定する
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexArray), gl.STATIC_DRAW);
        // 安全のために最後にバインドを解除してからバッファオブジェクトを返す
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        return vbo;
    }
    /**
     * JavaScript の配列から IBO（Index Buffer Object）を生成する
     * @param {Array.<number>} indexArray - 頂点属性情報の配列
     * @return {WebGLBuffer}
     */
    createIBO(indexArray){
        const gl = this.gl;
        // 空のバッファオブジェクトを生成する
        const ibo = gl.createBuffer();
        // バッファを gl.ELEMENT_ARRAY_BUFFER としてバインドする
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
        // バインドしたバッファに Float32Array オブジェクトに変換した配列を設定する
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(indexArray), gl.STATIC_DRAW);
        // 安全のために最後にバインドを解除してからバッファオブジェクトを返す
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        return ibo;
    }
    /**
     * 頂点属性情報を有効化しロケーションと紐付ける
     * @param {Array.<WebGLBuffer>} vbo - 頂点属性を格納した VBO の配列
     * @param {Array.<number>} attLocation - 頂点属性ロケーションの配列
     * @param {Array.<number>} attStride - 頂点属性のストライドの配列
     */
    enableAttribute(vbo, attLocation, attStride){
        const gl = this.gl;
        vbo.forEach((buffer, index) => {
            // 有効化したいバッファをまずバインドする
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            // 頂点属性ロケーションの有効化を行う
            gl.enableVertexAttribArray(attLocation[index]);
            // 対象のロケーションのストライドやデータ型を設定する
            gl.vertexAttribPointer(attLocation[index], attStride[index], gl.FLOAT, false, 0, 0);
        });
    }
    /**
     * テクスチャ用のリソースからテクスチャを生成する
     * @param {string} resource - Image や Canvas などのテクスチャ用リソース
     * @return {WebGLTexture}
     */
    createTexture(resource, unit){
        const gl = this.gl;
        // テクスチャオブジェクトを生成
        const texture = gl.createTexture();
        // アクティブなテクスチャユニット番号を指定する
        gl.activeTexture(unit);
        // テクスチャをアクティブなユニットにバインドする
        gl.bindTexture(gl.TEXTURE_2D, texture);
        // バインドしたテクスチャにデータを割り当て（ここで画像のロードが完了している必要がある）
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, resource);
        // ミップマップを自動生成する
        gl.generateMipmap(gl.TEXTURE_2D);
        // テクスチャパラメータを設定する
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        // 安全の為にテクスチャのバインドを解除してから返す
        gl.bindTexture(gl.TEXTURE_2D, null);
        return texture;
    }
    /**
     * キューブマップテクスチャを非同期に生成する Promise を返す
     * @param {Array.<string>} source - 読み込む画像のパスの配列
     * @param {Array.<number>} target - 画像にそれぞれ対応させるターゲット定数の配列
     * @return {Promise} テクスチャを引数に渡して解決する Promise
     */
    createCubeTextureFromFile(source, target){
        return new Promise((resolve) => {
            const gl = this.gl;
            // テクスチャオブジェクトを生成
            const texture = gl.createTexture();
            // アクティブなテクスチャユニット番号を指定する
            gl.activeTexture(gl.TEXTURE0);
            // テクスチャをアクティブなユニットにキューブテクスチャとしてバインドする
            gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);

            // 画像を個々に読み込む Promise を生成し配列に入れておく
            const promises = source.map((src, index) => {
                // 画像の読み込みが完了し、テクスチャに画像を割り当てたら解決する Promise
                return new Promise((loadedResolve) => {
                    // 空の画像オブジェクト
                    const img = new Image();
                    // ロード完了時の処理を先に登録
                    img.addEventListener('load', () => {
                        // 読み込んだ画像をテクスチャに割り当てる
                        gl.texImage2D(target[index], 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
                        // Promise を解決する
                        loadedResolve();
                    }, false);
                    // 画像のソースを設定
                    img.src = src;
                });
            });

            // すべての Promise を一気に実行する
            Promise.all(promises)
              .then(() => {
                  // ミップマップを自動生成する
                  gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
                  // テクスチャパラメータを設定する
                  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                  // 安全の為にテクスチャのバインドを解除してから Promise を解決する
                  gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
                  // Promise を解決する際、生成したテクスチャを引数から返す
                  resolve(texture);
              });
        });
    }
    /**
     * フレームバッファを生成する
     * @param {number} width - フレームバッファの幅
     * @param {number} height - フレームバッファの高さ
     * @return {object}
     * @property {WebGLFramebuffer} framebuffer - フレームバッファオブジェクト
     * @property {WebGLRenderbuffer} depthRenderBuffer - 深度バッファ用のレンダーバッファ
     * @property {WebGLTexture} texture - カラーバッファ用のテクスチャオブジェクト
     */
    createFramebuffer(width, height){
        const gl = this.gl;

        const framebuffer       = gl.createFramebuffer();  // フレームバッファ
        const depthRenderBuffer = gl.createRenderbuffer(); // レンダーバッファ
        const texture           = gl.createTexture();      // テクスチャ
        // フレームバッファをバインド
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        // レンダーバッファをバインド
        gl.bindRenderbuffer(gl.RENDERBUFFER, depthRenderBuffer);
        // レンダーバッファを深度バッファとして設定する
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
        // フレームバッファにレンダーバッファを関連付けする
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthRenderBuffer);
        // テクスチャをユニット０にバインド
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        // テクスチャにサイズなどを設定する（ただし中身は null）
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        // テクスチャパラメータを設定
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        // フレームバッファにテクスチャを関連付けする
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
        // すべてのオブジェクトは念の為バインドを解除しておく
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        // 各オブジェクトを、JavaScript のオブジェクトに格納して返す
        return {
            framebuffer: framebuffer,
            depthRenderbuffer: depthRenderBuffer,
            texture: texture
        };
    }
}

/**
 * three.js の OrbitControls に似た挙動のカメラ操作用ユーティリティクラス
 * @class
 */
export class WebGLOrbitCamera {
    /** @type {number} */
    static get DEFAULT_DISTANCE(){return 5.0;};
    /** @type {number} */
    static get DEFAULT_MIN_DISTANCE(){return 1.0;};
    /** @type {number} */
    static get DEFAULT_MAX_DISTANCE(){return 10.0;};
    /** @type {number} */
    static get DEFAULT_MOVE_SCALE(){return 2.0;};

    /**
     * @constructor
     * @param {HTMLElement} target - イベントを設定するターゲットエレメント
     * @param {object} [option={}]
     * @property {number} option.distance - カメラの原点からの距離
     * @property {number} option.min - カメラが原点に寄れる最小距離
     * @property {number} option.max - カメラが原点から離れられる最大距離
     * @property {number} option.move - カメラが平行移動する際のスケール
     */
    constructor(target, option = {}){
        this.target             = target;
        this.distance           = option.distance || WebGLOrbitCamera.DEFAULT_DISTANCE;
        this.minDistance        = option.min || WebGLOrbitCamera.DEFAULT_MIN_DISTANCE;
        this.maxDistance        = option.max || WebGLOrbitCamera.DEFAULT_MAX_DISTANCE;
        this.moveScale          = option.move || WebGLOrbitCamera.DEFAULT_MOVE_SCALE;
        this.position           = [0.0, 0.0, this.distance];
        this.center             = [0.0, 0.0, 0.0];
        this.upDirection        = [0.0, 1.0, 0.0];
        this.moveX              = [1.0, 0.0, 0.0];
        this.moveZ              = [0.0, 0.0, 1.0];
        this.defaultPosition    = [0.0, 0.0, this.distance];
        this.defaultCenter      = [0.0, 0.0, 0.0];
        this.defaultUpDirection = [0.0, 1.0, 0.0];
        this.defaultMoveX       = [1.0, 0.0, 0.0];
        this.defaultMoveZ       = [0.0, 0.0, 1.0];
        this.movePosition       = [0.0, 0.0, 0.0];
        this.rotateX            = 0.0;
        this.rotateY            = 0.0;
        this.scale              = 0.0;
        this.isDown             = false;
        this.prevPosition       = [0, 0];
        this.offsetPosition     = [0, 0];
        this.qt                 = Qtn.create();
        this.qtx                = Qtn.create();
        this.qty                = Qtn.create();

        // self binding
        this.mouseInteractionStart = this.mouseInteractionStart.bind(this);
        this.mouseInteractionMove  = this.mouseInteractionMove.bind(this);
        this.mouseInteractionEnd   = this.mouseInteractionEnd.bind(this);
        this.wheelScroll           = this.wheelScroll.bind(this);

        // event
        this.target.addEventListener('mousedown', this.mouseInteractionStart, false);
        this.target.addEventListener('mousemove', this.mouseInteractionMove,  false);
        this.target.addEventListener('mouseup',   this.mouseInteractionEnd,   false);
        // this.target.addEventListener('wheel',     this.wheelScroll,           false);
        this.target.addEventListener('contextmenu', (event) => {
            event.preventDefault();
        }, false);
    }
    /**
     * マウスボタンが押された際のイベント
     */
    mouseInteractionStart(event){
        this.isDown = true;
        const bound = this.target.getBoundingClientRect();
        this.prevPosition = [
            event.clientX - bound.left,
            event.clientY - bound.top,
        ];
    }
    /**
     * マウスが移動した際のイベント
     */
    mouseInteractionMove(event){
        if(this.isDown !== true){return;}
        const bound = this.target.getBoundingClientRect();
        const w = bound.width;
        const h = bound.height;
        const x = event.clientX - bound.left;
        const y = event.clientY - bound.top;
        const s = 1.0 / Math.min(w, h);
        this.offsetPosition = [
            x - this.prevPosition[0],
            y - this.prevPosition[1],
        ];
        this.prevPosition = [x, y];
        switch(event.buttons){
            case 1: // 左ボタン
                this.rotateX += this.offsetPosition[0] * s;
                this.rotateY += this.offsetPosition[1] * s;
                this.rotateX = this.rotateX % 1.0;
                this.rotateY = Math.min(Math.max(this.rotateY % 1.0, -0.25), 0.25);
                break;
            case 2: // 右ボタン
                const PI2 = Math.PI * 2.0;
                const scaleX = this.offsetPosition[0] * s * this.moveScale;
                const scaleZ = this.offsetPosition[1] * s * this.moveScale;
                const xDirection = this.defaultMoveX.slice()
                const zDirection = this.defaultMoveZ.slice();
                const q = Qtn.identity(Qtn.create());
                Qtn.rotate(this.rotateX * PI2, [0.0, 1.0, 0.0], q);
                Qtn.toVecIII(xDirection, q, this.moveX);
                Qtn.toVecIII(zDirection, q, this.moveZ);
                this.movePosition[0] -= this.moveX[0] * scaleX + this.moveZ[0] * scaleZ;
                this.movePosition[2] -= this.moveX[2] * scaleX + this.moveZ[2] * scaleZ;
                break;
        }
    }
    /**
     * マウスボタンが離された際のイベント
     */
    mouseInteractionEnd(event){
        this.isDown = false;
    }
    /**
     * スクロール操作に対するイベント
     */
    wheelScroll(event){
        const w = event.wheelDelta;
        if(w > 0){
            this.scale = -0.5;
        }else if(w < 0){
            this.scale = 0.5;
        }
    }
    /**
     * 現在のパラメータからビュー行列を生成して返す
     * @return {Mat4}
     */
    update(){
        const PI2 = Math.PI * 2.0;
        const v = [1.0, 0.0, 0.0];
        // scale
        this.scale *= 0.7;
        this.distance += this.scale;
        this.distance = Math.min(Math.max(this.distance, this.minDistance), this.maxDistance);
        this.defaultPosition[2] = this.distance;
        // rotate
        Qtn.identity(this.qt);
        Qtn.identity(this.qtx);
        Qtn.identity(this.qty);
        Qtn.rotate(this.rotateX * PI2, [0.0, 1.0, 0.0], this.qtx);
        Qtn.toVecIII(v, this.qtx, v);
        Qtn.rotate(this.rotateY * PI2, v, this.qty);
        Qtn.multiply(this.qtx, this.qty, this.qt)
        Qtn.toVecIII(this.defaultPosition, this.qt, this.position);
        Qtn.toVecIII(this.defaultUpDirection, this.qt, this.upDirection);
        // translate
        this.position[0] += this.movePosition[0];
        this.position[1] += this.movePosition[1];
        this.position[2] += this.movePosition[2];
        this.center[0] = this.defaultCenter[0] + this.movePosition[0];
        this.center[1] = this.defaultCenter[1] + this.movePosition[1];
        this.center[2] = this.defaultCenter[2] + this.movePosition[2];

        return Mat4.lookAt(this.position, this.center, this.upDirection);
    }
}

/**
 * ベクトルや行列演算の機能を提供する
 * @class
 */
export class WebGLMath {
    /**
     * @static
     * @type {Mat4}
     */
    static get mat4(){return Mat4;}
    /**
     * @static
     * @type {Vec3}
     */
    static get vec3(){return Vec3;}
    /**
     * @static
     * @type {Vec2}
     */
    static get vec2(){return Vec2;}
    /**
     * @static
     * @type {Qtn}
     */
    static get qtn(){return Qtn;}
}

/**
 * Mat4
 * @class Mat4
 */
export class Mat4 {
    /**
     * 4x4 の正方行列を生成する
     * @return {Float32Array} 行列格納用の配列
     */
    static create(){
        return new Float32Array(16);
    }
    /**
     * 行列を単位化する（参照に注意）
     * @param {Mat4} dest - 単位化する行列
     * @return {Mat4} 単位化した行列
     */
    static identity(dest){
        dest[0]  = 1; dest[1]  = 0; dest[2]  = 0; dest[3]  = 0;
        dest[4]  = 0; dest[5]  = 1; dest[6]  = 0; dest[7]  = 0;
        dest[8]  = 0; dest[9]  = 0; dest[10] = 1; dest[11] = 0;
        dest[12] = 0; dest[13] = 0; dest[14] = 0; dest[15] = 1;
        return dest;
    }
    /**
     * 行列を乗算する（参照に注意・戻り値としても結果を返す）
     * @param {Mat4} mat0 - 乗算される行列
     * @param {Mat4} mat1 - 乗算する行列
     * @param {Mat4} [dest] - 乗算結果を格納する行列
     * @return {Mat4} 乗算結果の行列
     */
    static multiply(mat0, mat1, dest){
        let out = dest;
        if(dest == null){out = Mat4.create()}
        let a = mat0[0],  b = mat0[1],  c = mat0[2],  d = mat0[3],
          e = mat0[4],  f = mat0[5],  g = mat0[6],  h = mat0[7],
          i = mat0[8],  j = mat0[9],  k = mat0[10], l = mat0[11],
          m = mat0[12], n = mat0[13], o = mat0[14], p = mat0[15],
          A = mat1[0],  B = mat1[1],  C = mat1[2],  D = mat1[3],
          E = mat1[4],  F = mat1[5],  G = mat1[6],  H = mat1[7],
          I = mat1[8],  J = mat1[9],  K = mat1[10], L = mat1[11],
          M = mat1[12], N = mat1[13], O = mat1[14], P = mat1[15];
        out[0]  = A * a + B * e + C * i + D * m;
        out[1]  = A * b + B * f + C * j + D * n;
        out[2]  = A * c + B * g + C * k + D * o;
        out[3]  = A * d + B * h + C * l + D * p;
        out[4]  = E * a + F * e + G * i + H * m;
        out[5]  = E * b + F * f + G * j + H * n;
        out[6]  = E * c + F * g + G * k + H * o;
        out[7]  = E * d + F * h + G * l + H * p;
        out[8]  = I * a + J * e + K * i + L * m;
        out[9]  = I * b + J * f + K * j + L * n;
        out[10] = I * c + J * g + K * k + L * o;
        out[11] = I * d + J * h + K * l + L * p;
        out[12] = M * a + N * e + O * i + P * m;
        out[13] = M * b + N * f + O * j + P * n;
        out[14] = M * c + N * g + O * k + P * o;
        out[15] = M * d + N * h + O * l + P * p;
        return out;
    }
    /**
     * 行列に拡大縮小を適用する（参照に注意・戻り値としても結果を返す）
     * @param {Mat4} mat - 適用を受ける行列
     * @param {Vec3} vec - XYZ の各軸に対して拡縮を適用する値の行列
     * @param {Mat4} [dest] - 結果を格納する行列
     * @return {Mat4} 結果の行列
     */
    static scale(mat, vec, dest){
        let out = dest;
        if(dest == null){out = Mat4.create()}
        out[0]  = mat[0]  * vec[0];
        out[1]  = mat[1]  * vec[0];
        out[2]  = mat[2]  * vec[0];
        out[3]  = mat[3]  * vec[0];
        out[4]  = mat[4]  * vec[1];
        out[5]  = mat[5]  * vec[1];
        out[6]  = mat[6]  * vec[1];
        out[7]  = mat[7]  * vec[1];
        out[8]  = mat[8]  * vec[2];
        out[9]  = mat[9]  * vec[2];
        out[10] = mat[10] * vec[2];
        out[11] = mat[11] * vec[2];
        out[12] = mat[12];
        out[13] = mat[13];
        out[14] = mat[14];
        out[15] = mat[15];
        return out;
    }
    /**
     * 行列に平行移動を適用する（参照に注意・戻り値としても結果を返す）
     * @param {Mat4} mat - 適用を受ける行列
     * @param {Vec3} vec - XYZ の各軸に対して平行移動を適用する値の行列
     * @param {Mat4} [dest] - 結果を格納する行列
     * @return {Mat4} 結果の行列
     */
    static translate(mat, vec, dest){
        let out = dest;
        if(dest == null){out = Mat4.create()}
        out[0] = mat[0]; out[1] = mat[1]; out[2]  = mat[2];  out[3]  = mat[3];
        out[4] = mat[4]; out[5] = mat[5]; out[6]  = mat[6];  out[7]  = mat[7];
        out[8] = mat[8]; out[9] = mat[9]; out[10] = mat[10]; out[11] = mat[11];
        out[12] = mat[0] * vec[0] + mat[4] * vec[1] + mat[8]  * vec[2] + mat[12];
        out[13] = mat[1] * vec[0] + mat[5] * vec[1] + mat[9]  * vec[2] + mat[13];
        out[14] = mat[2] * vec[0] + mat[6] * vec[1] + mat[10] * vec[2] + mat[14];
        out[15] = mat[3] * vec[0] + mat[7] * vec[1] + mat[11] * vec[2] + mat[15];
        return out;
    }
    /**
     * 行列に回転を適用する（参照に注意・戻り値としても結果を返す）
     * @param {Mat4} mat - 適用を受ける行列
     * @param {number} angle - 回転量を表す値（ラジアン）
     * @param {Vec3} axis - 回転の軸
     * @param {Mat4} [dest] - 結果を格納する行列
     * @return {Mat4} 結果の行列
     */
    static rotate(mat, angle, axis, dest){
        let out = dest;
        if(dest == null){out = Mat4.create()}
        let sq = Math.sqrt(axis[0] * axis[0] + axis[1] * axis[1] + axis[2] * axis[2]);
        if(!sq){return null;}
        let a = axis[0], b = axis[1], c = axis[2];
        if(sq != 1){sq = 1 / sq; a *= sq; b *= sq; c *= sq;}
        let d = Math.sin(angle), e = Math.cos(angle), f = 1 - e,
          g = mat[0],  h = mat[1], i = mat[2],  j = mat[3],
          k = mat[4],  l = mat[5], m = mat[6],  n = mat[7],
          o = mat[8],  p = mat[9], q = mat[10], r = mat[11],
          s = a * a * f + e,
          t = b * a * f + c * d,
          u = c * a * f - b * d,
          v = a * b * f - c * d,
          w = b * b * f + e,
          x = c * b * f + a * d,
          y = a * c * f + b * d,
          z = b * c * f - a * d,
          A = c * c * f + e;
        if(angle){
            if(mat != out){
                out[12] = mat[12]; out[13] = mat[13];
                out[14] = mat[14]; out[15] = mat[15];
            }
        } else {
            out = mat;
        }
        out[0]  = g * s + k * t + o * u;
        out[1]  = h * s + l * t + p * u;
        out[2]  = i * s + m * t + q * u;
        out[3]  = j * s + n * t + r * u;
        out[4]  = g * v + k * w + o * x;
        out[5]  = h * v + l * w + p * x;
        out[6]  = i * v + m * w + q * x;
        out[7]  = j * v + n * w + r * x;
        out[8]  = g * y + k * z + o * A;
        out[9]  = h * y + l * z + p * A;
        out[10] = i * y + m * z + q * A;
        out[11] = j * y + n * z + r * A;
        return out;
    }
    /**
     * ビュー座標変換行列を生成する（参照に注意・戻り値としても結果を返す）
     * @param {Vec3} eye - 視点位置
     * @param {Vec3} center - 注視点
     * @param {Vec3} up - 上方向を示すベクトル
     * @param {Mat4} [dest] - 結果を格納する行列
     * @return {Mat4} 結果の行列
     */
    static lookAt(eye, center, up, dest){
        let eyeX    = eye[0],    eyeY    = eye[1],    eyeZ    = eye[2],
          centerX = center[0], centerY = center[1], centerZ = center[2],
          upX     = up[0],     upY     = up[1],     upZ     = up[2];
        if(eyeX == centerX && eyeY == centerY && eyeZ == centerZ){return Mat4.identity(dest);}
        let out = dest;
        if(dest == null){out = Mat4.create()}
        let x0, x1, x2, y0, y1, y2, z0, z1, z2, l;
        z0 = eyeX - center[0]; z1 = eyeY - center[1]; z2 = eyeZ - center[2];
        l = 1 / Math.sqrt(z0 * z0 + z1 * z1 + z2 * z2);
        z0 *= l; z1 *= l; z2 *= l;
        x0 = upY * z2 - upZ * z1;
        x1 = upZ * z0 - upX * z2;
        x2 = upX * z1 - upY * z0;
        l = Math.sqrt(x0 * x0 + x1 * x1 + x2 * x2);
        if(!l){
            x0 = 0; x1 = 0; x2 = 0;
        } else {
            l = 1 / l;
            x0 *= l; x1 *= l; x2 *= l;
        }
        y0 = z1 * x2 - z2 * x1; y1 = z2 * x0 - z0 * x2; y2 = z0 * x1 - z1 * x0;
        l = Math.sqrt(y0 * y0 + y1 * y1 + y2 * y2);
        if(!l){
            y0 = 0; y1 = 0; y2 = 0;
        } else {
            l = 1 / l;
            y0 *= l; y1 *= l; y2 *= l;
        }
        out[0] = x0; out[1] = y0; out[2]  = z0; out[3]  = 0;
        out[4] = x1; out[5] = y1; out[6]  = z1; out[7]  = 0;
        out[8] = x2; out[9] = y2; out[10] = z2; out[11] = 0;
        out[12] = -(x0 * eyeX + x1 * eyeY + x2 * eyeZ);
        out[13] = -(y0 * eyeX + y1 * eyeY + y2 * eyeZ);
        out[14] = -(z0 * eyeX + z1 * eyeY + z2 * eyeZ);
        out[15] = 1;
        return out;
    }
    /**
     * 透視投影変換行列を生成する（参照に注意・戻り値としても結果を返す）
     * @param {number} fovy - 視野角（度数法）
     * @param {number} aspect - アスペクト比（幅 / 高さ）
     * @param {number} near - ニアクリップ面までの距離
     * @param {number} far - ファークリップ面までの距離
     * @param {Mat4} [dest] - 結果を格納する行列
     * @return {Mat4} 結果の行列
     */
    static perspective(fovy, aspect, near, far, dest){
        let out = dest;
        if(dest == null){out = Mat4.create()}
        let t = near * Math.tan(fovy * Math.PI / 360);
        let r = t * aspect;
        let a = r * 2, b = t * 2, c = far - near;
        out[0]  = near * 2 / a;
        out[1]  = 0;
        out[2]  = 0;
        out[3]  = 0;
        out[4]  = 0;
        out[5]  = near * 2 / b;
        out[6]  = 0;
        out[7]  = 0;
        out[8]  = 0;
        out[9]  = 0;
        out[10] = -(far + near) / c;
        out[11] = -1;
        out[12] = 0;
        out[13] = 0;
        out[14] = -(far * near * 2) / c;
        out[15] = 0;
        return out;
    }
    /**
     * 正射影投影変換行列を生成する（参照に注意・戻り値としても結果を返す）
     * @param {number} left - 左端
     * @param {number} right - 右端
     * @param {number} top - 上端
     * @param {number} bottom - 下端
     * @param {number} near - ニアクリップ面までの距離
     * @param {number} far - ファークリップ面までの距離
     * @param {Mat4} [dest] - 結果を格納する行列
     * @return {Mat4} 結果の行列
     */
    static ortho(left, right, top, bottom, near, far, dest){
        let out = dest;
        if(dest == null){out = Mat4.create()}
        let h = (right - left);
        let v = (top - bottom);
        let d = (far - near);
        out[0]  = 2 / h;
        out[1]  = 0;
        out[2]  = 0;
        out[3]  = 0;
        out[4]  = 0;
        out[5]  = 2 / v;
        out[6]  = 0;
        out[7]  = 0;
        out[8]  = 0;
        out[9]  = 0;
        out[10] = -2 / d;
        out[11] = 0;
        out[12] = -(left + right) / h;
        out[13] = -(top + bottom) / v;
        out[14] = -(far + near) / d;
        out[15] = 1;
        return out;
    }
    /**
     * 転置行列を生成する（参照に注意・戻り値としても結果を返す）
     * @param {Mat4} mat - 適用する行列
     * @param {Mat4} [dest] - 結果を格納する行列
     * @return {Mat4} 結果の行列
     */
    static transpose(mat, dest){
        let out = dest;
        if(dest == null){out = Mat4.create()}
        out[0]  = mat[0];  out[1]  = mat[4];
        out[2]  = mat[8];  out[3]  = mat[12];
        out[4]  = mat[1];  out[5]  = mat[5];
        out[6]  = mat[9];  out[7]  = mat[13];
        out[8]  = mat[2];  out[9]  = mat[6];
        out[10] = mat[10]; out[11] = mat[14];
        out[12] = mat[3];  out[13] = mat[7];
        out[14] = mat[11]; out[15] = mat[15];
        return out;
    }
    /**
     * 逆行列を生成する（参照に注意・戻り値としても結果を返す）
     * @param {Mat4} mat - 適用する行列
     * @param {Mat4} [dest] - 結果を格納する行列
     * @return {Mat4} 結果の行列
     */
    static inverse(mat, dest){
        let out = dest;
        if(dest == null){out = Mat4.create()}
        let a = mat[0],  b = mat[1],  c = mat[2],  d = mat[3],
          e = mat[4],  f = mat[5],  g = mat[6],  h = mat[7],
          i = mat[8],  j = mat[9],  k = mat[10], l = mat[11],
          m = mat[12], n = mat[13], o = mat[14], p = mat[15],
          q = a * f - b * e, r = a * g - c * e,
          s = a * h - d * e, t = b * g - c * f,
          u = b * h - d * f, v = c * h - d * g,
          w = i * n - j * m, x = i * o - k * m,
          y = i * p - l * m, z = j * o - k * n,
          A = j * p - l * n, B = k * p - l * o,
          ivd = 1 / (q * B - r * A + s * z + t * y - u * x + v * w);
        out[0]  = ( f * B - g * A + h * z) * ivd;
        out[1]  = (-b * B + c * A - d * z) * ivd;
        out[2]  = ( n * v - o * u + p * t) * ivd;
        out[3]  = (-j * v + k * u - l * t) * ivd;
        out[4]  = (-e * B + g * y - h * x) * ivd;
        out[5]  = ( a * B - c * y + d * x) * ivd;
        out[6]  = (-m * v + o * s - p * r) * ivd;
        out[7]  = ( i * v - k * s + l * r) * ivd;
        out[8]  = ( e * A - f * y + h * w) * ivd;
        out[9]  = (-a * A + b * y - d * w) * ivd;
        out[10] = ( m * u - n * s + p * q) * ivd;
        out[11] = (-i * u + j * s - l * q) * ivd;
        out[12] = (-e * z + f * x - g * w) * ivd;
        out[13] = ( a * z - b * x + c * w) * ivd;
        out[14] = (-m * t + n * r - o * q) * ivd;
        out[15] = ( i * t - j * r + k * q) * ivd;
        return out;
    }
    /**
     * 行列にベクトルを乗算する（ベクトルに行列を適用する）
     * @param {Mat4} mat - 適用する行列
     * @param {Array.<number>} vec - 乗算するベクトル（4 つの要素を持つ配列）
     * @return {Float32Array} 結果のベクトル
     */
    static toVecIV(mat, vec){
        let a = mat[0],  b = mat[1],  c = mat[2],  d = mat[3],
          e = mat[4],  f = mat[5],  g = mat[6],  h = mat[7],
          i = mat[8],  j = mat[9],  k = mat[10], l = mat[11],
          m = mat[12], n = mat[13], o = mat[14], p = mat[15];
        let x = vec[0], y = vec[1], z = vec[2], w = vec[3];
        let out = [];
        out[0] = x * a + y * e + z * i + w * m;
        out[1] = x * b + y * f + z * j + w * n;
        out[2] = x * c + y * g + z * k + w * o;
        out[3] = x * d + y * h + z * l + w * p;
        vec = out;
        return out;
    }
    /**
     * カメラのプロパティに相当する情報を受け取り行列を生成する
     * @param {Vec3} position - カメラの座標
     * @param {Vec3} centerPoint - カメラの注視点
     * @param {Vec3} upDirection - カメラの上方向
     * @param {number} fovy - 視野角
     * @param {number} aspect - アスペクト比
     * @param {number} near - ニアクリップ面
     * @param {number} far - ファークリップ面
     * @param {Mat4} vmat - ビュー座標変換行列の結果を格納する行列
     * @param {Mat4} pmat - 透視投影座標変換行列の結果を格納する行列
     * @param {Mat4} dest - ビュー x 透視投影変換行列の結果を格納する行列
     */
    static vpFromCameraProperty(position, centerPoint, upDirection, fovy, aspect, near, far, vmat, pmat, dest){
        Mat4.lookAt(position, centerPoint, upDirection, vmat);
        Mat4.perspective(fovy, aspect, near, far, pmat);
        Mat4.multiply(pmat, vmat, dest);
    }
    /**
     * MVP 行列に相当する行列を受け取りベクトルを変換して返す
     * @param {Mat4} mat - MVP 行列
     * @param {Array.<number>} vec - MVP 行列と乗算するベクトル
     * @param {number} width - ビューポートの幅
     * @param {number} height - ビューポートの高さ
     * @return {Array.<number>} 結果のベクトル（2 つの要素を持つベクトル）
     */
    static screenPositionFromMvp(mat, vec, width, height){
        let halfWidth = width * 0.5;
        let halfHeight = height * 0.5;
        let v = Mat4.toVecIV(mat, [vec[0], vec[1], vec[2], 1.0]);
        if(v[3] <= 0.0){return [NaN, NaN];}
        v[0] /= v[3]; v[1] /= v[3]; v[2] /= v[3];
        return [
            halfWidth + v[0] * halfWidth,
            halfHeight - v[1] * halfHeight
        ];
    }
}

/**
 * Vec3
 * @class Vec3
 */
export class Vec3 {
    /**
     * 3 つの要素を持つベクトルを生成する
     * @return {Float32Array} ベクトル格納用の配列
     */
    static create(){
        return new Float32Array(3);
    }
    /**
     * ベクトルの長さ（大きさ）を返す
     * @param {Vec3} v - 3 つの要素を持つベクトル
     * @return {number} ベクトルの長さ（大きさ）
     */
    static len(v){
        return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    }
    /**
     * 2 つの座標（始点・終点）を結ぶベクトルを返す
     * @param {Vec3} v0 - 3 つの要素を持つ始点座標
     * @param {Vec3} v1 - 3 つの要素を持つ終点座標
     * @return {Vec3} 視点と終点を結ぶベクトル
     */
    static distance(v0, v1){
        let n = Vec3.create();
        n[0] = v1[0] - v0[0];
        n[1] = v1[1] - v0[1];
        n[2] = v1[2] - v0[2];
        return n;
    }
    /**
     * ベクトルを正規化した結果を返す
     * @param {Vec3} v - 3 つの要素を持つベクトル
     * @return {Vec3} 正規化したベクトル
     */
    static normalize(v){
        let n = Vec3.create();
        let l = Vec3.len(v);
        if(l > 0){
            let e = 1.0 / l;
            n[0] = v[0] * e;
            n[1] = v[1] * e;
            n[2] = v[2] * e;
        }else{
            n[0] = 0.0;
            n[1] = 0.0;
            n[2] = 0.0;
        }
        return n;
    }
    /**
     * 2 つのベクトルの内積の結果を返す
     * @param {Vec3} v0 - 3 つの要素を持つベクトル
     * @param {Vec3} v1 - 3 つの要素を持つベクトル
     * @return {number} 内積の結果
     */
    static dot(v0, v1){
        return v0[0] * v1[0] + v0[1] * v1[1] + v0[2] * v1[2];
    }
    /**
     * 2 つのベクトルの外積の結果を返す
     * @param {Vec3} v0 - 3 つの要素を持つベクトル
     * @param {Vec3} v1 - 3 つの要素を持つベクトル
     * @return {Vec3} 外積の結果
     */
    static cross(v0, v1){
        let n = Vec3.create();
        n[0] = v0[1] * v1[2] - v0[2] * v1[1];
        n[1] = v0[2] * v1[0] - v0[0] * v1[2];
        n[2] = v0[0] * v1[1] - v0[1] * v1[0];
        return n;
    }
    /**
     * 3 つのベクトルから面法線を求めて返す
     * @param {Vec3} v0 - 3 つの要素を持つベクトル
     * @param {Vec3} v1 - 3 つの要素を持つベクトル
     * @param {Vec3} v2 - 3 つの要素を持つベクトル
     * @return {Vec3} 面法線ベクトル
     */
    static faceNormal(v0, v1, v2){
        let n = Vec3.create();
        let vec1 = [v1[0] - v0[0], v1[1] - v0[1], v1[2] - v0[2]];
        let vec2 = [v2[0] - v0[0], v2[1] - v0[1], v2[2] - v0[2]];
        n[0] = vec1[1] * vec2[2] - vec1[2] * vec2[1];
        n[1] = vec1[2] * vec2[0] - vec1[0] * vec2[2];
        n[2] = vec1[0] * vec2[1] - vec1[1] * vec2[0];
        return Vec3.normalize(n);
    }
}

/**
 * Vec2
 * @class Vec2
 */
export class Vec2 {
    /**
     * 2 つの要素を持つベクトルを生成する
     * @return {Float32Array} ベクトル格納用の配列
     */
    static create(){
        return new Float32Array(2);
    }
    /**
     * ベクトルの長さ（大きさ）を返す
     * @param {Vec2} v - 2 つの要素を持つベクトル
     * @return {number} ベクトルの長さ（大きさ）
     */
    static len(v){
        return Math.sqrt(v[0] * v[0] + v[1] * v[1]);
    }
    /**
     * 2 つの座標（始点・終点）を結ぶベクトルを返す
     * @param {Vec2} v0 - 2 つの要素を持つ始点座標
     * @param {Vec2} v1 - 2 つの要素を持つ終点座標
     * @return {Vec2} 視点と終点を結ぶベクトル
     */
    static distance(v0, v1){
        let n = Vec2.create();
        n[0] = v1[0] - v0[0];
        n[1] = v1[1] - v0[1];
        return n;
    }
    /**
     * ベクトルを正規化した結果を返す
     * @param {Vec2} v - 2 つの要素を持つベクトル
     * @return {Vec2} 正規化したベクトル
     */
    static normalize(v){
        let n = Vec2.create();
        let l = Vec2.len(v);
        if(l > 0){
            let e = 1.0 / l;
            n[0] = v[0] * e;
            n[1] = v[1] * e;
        }
        return n;
    }
    /**
     * 2 つのベクトルの内積の結果を返す
     * @param {Vec2} v0 - 2 つの要素を持つベクトル
     * @param {Vec2} v1 - 2 つの要素を持つベクトル
     * @return {number} 内積の結果
     */
    static dot(v0, v1){
        return v0[0] * v1[0] + v0[1] * v1[1];
    }
    /**
     * 2 つのベクトルの外積の結果を返す
     * @param {Vec2} v0 - 2 つの要素を持つベクトル
     * @param {Vec2} v1 - 2 つの要素を持つベクトル
     * @return {Vec2} 外積の結果
     */
    static cross(v0, v1){
        let n = Vec2.create();
        return v0[0] * v1[1] - v0[1] * v1[0];
    }
}

/**
 * Qtn
 * @class Qtn
 */
export class Qtn {
    /**
     * 4 つの要素からなるクォータニオンのデータ構造を生成する（虚部 x, y, z, 実部 w の順序で定義）
     * @return {Float32Array} クォータニオンデータ格納用の配列
     */
    static create(){
        return new Float32Array(4);
    }
    /**
     * クォータニオンを初期化する（参照に注意）
     * @param {Qtn} dest - 初期化するクォータニオン
     * @return {Qtn} 結果のクォータニオン
     */
    static identity(dest){
        dest[0] = 0; dest[1] = 0; dest[2] = 0; dest[3] = 1;
        return dest;
    }
    /**
     * 共役四元数を生成して返す（参照に注意・戻り値としても結果を返す）
     * @param {Qtn} qtn - 元となるクォータニオン
     * @param {Qtn} [dest] - 結果を格納するクォータニオン
     * @return {Qtn} 結果のクォータニオン
     */
    static inverse(qtn, dest){
        let out = dest;
        if(dest == null){out = Qtn.create();}
        out[0] = -qtn[0];
        out[1] = -qtn[1];
        out[2] = -qtn[2];
        out[3] =  qtn[3];
        return out;
    }
    /**
     * 虚部を正規化して返す（参照に注意）
     * @param {Qtn} qtn - 元となるクォータニオン
     * @return {Qtn} 結果のクォータニオン
     */
    static normalize(dest){
        let x = dest[0], y = dest[1], z = dest[2];
        let l = Math.sqrt(x * x + y * y + z * z);
        if(l === 0){
            dest[0] = 0;
            dest[1] = 0;
            dest[2] = 0;
        }else{
            l = 1 / l;
            dest[0] = x * l;
            dest[1] = y * l;
            dest[2] = z * l;
        }
        return dest;
    }
    /**
     * クォータニオンを乗算した結果を返す（参照に注意・戻り値としても結果を返す）
     * @param {Qtn} qtn0 - 乗算されるクォータニオン
     * @param {Qtn} qtn1 - 乗算するクォータニオン
     * @param {Qtn} [dest] - 結果を格納するクォータニオン
     * @return {Qtn} 結果のクォータニオン
     */
    static multiply(qtn0, qtn1, dest){
        let out = dest;
        if(dest == null){out = Qtn.create();}
        let ax = qtn0[0], ay = qtn0[1], az = qtn0[2], aw = qtn0[3];
        let bx = qtn1[0], by = qtn1[1], bz = qtn1[2], bw = qtn1[3];
        out[0] = ax * bw + aw * bx + ay * bz - az * by;
        out[1] = ay * bw + aw * by + az * bx - ax * bz;
        out[2] = az * bw + aw * bz + ax * by - ay * bx;
        out[3] = aw * bw - ax * bx - ay * by - az * bz;
        return out;
    }
    /**
     * クォータニオンに回転を適用し返す（参照に注意・戻り値としても結果を返す）
     * @param {number} angle - 回転する量（ラジアン）
     * @param {Array.<number>} axis - 3 つの要素を持つ軸ベクトル
     * @param {Qtn} [dest] - 結果を格納するクォータニオン
     * @return {Qtn} 結果のクォータニオン
     */
    static rotate(angle, axis, dest){
        let out = dest;
        if(dest == null){out = Qtn.create();}
        let a = axis[0], b = axis[1], c = axis[2];
        let sq = Math.sqrt(axis[0] * axis[0] + axis[1] * axis[1] + axis[2] * axis[2]);
        if(sq !== 0){
            let l = 1 / sq;
            a *= l;
            b *= l;
            c *= l;
        }
        let s = Math.sin(angle * 0.5);
        out[0] = a * s;
        out[1] = b * s;
        out[2] = c * s;
        out[3] = Math.cos(angle * 0.5);
        return out;
    }
    /**
     * ベクトルにクォータニオンを適用し返す（参照に注意・戻り値としても結果を返す）
     * @param {Array.<number>} vec - 3 つの要素を持つベクトル
     * @param {Qtn} qtn - クォータニオン
     * @param {Array.<number>} [dest] - 3 つの要素を持つベクトル
     * @return {Array.<number>} 結果のベクトル
     */
    static toVecIII(vec, qtn, dest){
        let out = dest;
        if(dest == null){out = [0.0, 0.0, 0.0];}
        let qp = Qtn.create();
        let qq = Qtn.create();
        let qr = Qtn.create();
        Qtn.inverse(qtn, qr);
        qp[0] = vec[0];
        qp[1] = vec[1];
        qp[2] = vec[2];
        Qtn.multiply(qr, qp, qq);
        Qtn.multiply(qq, qtn, qr);
        out[0] = qr[0];
        out[1] = qr[1];
        out[2] = qr[2];
        return out;
    }
    /**
     * 4x4 行列にクォータニオンを適用し返す（参照に注意・戻り値としても結果を返す）
     * @param {Qtn} qtn - クォータニオン
     * @param {Mat4} [dest] - 4x4 行列
     * @return {Mat4} 結果の行列
     */
    static toMatIV(qtn, dest){
        let out = dest;
        if(dest == null){out = Mat4.create();}
        let x = qtn[0], y = qtn[1], z = qtn[2], w = qtn[3];
        let x2 = x + x, y2 = y + y, z2 = z + z;
        let xx = x * x2, xy = x * y2, xz = x * z2;
        let yy = y * y2, yz = y * z2, zz = z * z2;
        let wx = w * x2, wy = w * y2, wz = w * z2;
        out[0]  = 1 - (yy + zz);
        out[1]  = xy - wz;
        out[2]  = xz + wy;
        out[3]  = 0;
        out[4]  = xy + wz;
        out[5]  = 1 - (xx + zz);
        out[6]  = yz - wx;
        out[7]  = 0;
        out[8]  = xz - wy;
        out[9]  = yz + wx;
        out[10] = 1 - (xx + yy);
        out[11] = 0;
        out[12] = 0;
        out[13] = 0;
        out[14] = 0;
        out[15] = 1;
        return out;
    }
    /**
     * 2 つのクォータニオンの球面線形補間を行った結果を返す（参照に注意・戻り値としても結果を返す）
     * @param {Qtn} qtn0 - クォータニオン
     * @param {Qtn} qtn1 - クォータニオン
     * @param {number} time - 補間係数（0.0 から 1.0 で指定）
     * @param {Qtn} [dest] - 結果を格納するクォータニオン
     * @return {Qtn} 結果のクォータニオン
     */
    static slerp(qtn0, qtn1, time, dest){
        let out = dest;
        if(dest == null){out = Qtn.create();}
        let ht = qtn0[0] * qtn1[0] + qtn0[1] * qtn1[1] + qtn0[2] * qtn1[2] + qtn0[3] * qtn1[3];
        let hs = 1.0 - ht * ht;
        if(hs <= 0.0){
            out[0] = qtn0[0];
            out[1] = qtn0[1];
            out[2] = qtn0[2];
            out[3] = qtn0[3];
        }else{
            hs = Math.sqrt(hs);
            if(Math.abs(hs) < 0.0001){
                out[0] = (qtn0[0] * 0.5 + qtn1[0] * 0.5);
                out[1] = (qtn0[1] * 0.5 + qtn1[1] * 0.5);
                out[2] = (qtn0[2] * 0.5 + qtn1[2] * 0.5);
                out[3] = (qtn0[3] * 0.5 + qtn1[3] * 0.5);
            }else{
                let ph = Math.acos(ht);
                let pt = ph * time;
                let t0 = Math.sin(ph - pt) / hs;
                let t1 = Math.sin(pt) / hs;
                out[0] = qtn0[0] * t0 + qtn1[0] * t1;
                out[1] = qtn0[1] * t0 + qtn1[1] * t1;
                out[2] = qtn0[2] * t0 + qtn1[2] * t1;
                out[3] = qtn0[3] * t0 + qtn1[3] * t1;
            }
        }
        return out;
    }
}

/**
 * ジオメトリ情報を生成する
 * @class
 */
export class WebGLGeometry {
    /**
     * 板ポリゴンの頂点情報を生成する
     * @param {number} width - 板ポリゴンの一辺の幅
     * @param {number} height - 板ポリゴンの一辺の高さ
     * @param {Array.<number>} color - RGBA を 0.0 から 1.0 の範囲で指定した配列
     * @return {object}
     * @property {Array.<number>} position - 頂点座標
     * @property {Array.<number>} normal - 頂点法線
     * @property {Array.<number>} color - 頂点カラー
     * @property {Array.<number>} texCoord - テクスチャ座標
     * @property {Array.<number>} index - 頂点インデックス（gl.TRIANGLES）
     * @example
     * let planeData = WebGLGeometry.plane(2.0, 2.0, [1.0, 1.0, 1.0, 1.0]);
     */
    static plane(width, height, color){
        let w, h;
        w = width / 2;
        h = height / 2;
        let pos = [
            -w,  h,  0.0,
            w,  h,  0.0,
            -w, -h,  0.0,
            w, -h,  0.0
        ];
        let nor = [
            0.0, 0.0, 1.0,
            0.0, 0.0, 1.0,
            0.0, 0.0, 1.0,
            0.0, 0.0, 1.0
        ];
        let col = [
            color[0], color[1], color[2], color[3],
            color[0], color[1], color[2], color[3],
            color[0], color[1], color[2], color[3],
            color[0], color[1], color[2], color[3]
        ];
        let st  = [
            0.0, 0.0,
            1.0, 0.0,
            0.0, 1.0,
            1.0, 1.0
        ];
        let idx = [
            0, 2, 1,
            1, 2, 3
        ];
        return {position: pos, normal: nor, color: col, texCoord: st, index: idx}
    }

    /**
     * 円（XY 平面展開）の頂点情報を生成する
     * @param {number} split - 円の円周の分割数
     * @param {number} rad - 円の半径
     * @param {Array.<number>} color - RGBA を 0.0 から 1.0 の範囲で指定した配列
     * @return {object}
     * @property {Array.<number>} position - 頂点座標
     * @property {Array.<number>} normal - 頂点法線
     * @property {Array.<number>} color - 頂点カラー
     * @property {Array.<number>} texCoord - テクスチャ座標
     * @property {Array.<number>} index - 頂点インデックス（gl.TRIANGLES）
     * @example
     * let circleData = WebGLGeometry.circle(64, 1.0, [1.0, 1.0, 1.0, 1.0]);
     */
    static circle(split, rad, color){
        let i, j = 0;
        let pos = [], nor = [],
          col = [], st  = [], idx = [];
        pos.push(0.0, 0.0, 0.0);
        nor.push(0.0, 0.0, 1.0);
        col.push(color[0], color[1], color[2], color[3]);
        st.push(0.5, 0.5);
        for(i = 0; i < split; i++){
            let r = Math.PI * 2.0 / split * i;
            let rx = Math.cos(r);
            let ry = Math.sin(r);
            pos.push(rx * rad, ry * rad, 0.0);
            nor.push(0.0, 0.0, 1.0);
            col.push(color[0], color[1], color[2], color[3]);
            st.push((rx + 1.0) * 0.5, 1.0 - (ry + 1.0) * 0.5);
            if(i === split - 1){
                idx.push(0, j + 1, 1);
            }else{
                idx.push(0, j + 1, j + 2);
            }
            ++j;
        }
        return {position: pos, normal: nor, color: col, texCoord: st, index: idx}
    }

    /**
     * キューブの頂点情報を生成する
     * @param {number} side - 正立方体の一辺の長さ
     * @param {Array.<number>} color - RGBA を 0.0 から 1.0 の範囲で指定した配列
     * @return {object}
     * @property {Array.<number>} position - 頂点座標
     * @property {Array.<number>} normal - 頂点法線 ※キューブの中心から各頂点に向かって伸びるベクトルなので注意
     * @property {Array.<number>} color - 頂点カラー
     * @property {Array.<number>} texCoord - テクスチャ座標
     * @property {Array.<number>} index - 頂点インデックス（gl.TRIANGLES）
     * @example
     * let cubeData = WebGLGeometry.cube(2.0, [1.0, 1.0, 1.0, 1.0]);
     */
    static cube(side, color){
        let hs = side * 0.5;
        let pos = [
            -hs, -hs,  hs,  hs, -hs,  hs,  hs,  hs,  hs, -hs,  hs,  hs,
            -hs, -hs, -hs, -hs,  hs, -hs,  hs,  hs, -hs,  hs, -hs, -hs,
            -hs,  hs, -hs, -hs,  hs,  hs,  hs,  hs,  hs,  hs,  hs, -hs,
            -hs, -hs, -hs,  hs, -hs, -hs,  hs, -hs,  hs, -hs, -hs,  hs,
            hs, -hs, -hs,  hs,  hs, -hs,  hs,  hs,  hs,  hs, -hs,  hs,
            -hs, -hs, -hs, -hs, -hs,  hs, -hs,  hs,  hs, -hs,  hs, -hs
        ];
        let v = 1.0 / Math.sqrt(3.0);
        let nor = [
            -v, -v,  v,  v, -v,  v,  v,  v,  v, -v,  v,  v,
            -v, -v, -v, -v,  v, -v,  v,  v, -v,  v, -v, -v,
            -v,  v, -v, -v,  v,  v,  v,  v,  v,  v,  v, -v,
            -v, -v, -v,  v, -v, -v,  v, -v,  v, -v, -v,  v,
            v, -v, -v,  v,  v, -v,  v,  v,  v,  v, -v,  v,
            -v, -v, -v, -v, -v,  v, -v,  v,  v, -v,  v, -v
        ];
        let col = [];
        for(let i = 0; i < pos.length / 3; i++){
            col.push(color[0], color[1], color[2], color[3]);
        }
        let st = [
            0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
            0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
            0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
            0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
            0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
            0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0
        ];
        let idx = [
            0,  1,  2,  0,  2,  3,
            4,  5,  6,  4,  6,  7,
            8,  9, 10,  8, 10, 11,
            12, 13, 14, 12, 14, 15,
            16, 17, 18, 16, 18, 19,
            20, 21, 22, 20, 22, 23
        ];
        return {position: pos, normal: nor, color: col, texCoord: st, index: idx}
    }

    static box(width, height, depth, color){
        let hw = width * 0.5;
        let hh = height * 0.5;
        let hd = depth * 0.5;
        let pos = [
            -hw, -hh,  hd, // 左下前
            hw, -hh,  hd, // 右下前
            hw,  hh,  hd, // 右上前
            -hw,  hh,  hd, // 左上前
            -hw, -hh, -hd, // 左下奥
            -hw,  hh, -hd, // 左上奥
            hw,  hh, -hd, // 右上奥
            hw, -hh, -hd, // 右下奥
            -hw,  hh, -hd, // 左上奥
            -hw,  hh,  hd, // 左上前
            hw,  hh,  hd, // 右上前
            hw,  hh, -hd, // 右上奥
            -hw, -hh, -hd, // 左下奥
            hw, -hh, -hd, // 右下奥
            hw, -hh,  hd, // 右下前
            -hw, -hh,  hd, // 左下前
            hw, -hh, -hd, // 右下奥
            hw,  hh, -hd, // 右上奥
            hw,  hh,  hd, // 右上前
            hw, -hh,  hd, // 右下前
            -hw, -hh, -hd, // 左下奥
            -hw, -hh,  hd, // 左下前
            -hw,  hh,  hd, // 左上前
            -hw,  hh, -hd // 左上奥
        ];
        let v = 1.0 / Math.sqrt(3.0);
        let nor = [
            -v, -v,  v,  v, -v,  v,  v,  v,  v, -v,  v,  v,
            -v, -v, -v, -v,  v, -v,  v,  v, -v,  v, -v, -v,
            -v,  v, -v, -v,  v,  v,  v,  v,  v,  v,  v, -v,
            -v, -v, -v,  v, -v, -v,  v, -v,  v, -v, -v,  v,
            v, -v, -v,  v,  v, -v,  v,  v,  v,  v, -v,  v,
            -v, -v, -v, -v, -v,  v, -v,  v,  v, -v,  v, -v
        ];
        let col = [];
        for(let i = 0; i < pos.length / 3; i++){
            col.push(color[0], color[1], color[2], color[3]);
        }
        let st = [
            0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
            0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
            0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
            0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
            0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
            0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0
        ];
        let idx = [
            0,  1,  2,  0,  2,  3,
            4,  5,  6,  4,  6,  7,
            8,  9, 10,  8, 10, 11,
            12, 13, 14, 12, 14, 15,
            16, 17, 18, 16, 18, 19,
            20, 21, 22, 20, 22, 23
        ];
        return {position: pos, normal: nor, color: col, texCoord: st, index: idx}
    }

    // TODO: 命名変更
    static boxLine(width, height, depth, color){
        let hw = width * 0.5;
        let hh = height * 0.5;
        let hd = depth * 0.5;
        let pos = [
            // 前面
            -hw, -hh,  hd, // 左下前
            hw, -hh,  hd, // 右下前
            hw, -hh,  hd, // 右下前
            hw,  hh,  hd, // 右上前
            hw,  hh,  hd, // 右上前
            -hw,  hh,  hd, // 左上前
            -hw,  hh,  hd, // 左上前
            -hw, -hh,  hd, // 左下前
            // 奥面
            -hw, -hh, -hd, // 左下奥
            -hw,  hh, -hd, // 左上奥
            -hw,  hh, -hd, // 左上奥
            hw,  hh, -hd, // 右上奥
            hw,  hh, -hd, // 右上奥
            hw, -hh, -hd, // 右下奥
            hw, -hh, -hd, // 右下奥
            -hw, -hh, -hd, // 左下奥
            // 天井
            -hw,  hh, -hd, // 左上奥
            -hw,  hh,  hd, // 左上前
            -hw,  hh,  hd, // 左上前
            hw,  hh,  hd, // 右上前
            hw,  hh,  hd, // 右上前
            hw,  hh, -hd, // 右上奥
            hw,  hh, -hd, // 右上奥
            -hw,  hh, -hd, // 左上奥
            // 下面
            -hw, -hh, -hd, // 左下奥
            hw, -hh, -hd, // 右下奥
            hw, -hh, -hd, // 右下奥
            hw, -hh,  hd, // 右下前
            hw, -hh,  hd, // 右下前
            -hw, -hh,  hd, // 左下前
            -hw, -hh,  hd, // 左下前
            -hw, -hh, -hd, // 左下奥
            // 右面
            hw, -hh, -hd, // 右下奥
            hw,  hh, -hd, // 右上奥
            hw,  hh, -hd, // 右上奥
            hw,  hh,  hd, // 右上前
            hw,  hh,  hd, // 右上前
            hw, -hh,  hd, // 右下前
            hw, -hh,  hd, // 右下前
            hw, -hh, -hd, // 右下奥
            // 左面
            -hw, -hh, -hd, // 左下奥
            -hw, -hh,  hd, // 左下前
            -hw, -hh,  hd, // 左下前
            -hw,  hh,  hd, // 左上前
            -hw,  hh,  hd, // 左上前
            -hw,  hh, -hd // 左上奥
            // -hw,  hh, -hd // 左上奥
            // -hw, -hh, -hd, // 左下奥
        ];
        let v = 1.0 / Math.sqrt(3.0);

        let col = [];
        for(let i = 0; i < pos.length / 3; i++){
            col.push(color[0], color[1], color[2], color[3]);
        }
        return {position: pos, color: col}
    }

    static axis(size, color){
        let pos = [size * -1, 0.0, 0.0, size, 0.0, 0.0, 0.0, size * -1, 0.0, 0.0, size, 0.0, 0.0, 0.0, size, 0.0, 0.0, size * -1];
        let col = [
            0.45,
            0.45,
            0.45,
            1.0,
            0.45,
            0.45,
            0.45,
            1.0,
            0.45,
            0.45,
            0.45,
            1.0,
            0.45,
            0.45,
            0.45,
            1.0,
            0.45,
            0.45,
            0.45,
            1.0,
            0.45,
            0.45,
            0.45,
            1.0,
        ];
        return {position: pos, color: col}
    }

    /**
     * 三角錐の頂点情報を生成する
     * @param {number} split - 底面円の円周の分割数
     * @param {number} rad - 底面円の半径
     * @param {number} height - 三角錐の高さ
     * @param {Array.<number>} color - RGBA を 0.0 から 1.0 の範囲で指定した配列
     * @return {object}
     * @property {Array.<number>} position - 頂点座標
     * @property {Array.<number>} normal - 頂点法線
     * @property {Array.<number>} color - 頂点カラー
     * @property {Array.<number>} texCoord - テクスチャ座標
     * @property {Array.<number>} index - 頂点インデックス（gl.TRIANGLES）
     * @example
     * let coneData = WebGLGeometry.cone(64, 1.0, 2.0, [1.0, 1.0, 1.0, 1.0]);
     */
    static cone(split, rad, height, color){
        let i, j = 0;
        let h = height / 2.0;
        let pos = [], nor = [],
          col = [], st  = [], idx = [];
        pos.push(0.0, -h, 0.0);
        nor.push(0.0, -1.0, 0.0);
        col.push(color[0], color[1], color[2], color[3]);
        st.push(0.5, 0.5);
        for(i = 0; i <= split; i++){
            let r = Math.PI * 2.0 / split * i;
            let rx = Math.cos(r);
            let rz = Math.sin(r);
            pos.push(
              rx * rad, -h, rz * rad,
              rx * rad, -h, rz * rad
            );
            nor.push(
              0.0, -1.0, 0.0,
              rx, 0.0, rz
            );
            col.push(
              color[0], color[1], color[2], color[3],
              color[0], color[1], color[2], color[3]
            );
            st.push(
              (rx + 1.0) * 0.5, 1.0 - (rz + 1.0) * 0.5,
              (rx + 1.0) * 0.5, 1.0 - (rz + 1.0) * 0.5
            );
            if(i !== split){
                idx.push(0, j + 1, j + 3);
                idx.push(j + 4, j + 2, split * 2 + 3);
            }
            j += 2;
        }
        pos.push(0.0, h, 0.0);
        nor.push(0.0, 1.0, 0.0);
        col.push(color[0], color[1], color[2], color[3]);
        st.push(0.5, 0.5);
        return {position: pos, normal: nor, color: col, texCoord: st, index: idx}
    }

    /**
     * 円柱の頂点情報を生成する
     * @param {number} split - 円柱の円周の分割数
     * @param {number} topRad - 円柱の天面の半径
     * @param {number} bottomRad - 円柱の底面の半径
     * @param {number} height - 円柱の高さ
     * @param {Array.<number>} color - RGBA を 0.0 から 1.0 の範囲で指定した配列
     * @return {object}
     * @property {Array.<number>} position - 頂点座標
     * @property {Array.<number>} normal - 頂点法線
     * @property {Array.<number>} color - 頂点カラー
     * @property {Array.<number>} texCoord - テクスチャ座標
     * @property {Array.<number>} index - 頂点インデックス（gl.TRIANGLES）
     * @example
     * let cylinderData = WebGLGeometry.cylinder(64, 0.5, 1.0, 2.0, [1.0, 1.0, 1.0, 1.0]);
     */
    static cylinder(split, topRad, bottomRad, height, color){
        let i, j = 2;
        let h = height / 2.0;
        let pos = [], nor = [],
          col = [], st  = [], idx = [];
        pos.push(0.0, h, 0.0, 0.0, -h, 0.0,);
        nor.push(0.0, 1.0, 0.0, 0.0, -1.0, 0.0);
        col.push(
          color[0], color[1], color[2], color[3],
          color[0], color[1], color[2], color[3]
        );
        st.push(0.5, 0.5, 0.5, 0.5);
        for(i = 0; i <= split; i++){
            let r = Math.PI * 2.0 / split * i;
            let rx = Math.cos(r);
            let rz = Math.sin(r);
            pos.push(
              rx * topRad,  h, rz * topRad,
              rx * topRad,  h, rz * topRad,
              rx * bottomRad, -h, rz * bottomRad,
              rx * bottomRad, -h, rz * bottomRad
            );
            nor.push(
              0.0, 1.0, 0.0,
              rx, 0.0, rz,
              0.0, -1.0, 0.0,
              rx, 0.0, rz
            );
            col.push(
              color[0], color[1], color[2], color[3],
              color[0], color[1], color[2], color[3],
              color[0], color[1], color[2], color[3],
              color[0], color[1], color[2], color[3]
            );
            st.push(
              (rx + 1.0) * 0.5, 1.0 - (rz + 1.0) * 0.5,
              1.0 - i / split, 0.0,
              (rx + 1.0) * 0.5, 1.0 - (rz + 1.0) * 0.5,
              1.0 - i / split, 1.0
            );
            if(i !== split){
                idx.push(
                  0, j + 4, j,
                  1, j + 2, j + 6,
                  j + 5, j + 7, j + 1,
                  j + 1, j + 7, j + 3
                );
            }
            j += 4;
        }
        return {position: pos, normal: nor, color: col, texCoord: st, index: idx}
    }

    /**
     * 球体の頂点情報を生成する
     * @param {number} row - 球の縦方向（緯度方向）の分割数
     * @param {number} column - 球の横方向（経度方向）の分割数
     * @param {number} rad - 球の半径
     * @param {Array.<number>} color - RGBA を 0.0 から 1.0 の範囲で指定した配列
     * @return {object}
     * @property {Array.<number>} position - 頂点座標
     * @property {Array.<number>} normal - 頂点法線
     * @property {Array.<number>} color - 頂点カラー
     * @property {Array.<number>} texCoord - テクスチャ座標
     * @property {Array.<number>} index - 頂点インデックス（gl.TRIANGLES）
     * @example
     * let sphereData = WebGLGeometry.sphere(64, 64, 1.0, [1.0, 1.0, 1.0, 1.0]);
     */
    static sphere(row, column, rad, color){
        let i, j;
        let pos = [], nor = [],
          col = [], st  = [], idx = [];
        for(i = 0; i <= row; i++){
            let r = Math.PI / row * i;
            let ry = Math.cos(r);
            let rr = Math.sin(r);
            for(j = 0; j <= column; j++){
                let tr = Math.PI * 2 / column * j;
                let tx = rr * rad * Math.cos(tr);
                let ty = ry * rad;
                let tz = rr * rad * Math.sin(tr);
                let rx = rr * Math.cos(tr);
                let rz = rr * Math.sin(tr);
                pos.push(tx, ty, tz);
                nor.push(rx, ry, rz);
                col.push(color[0], color[1], color[2], color[3]);
                st.push(1 - 1 / column * j, 1 / row * i);
            }
        }
        for(i = 0; i < row; i++){
            for(j = 0; j < column; j++){
                let r = (column + 1) * i + j;
                idx.push(r, r + 1, r + column + 2);
                idx.push(r, r + column + 2, r + column + 1);
            }
        }
        return {position: pos, normal: nor, color: col, texCoord: st, index: idx}
    }

    /**
     * トーラスの頂点情報を生成する
     * @param {number} row - 輪の分割数
     * @param {number} column - パイプ断面の分割数
     * @param {number} irad - パイプ断面の半径
     * @param {number} orad - パイプ全体の半径
     * @param {Array.<number>} color - RGBA を 0.0 から 1.0 の範囲で指定した配列
     * @return {object}
     * @property {Array.<number>} position - 頂点座標
     * @property {Array.<number>} normal - 頂点法線
     * @property {Array.<number>} color - 頂点カラー
     * @property {Array.<number>} texCoord - テクスチャ座標
     * @property {Array.<number>} index - 頂点インデックス（gl.TRIANGLES）
     * @example
     * let torusData = WebGLGeometry.torus(64, 64, 0.25, 0.75, [1.0, 1.0, 1.0, 1.0]);
     */
    static torus(row, column, irad, orad, color){
        let i, j;
        let pos = [], nor = [],
          col = [], st  = [], idx = [];
        for(i = 0; i <= row; i++){
            let r = Math.PI * 2 / row * i;
            let rr = Math.cos(r);
            let ry = Math.sin(r);
            for(j = 0; j <= column; j++){
                let tr = Math.PI * 2 / column * j;
                let tx = (rr * irad + orad) * Math.cos(tr);
                let ty = ry * irad;
                let tz = (rr * irad + orad) * Math.sin(tr);
                let rx = rr * Math.cos(tr);
                let rz = rr * Math.sin(tr);
                let rs = 1 / column * j;
                let rt = 1 / row * i + 0.5;
                if(rt > 1.0){rt -= 1.0;}
                rt = 1.0 - rt;
                pos.push(tx, ty, tz);
                nor.push(rx, ry, rz);
                col.push(color[0], color[1], color[2], color[3]);
                st.push(rs, rt);
            }
        }
        for(i = 0; i < row; i++){
            for(j = 0; j < column; j++){
                let r = (column + 1) * i + j;
                idx.push(r, r + column + 1, r + 1);
                idx.push(r + column + 1, r + column + 2, r + 1);
            }
        }
        return {position: pos, normal: nor, color: col, texCoord: st, index: idx}
    }

    /**
     * 正二十面体の頂点情報を生成する
     * @param {number} rad - サイズ（黄金比に対する比率）
     * @param {Array.<number>} color - RGBA を 0.0 から 1.0 の範囲で指定した配列
     * @return {object}
     * @property {Array.<number>} position - 頂点座標
     * @property {Array.<number>} normal - 頂点法線
     * @property {Array.<number>} color - 頂点カラー
     * @property {Array.<number>} texCoord - テクスチャ座標
     * @property {Array.<number>} index - 頂点インデックス（gl.TRIANGLES）
     * @example
     * let icosaData = WebGLGeometry.icosahedron(1.0, [1.0, 1.0, 1.0, 1.0]);
     */
    static icosahedron(rad, color){
        let i, j;
        let pos = [], nor = [],
          col = [], st  = [], idx = [];
        let c = (1.0 + Math.sqrt(5.0)) / 2.0;
        let t = c * rad;
        let l = Math.sqrt(1.0 + c * c);
        let r = [1.0 / l, c / l];
        pos = [
            -rad,    t,  0.0,  rad,    t,  0.0, -rad,   -t,  0.0,  rad,   -t,  0.0,
            0.0, -rad,    t,  0.0,  rad,    t,  0.0, -rad,   -t,  0.0,  rad,   -t,
            t,  0.0, -rad,    t,  0.0,  rad,   -t,  0.0, -rad,   -t,  0.0,  rad
        ];
        nor = [
            -r[0],  r[1],   0.0,  r[0],  r[1],   0.0, -r[0], -r[1],   0.0,  r[0], -r[1],   0.0,
            0.0, -r[0],  r[1],   0.0,  r[0],  r[1],   0.0, -r[0], -r[1],   0.0,  r[0], -r[1],
            r[1],   0.0, -r[0],  r[1],   0.0,  r[0], -r[1],   0.0, -r[0], -r[1],   0.0,  r[0]
        ];
        col = [
            color[0], color[1], color[2], color[3], color[0], color[1], color[2], color[3],
            color[0], color[1], color[2], color[3], color[0], color[1], color[2], color[3],
            color[0], color[1], color[2], color[3], color[0], color[1], color[2], color[3],
            color[0], color[1], color[2], color[3], color[0], color[1], color[2], color[3],
            color[0], color[1], color[2], color[3], color[0], color[1], color[2], color[3],
            color[0], color[1], color[2], color[3], color[0], color[1], color[2], color[3]
        ];
        for(let i = 0, j = nor.length; i < j; i += 3){
            let u = (Math.atan2(nor[i + 2], -nor[i]) + Math.PI) / (Math.PI * 2.0);
            let v = 1.0 - (nor[i + 1] + 1.0) / 2.0;
            st.push(u, v);
        }
        idx = [
            0, 11,  5,  0,  5,  1,  0,  1,  7,  0,  7, 10,  0, 10, 11,
            1,  5,  9,  5, 11,  4, 11, 10,  2, 10,  7,  6,  7,  1,  8,
            3,  9,  4,  3,  4,  2,  3,  2,  6,  3,  6,  8,  3,  8,  9,
            4,  9,  5,  2,  4, 11,  6,  2, 10,  8,  6,  7,  9,  8,  1
        ];
        return {position: pos, normal: nor, color: col, texCoord: st, index: idx}
    }
}

