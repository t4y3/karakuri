precision mediump float;
uniform float ambient;
uniform bool enableAmbientLight;
varying vec4 vColor;

void main(){
    float ambientIntensity = enableAmbientLight ? ambient : 0.0;
    vec3 rgb = vColor.rgb * min(ambientIntensity, 1.0);
    gl_FragColor = vec4(rgb, 1.0);
}

