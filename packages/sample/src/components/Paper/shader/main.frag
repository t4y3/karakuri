precision mediump float;

uniform vec3 eyePosition;
uniform vec3 lightDirection;

uniform sampler2D texture;

varying vec3 vPosition;
varying vec4 vColor;
varying vec3 vNormal;
varying vec2 vTextureCoord;

void main(){
    vec4 sampleColor = texture2D(texture, vTextureCoord);
    // TODO: 折線部分の影
    vec3 light = normalize(lightDirection);
    vec3 normal = normalize(vNormal);
    float diffuse = max(dot(light, normal), 0.0);
    // 拡散光と環境光の成分をグローバルカラーに適用しておく @@@
    vec3 rgb = sampleColor.rgb * min(diffuse, 1.0);

//    gl_FragColor = vColor;
//    gl_FragColor = vColor * sampleColor;
//    gl_FragColor = sampleColor;
    gl_FragColor = vColor * vec4(rgb, 1.0);
}

