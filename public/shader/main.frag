precision mediump float;

uniform sampler2D textureUnit;
uniform bool isTexture;

varying vec4 vColor;
varying vec2 vTexCoord;

void main(){
    vec4 samplerColor = vec4(1.0);
    if(isTexture == true){
        samplerColor = texture2D(textureUnit, vTexCoord);
        gl_FragColor = samplerColor;
    } else {
        gl_FragColor = vColor;
    }
}

