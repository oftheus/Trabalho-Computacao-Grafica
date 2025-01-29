export default `#version 300 es
precision highp float;

layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec3 aNormal;
layout(location = 2) in vec3 aColor;

uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat4 uNormalMatrix;

out vec3 vNormal;
out vec3 vPosition;
out vec3 vColor;

void main() {
  vec4 worldPosition = uModelMatrix * vec4(aPosition, 1.0);
  vPosition = worldPosition.xyz;
  vNormal = mat3(uNormalMatrix) * aNormal;

  vColor = aColor;

  gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;
}
`;