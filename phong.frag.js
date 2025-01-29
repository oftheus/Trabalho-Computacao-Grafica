export default `#version 300 es
precision highp float;

struct Light {
  vec3 position;
  vec3 color;
};

uniform Light uLights[2];
uniform vec3 uAmbientColor;
uniform vec3 uViewPosition;
uniform vec3 uColor;

in vec3 vNormal;
in vec3 vPosition;
in vec3 vColor;

out vec4 fragColor;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(uViewPosition - vPosition);

  vec3 ambient = uAmbientColor;

  vec3 lightEffect = vec3(0.0);

  for (int i = 0; i < 2; i++) {
    vec3 lightDir = normalize(uLights[i].position - vPosition);
    float diff = max(dot(normal, lightDir), 0.0);
    vec3 reflectDir = reflect(-lightDir, normal);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), 16.0);

    lightEffect += uLights[i].color * (diff + spec);
  }

  vec3 finalColor = ambient + lightEffect;
  fragColor = vec4(finalColor * vColor, 1.0); 
}
`;