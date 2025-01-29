export function createShader(gl, type, source) {
  const shader = gl.createShader(type);

  // Define o código-fonte do shader
  gl.shaderSource(shader, source);

  // Compila o shader
  gl.compileShader(shader);

  // Verifica se a compilação foi bem-sucedida
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    // Em caso de erro, libera o recurso do shader e retorna null
    gl.deleteShader(shader);
    return null;
  }

  // Retorna o shader compilado
  return shader;
}

export function createShaderProgram(
  gl,
  vertexShaderSource,
  fragmentShaderSource
) {
  // Cria e compila o shader de vértice
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  // Cria e compila o shader de fragmento
  const fragmentShader = createShader(
    gl,
    gl.FRAGMENT_SHADER,
    fragmentShaderSource
  );

  // Cria um programa de shader e anexa os shaders de vértice e fragmento
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);

  // Faz o link do programa de shader
  gl.linkProgram(program);

  // Verifica se o link foi bem-sucedido
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    // Em caso de erro, libera o recurso do programa e retorna null
    gl.deleteProgram(program);
    return null;
  }

  return program;
}
