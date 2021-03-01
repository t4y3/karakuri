attribute vec3 fromPosition;
attribute vec3 toPosition;
attribute vec4 color;

uniform mat4 mMatrix;   // モデル座標変換
uniform mat4 mvpMatrix;
uniform float interporation;
uniform vec3 eyePosition;   // カメラの位置

varying vec4 vColor;


void main(){


    vec3 position = mix(fromPosition, toPosition, interporation);

    vColor = color;

    gl_Position = mvpMatrix * vec4(position, 1.0);

    // ワールド空間（モデル座標変換後の空間）上の頂点の位置
    vec4 worldPosition = mMatrix * vec4(position, 1.0);
    // カメラからの距離
    float dist = length(worldPosition.xyz - eyePosition) / 0.5;

    gl_PointSize = dist;
}

