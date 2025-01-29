import { lightWhite, lightYellow } from "./light.js";
import phongVertexShaderSource from "./phong.vert.js";
import phongFragmentShaderSource from "./phong.frag.js";
import { createShaderProgram } from "./shader.js";
import Mesh from "./mesh.js";
import Camera from "./camera.js";
import { HalfEdgeDS } from './half-edge.js';
let shaderProgram;

// Configurar o canvas e o contexto WebGL
const canvas = document.getElementById("webgl-canvas");
const gl = canvas.getContext("webgl2");

// Verificar se o WebGL está disponível
if (!gl) {
  alert("WebGL não é suportado neste navegador.");
  throw new Error("WebGL não disponível.");
}

// Ajustar o tamanho do canvas
function resizeCanvas() {
  const { clientWidth, clientHeight } = canvas;
  if (canvas.width !== clientWidth || canvas.height !== clientHeight) {
    canvas.width = clientWidth;
    canvas.height = clientHeight;
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  }
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

let mesh= new Mesh();

// Função para carregar o arquivo OBJ
async function loadModel() {
  try {
      const response = await fetch("bunny.obj");
      const objData = await response.text();

      const coords = [];
      const trigs = [];

      const vertexPattern = /^v\s+([\d.\-e]+)\s+([\d.\-e]+)\s+([\d.\-e]+)/;
      const facePattern = /^f\s+(\d+)\/\/(\d+)\s+(\d+)\/\/(\d+)\s+(\d+)\/\/(\d+)/;

      const lines = objData.split("\n");

      for (const line of lines) {
          let result;
          if ((result = vertexPattern.exec(line))) {
              coords.push(
                  parseFloat(result[1]),
                  parseFloat(result[2]),
                  parseFloat(result[3])
              );
          } else if ((result = facePattern.exec(line))) {
              trigs.push(
                  parseInt(result[1]) - 1,
                  parseInt(result[3]) - 1,
                  parseInt(result[5]) - 1
              );
          }
      }

      // construir Half-Edge
      const heds = new HalfEdgeDS();
      heds.build(coords, trigs);

      // Identifica as faces que são da orelha e as marca com a cor vermelha
      heds.findEarFaces();  

      // Extrai os buffers de vértices, normais, cores e índices para renderização
      const { coords: vCoords, colors: vColors, normals, indices } = heds.getVBOs();
      
      // Preenche o objeto de malha com os dados extraídos
      mesh.vertices = vCoords;
      mesh.normals = normals;
      mesh.indices = indices;
      mesh.colors = vColors; 

  } catch (error) {
      console.error("Erro", error);
  }
}
let vao;

function setupBuffers() {
  vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  const vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(mesh.vertices),
    gl.STATIC_DRAW
  );
  gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0); 
  gl.enableVertexAttribArray(0);

  const normalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(mesh.normals),
    gl.STATIC_DRAW
  );
  gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0); 
  gl.enableVertexAttribArray(1);

  const colorBuffer = gl.createBuffer(); // Criar color buffer
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(mesh.colors), 
    gl.STATIC_DRAW
  );
  gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 0, 0); 
  gl.enableVertexAttribArray(2);

  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(mesh.indices),
    gl.STATIC_DRAW
  );

  gl.bindVertexArray(null);
}

let cameraPerspective;
let cameraOrthographic;
let currentCamera; // Mantém a câmera atual
let angleX = 0;
let angleY = 0;
let radius = 150;

function setupCamera() {
  const aspect = canvas.width / canvas.height;

  // Configurar câmera perspectiva
  cameraPerspective = new Camera();
  cameraPerspective.setPerspective(45, aspect, 0.1, 500);
  cameraPerspective.updateOrbit(radius, angleX, angleY);

  // Configurar câmera ortogonal
  cameraOrthographic = new Camera();
  const orthoSize = 100;
  cameraOrthographic.setOrthographic(
    -orthoSize * aspect,
    orthoSize * aspect,
    -orthoSize,
    orthoSize,
    0.1,
    500
  );

  // Definir posição e alvo para a câmera ortogonal
  cameraOrthographic.position = [50, 50, 50];
  cameraOrthographic.target = [0, 0, 0];
  mat4.lookAt(
    cameraOrthographic.viewMatrix,
    cameraOrthographic.position,
    cameraOrthographic.target,
    cameraOrthographic.up
  );

  // Definir câmera inicial como perspectiva
  currentCamera = cameraPerspective;
}

document.getElementById("toggle-camera").addEventListener("click", () => {
  currentCamera =
    currentCamera === cameraPerspective
      ? cameraOrthographic
      : cameraPerspective;
  console.log(
    "Câmera alternada:",
    currentCamera === cameraPerspective ? "Perspectiva" : "Ortogonal"
  );
});

function updateCamera(deltaTime) {
  if (currentCamera === cameraPerspective) {
    // Incrementa o ângulo Y para rotação horizontal contínua
    angleX += deltaTime * 0.002; // Controla a velocidade ajustando o fator

    // Garantir que o ângulo não ultrapasse 360 graus
    if (angleX > Math.PI * 2) {
      angleX -= Math.PI * 2;
    }

    // Oscilação vertical suave no eixo Y
    const frequency = 0.0002; // se queiser ajustar a frequência
    const amplitude = 0.8; // aqui ajusta a amplitude
    angleY = Math.sin(Date.now() * frequency) * amplitude;

    // Atualiza a posição da câmera
    cameraPerspective.updateOrbit(radius, angleX, angleY);
  }
}

function setupLights() {
  const lights = [lightWhite.getShaderData(), lightYellow.getShaderData()];

  // Enviar dados das luzes para os shaders
  lights.forEach((light, index) => {
    const lightPositionLocation = gl.getUniformLocation(
      shaderProgram,
      `uLights[${index}].position`
    );
    const lightColorLocation = gl.getUniformLocation(
      shaderProgram,
      `uLights[${index}].color`
    );

    gl.uniform3fv(lightPositionLocation, light.position);
    gl.uniform3fv(lightColorLocation, light.color);
  });

  // Cor ambiente global
  const ambientColor = [0.2, 0.2, 0.2];
  const ambientLocation = gl.getUniformLocation(shaderProgram, "uAmbientColor");
  gl.uniform3fv(ambientLocation, ambientColor);

  // Posição da câmera
  const viewPositionLocation = gl.getUniformLocation(
    shaderProgram,
    "uViewPosition"
  );
  gl.uniform3fv(viewPositionLocation, currentCamera.position);

  console.log("Luzes configuradas.");
}

function setupShaders() {
  shaderProgram = createShaderProgram(
    gl,
    phongVertexShaderSource,
    phongFragmentShaderSource
  );

  gl.useProgram(shaderProgram);

  // Localizações dos atributos e uniformes
  shaderProgram.aPosition = gl.getAttribLocation(shaderProgram, "aPosition");
  shaderProgram.aNormal = gl.getAttribLocation(shaderProgram, "aNormal");
  shaderProgram.uModelMatrix = gl.getUniformLocation(
    shaderProgram,
    "uModelMatrix"
  );
  shaderProgram.uViewMatrix = gl.getUniformLocation(
    shaderProgram,
    "uViewMatrix"
  );
  shaderProgram.uProjectionMatrix = gl.getUniformLocation(
    shaderProgram,
    "uProjectionMatrix"
  );
  shaderProgram.uNormalMatrix = gl.getUniformLocation(
    shaderProgram,
    "uNormalMatrix"
  );

  console.log("Shaders configurados.");
}

gl.enable(gl.DEPTH_TEST);

// Atualizar a câmera no loop de renderização
function render(timestamp) {
  const deltaTime = timestamp ? timestamp - (render.lastTime || 0) : 0;
  render.lastTime = timestamp;
  updateCamera(deltaTime);

  gl.clearColor(0.1, 0.1, 0.1, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const projectionMatrix = currentCamera.getProjectionMatrix();
  const viewMatrix = currentCamera.getViewMatrix();
  const modelMatrix = mat4.create();
  mat4.translate(modelMatrix, modelMatrix, [0.0, 0.0, -5.0]);
  const scaleFactor = 12.0;
  mat4.scale(modelMatrix, modelMatrix, [scaleFactor, scaleFactor, scaleFactor]);
  const normalMatrix = mat4.create();
  mat4.invert(normalMatrix, modelMatrix);
  mat4.transpose(normalMatrix, normalMatrix);

  gl.useProgram(shaderProgram);
  gl.uniformMatrix4fv(shaderProgram.uProjectionMatrix, false, projectionMatrix);
  gl.uniformMatrix4fv(shaderProgram.uViewMatrix, false, viewMatrix);
  gl.uniformMatrix4fv(shaderProgram.uModelMatrix, false, modelMatrix);
  gl.uniformMatrix4fv(shaderProgram.uNormalMatrix, false, normalMatrix);

  gl.bindVertexArray(vao);
  gl.drawElements(gl.TRIANGLES, mesh.indices.length, gl.UNSIGNED_SHORT, 0);
  gl.bindVertexArray(null);

  requestAnimationFrame(render);
}

// Inicializar a aplicação
async function init() {
  setupShaders(); 
  await loadModel(); 
  setupBuffers();
  setupCamera();
  setupLights()

  render();
}

init();
