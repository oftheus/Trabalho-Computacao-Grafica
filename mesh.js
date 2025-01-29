class Mesh {
  constructor() {
    // Arrays para armazenar vértices, normais e índices do modelo
    this.vertices = [];
    this.normals = [];
    this.indices = [];
  }

  loadOBJ(objData) {
    // Padrões para identificar vértices, normais e faces no arquivo OBJ
    const vertexPattern = /^v\s+([\d.\-e]+)\s+([\d.\-e]+)\s+([\d.\-e]+)/;
    const normalPattern = /^vn\s+([\d.\-e]+)\s+([\d.\-e]+)\s+([\d.\-e]+)/;
    const facePattern = /^f\s+(\d+)\/\/(\d+)\s+(\d+)\/\/(\d+)\s+(\d+)\/\/(\d+)/;

    // Divide o arquivo OBJ em linhas para análise
    const lines = objData.split("\n");

    // Itera sobre cada linha do arquivo OBJ
    for (const line of lines) {
      let result;
      if ((result = vertexPattern.exec(line))) {
        // Adiciona as coordenadas do vértice ao array de vértices
        this.vertices.push(
          parseFloat(result[1]),
          parseFloat(result[2]),
          parseFloat(result[3])
        );
      } else if ((result = normalPattern.exec(line))) {
        // Adiciona as coordenadas da normal ao array de normais
        this.normals.push(
          parseFloat(result[1]),
          parseFloat(result[2]),
          parseFloat(result[3])
        );
      } else if ((result = facePattern.exec(line))) {
        // Adiciona os índices das faces (ajustados para zero-based) ao array de índices
        this.indices.push(
          parseInt(result[1]) - 1,
          parseInt(result[3]) - 1,
          parseInt(result[5]) - 1
        );
      }
    }
  }

  normalize() {
    // Número de vértices no modelo
    const numVertices = this.vertices.length / 3;
    let minY = Infinity; // Valor mínimo de Y para normalização
    let maxY = -Infinity; // Valor máximo de Y para normalização
    let centerX = 0,
      centerY = 0,
      centerZ = 0; // Coordenadas do centro do modelo

    // Calcula o centro do modelo e os valores mínimos/máximos de Y
    for (let i = 0; i < numVertices; i++) {
      const x = this.vertices[i * 3];
      const y = this.vertices[i * 3 + 1];
      const z = this.vertices[i * 3 + 2];

      centerX += x;
      centerY += y;
      centerZ += z;

      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }

    // Calcula o centro geométrico
    centerX /= numVertices;
    centerY /= numVertices;
    centerZ /= numVertices;

    // Altura total do modelo e escala para ajuste
    const height = maxY - minY;
    const scale = 50 / height;

    // Centraliza e escala os vértices para normalização
    for (let i = 0; i < numVertices; i++) {
      this.vertices[i * 3] = (this.vertices[i * 3] - centerX) * scale;
      this.vertices[i * 3 + 1] = (this.vertices[i * 3 + 1] - centerY) * scale;
      this.vertices[i * 3 + 2] = (this.vertices[i * 3 + 2] - centerZ) * scale;
    }
  }

  createVAO(gl) {
    // Cria e configura o VAO (Vertex Array Object) para o modelo
    gl.bindVertexArray(this.vao);

    // Buffer para vértices
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(this.vertices),
      gl.STATIC_DRAW
    );
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0); // Atributo de posição
    gl.enableVertexAttribArray(0);

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(this.colors),
      gl.STATIC_DRAW
    );
    gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 0, 0); // Atributo de cor
    gl.enableVertexAttribArray(1);

    // Buffer para normais
    const normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(this.normals),
      gl.STATIC_DRAW
    );
    gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 0, 0); // Atributo de normais
    gl.enableVertexAttribArray(2);

    // Buffer para índices
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(
      gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(this.indices),
      gl.STATIC_DRAW
    );

    // Desvincula o VAO
    gl.bindVertexArray(null);
  }
}

export default Mesh;
