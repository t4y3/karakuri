precision mediump float;

uniform sampler2D texture;
varying vec4 vColor;
varying vec2 vTextureCoord;

void main(){
    vec4 sampleColor = texture2D(texture, vTextureCoord);
//    gl_FragColor = vColor;
//    gl_FragColor = vColor * sampleColor;
    gl_FragColor = sampleColor;
}

