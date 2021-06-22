attribute vec3 position;
attribute vec4 color;
attribute vec3 normal;
uniform mat4 mvpMatrix;
uniform mat4 normalMatrix;
varying vec3 vPosition;
varying vec4 vColor;
varying vec3 vNormal;


void main(){
    vPosition = position;
    vColor = color;
    vNormal = (normalMatrix * vec4(normal, 0.0)).xyz;

    gl_Position = mvpMatrix * vec4(position, 1.0);
}

