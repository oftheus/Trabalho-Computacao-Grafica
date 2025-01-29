const { mat4, glMatrix } = window;

class Camera {
  constructor() {
    this.position = [100, 100, 100]; // Posição inicial da câmera no espaço 3D
    this.target = [0, 0, 0]; // Alvo que a câmera tá "olhando", no caso, a origem
    this.up = [0, 1, 0]; // Vetor "up" define a direção para cima (eixo Y)

    // Matrizes para projeção e visualização
    this.projectionMatrix = mat4.create(); // Matriz de projeção inicializada como identidade
    this.viewMatrix = mat4.create(); // Matriz de visualização inicializada como identidade
  }

  // Define a matriz de projeção em perspectiva
  setPerspective(fov, aspect, near, far) {
    mat4.perspective(
      this.projectionMatrix,
      glMatrix.toRadian(fov),
      aspect,
      near,
      far
    );
  }

  // Define a matriz de projeção ortográfica
  setOrthographic(left, right, bottom, top, near, far) {
    mat4.ortho(this.projectionMatrix, left, right, bottom, top, near, far);
  }

  // Atualiza a posição da câmera em órbita ao redor do alvo
  updateOrbit(radius, angleX, angleY) {
    // Calcula a posição esférica da câmera baseada no raio e nos ângulos
    const x = radius * Math.sin(angleX) * Math.cos(angleY);
    const y = radius * Math.sin(angleY);
    const z = radius * Math.cos(angleX) * Math.cos(angleY);

    this.position = [x, y, z]; // Atualiza a posição da câmera

    // Atualiza a matriz de visualização para "olhar" do ponto atual até o alvo
    mat4.lookAt(this.viewMatrix, this.position, this.target, this.up);
  }

  // Retorna a matriz de projeção
  getProjectionMatrix() {
    return this.projectionMatrix;
  }

  // Retorna a matriz de visualização
  getViewMatrix() {
    return this.viewMatrix;
  }
}

export default Camera;
