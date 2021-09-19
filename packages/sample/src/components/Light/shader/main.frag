precision mediump float;

uniform vec3 eyePosition;
uniform vec3 lightDirection;

// ambient light
uniform float ambient;
// uniform float ambientMaterial
// uniform float ambientLight
uniform bool enableAmbientLight;
// diffuse light
// uniform float diffuseMaterial
// uniform float diffuseLight

// specular light
// uniform float specularMaterial
// uniform float specularLight
uniform bool enableSpecular;
uniform float shininess;

// Phong reflection model（フォンの反射モデル）
//   === Ambient Reflection + Diffuse Reflection + Specular Reflection
// Ambient Reflection（環境光反射）
// Diffuse Reflection（拡散反射）
// Specular Reflection（鏡面反射）
//
// ambientRefrlction =
//   ambientMaterial（環境反射係数） *
//   ambientLight（環境光成分）
//
// diffuseRefrlction =
//   diffuseMaterial（拡散反射係数） *
//   diffuseLight（拡散光成分） *
//   0.0 ~ 1.0（入射角による因数）
//
// specularRefrlction =
//   specularMaterial（鏡面反射係数） *
//   specularLight（鏡面光成分） *
//   0.0 ~ 1.0（反射ベクトルによる因数）

varying vec3 vPosition;
varying vec4 vColor;
varying vec3 vNormal;

// TODO: lightのon/off制御
// enableDirectionLight
// uAmbientMaterial
// uDiffuseMaterial
// shininess


void main(){
    vec3 light = normalize(lightDirection);
    // 念の為、単位化
    vec3 normal = normalize(vNormal);

    float diffuse = max(dot(light, normal), 0.0);

    float ambientIntensity = enableAmbientLight ? ambient : 0.0;

    // 拡散光と環境光の成分をグローバルカラーに適用しておく @@@
    vec3 rgb = vColor.rgb * min(diffuse + ambientIntensity, 1.0);

    // 視線ベクトルは、カメラの位置とワールド空間上の頂点の位置から求める @@@
    vec3 eye = normalize(vPosition - eyePosition);

    // 視線ベクトルと法線を使って、反射ベクトルを作る @@@
    vec3 reflectVector = normalize(reflect(eye, normal));

    // 反射ベクトルとライトベクトルの内積で反射光を計算する @@@
    float specular = max(dot(reflectVector, light), 0.0);

    // スペキュラ成分はべき算を用いて先鋭化する @@@
    specular = pow(specular, shininess);

    // フラグが経ってない場合無効化する @@@
    specular = enableSpecular ? specular : 0.0;

    // 反射光の成分は単純に加算して出力する @@@
    gl_FragColor = vec4(rgb + specular, 1.0);
}

