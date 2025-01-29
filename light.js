class Light {
  constructor(position, color, intensity) {
      this.position = position;     // Posição da luz [x, y, z]
      this.color = color;           // Cor da luz [r, g, b]
      this.intensity = intensity;   // Intensidade da luz (valor escalar)
  }

  getShaderData() {
      return {
          position: this.position,
          color: this.color.map(c => c * this.intensity), // Escala a cor pela intensidade
      };
  }
}

// Criar as fontes de luz
const lightWhite = new Light([-100, 100, 0], [1.0, 1.0, 1.0], 1.0); // Luz branca
const lightYellow = new Light([100, 100, 0], [1.0, 1.0, 0.0], 0.8); // Luz amarela

export { lightWhite, lightYellow };