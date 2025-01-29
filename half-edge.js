class Vertex {
    constructor(vid, x, y, z) {
        this.vid = vid; // ID único do vértice
        this.position = [x, y, z]; // Coordenadas do vértice no espaço 3D
        this.normal = [0, 0, 0]; // Vetor normal acumulado para o vértice
        this.color = [1.0, 1.0, 1.0]; // Cor do vértice (padrão: branco)
        this.he = null; // Half-edge associado ao vértice (inicialmente nulo)
    }
}

class HalfEdge {
    constructor(vertex) {
        this.vertex = vertex; // Vértice inicial dessa half-edge
        this.face = null; // Face associada a esta half-edge (inicialmente nula)
        this.next = null; // Próxima half-edge no loop da face (inicialmente nula)
        this.opposite = null; // Half-edge oposta (inicialmente nula)
    }
}

class Face {
    constructor(baseHe) {
        this.baseHe = baseHe; // Half-edge base da face (usada como referência)
    }
}

class HalfEdgeDS {
    constructor() {
        this.vertices = []; // Lista de vértices
        this.halfEdges = []; // Lista de half-edges
        this.faces = []; // Lista de faces
    }

    build(coords, trigs) {
        // Criação de vértices a partir das coordenadas fornecidas
        for (let vid = 0; vid < coords.length; vid += 3) {
            const x = coords[vid];
            const y = coords[vid + 1];
            const z = coords[vid + 2];

            const v = new Vertex(vid / 3, x, y, z);
            this.vertices.push(v);
        }

        // Criação de half-edges e faces a partir dos triângulos fornecidos
        for (let tid = 0; tid < trigs.length; tid += 3) {
            const v0 = this.vertices[trigs[tid]];
            const v1 = this.vertices[trigs[tid + 1]];
            const v2 = this.vertices[trigs[tid + 2]];

            const he0 = new HalfEdge(v0);
            const he1 = new HalfEdge(v1);
            const he2 = new HalfEdge(v2);

            const face = new Face(he0); // Cria uma face associada ao triângulo
            this.faces.push(face);

            // Liga a face às half-edges
            he0.face = face;
            he1.face = face;
            he2.face = face;

            // Define as conexões entre as half-edges no ciclo da face
            he0.next = he1;
            he1.next = he2;
            he2.next = he0;

            this.halfEdges.push(he0, he1, he2);
        }

        this.computeOpposites(); // Calcula as half-edges opostas
        this.computeVertexHe(); // Atualiza os vértices com suas half-edges associadas
        this.computeNormals(); // Calcula as normais dos vértices
    }

    computeOpposites() {
        const visited = {}; // Armazena pares de vértices para identificar opostos

        for (let hid = 0; hid < this.halfEdges.length; hid++) {
            const a = this.halfEdges[hid].vertex.vid;
            const b = this.halfEdges[hid].next.vertex.vid;

            const key = `k${Math.min(a, b)},${Math.max(a, b)}`; // Chave única para o par de vértices

            if (visited[key] !== undefined) {
                // Define as half-edges opostas
                const opposite = visited[key];
                opposite.opposite = this.halfEdges[hid];
                this.halfEdges[hid].opposite = opposite;
                delete visited[key];
            } else {
                visited[key] = this.halfEdges[hid];
            }
        }
    }

    computeVertexHe() {
        // Associa uma half-edge inicial a cada vértice
        for (let hid = 0; hid < this.halfEdges.length; hid++) {
            const v = this.halfEdges[hid].vertex;
            if (v.he === null) {
                v.he = this.halfEdges[hid];
            }
        }
    }

    computeNormals() {
        // Calcula as normais das faces e acumula nos vértices
        for (let fId = 0; fId < this.faces.length; fId++) {
            const he0 = this.faces[fId].baseHe;
            const he1 = he0.next;
            const he2 = he1.next;

            const v0 = he0.vertex.position;
            const v1 = he1.vertex.position;
            const v2 = he2.vertex.position;

            // Vetores entre os vértices
            const vec1 = [v1[0] - v0[0], v1[1] - v0[1], v1[2] - v0[2]];
            const vec2 = [v2[0] - v0[0], v2[1] - v0[1], v2[2] - v0[2]];

            // Produto vetorial para calcular a normal
            const normal = [
                vec1[1] * vec2[2] - vec1[2] * vec2[1],
                vec1[2] * vec2[0] - vec1[0] * vec2[2],
                vec1[0] * vec2[1] - vec1[1] * vec2[0]
            ];

            // Acumula a normal nos vértices da face
            for (let cid = 0; cid < 3; cid++) {
                he0.vertex.normal[cid] += normal[cid];
                he1.vertex.normal[cid] += normal[cid];
                he2.vertex.normal[cid] += normal[cid];
            }
        }
    }

    findEarFaces() {
        const earFaces = []; // Lista de faces dentro do limite "orelha"

        // Limites para os vértices das faces "orelha"
        const earYThresholdLow = 1.88;
        const earYThresholdHigh = 3;
        const earXThresholdMin = -1.59;
        const earXThresholdMax = 0;
        const earZThresholdMin = -2;
        const earZThresholdMax = 0.2;

        // Verifica cada face contra os limites
        for (let fId = 0; fId < this.faces.length; fId++) {
            const he0 = this.faces[fId].baseHe;
            const he1 = he0.next;
            const he2 = he1.next;

            const v0 = he0.vertex.position;
            const v1 = he1.vertex.position;
            const v2 = he2.vertex.position;

            if (
                v0[1] > earYThresholdLow && v0[1] < earYThresholdHigh &&
                v1[1] > earYThresholdLow && v1[1] < earYThresholdHigh &&
                v2[1] > earYThresholdLow && v2[1] < earYThresholdHigh &&
                v0[0] > earXThresholdMin && v0[0] < earXThresholdMax &&
                v1[0] > earXThresholdMin && v1[0] < earXThresholdMax &&
                v2[0] > earXThresholdMin && v2[0] < earXThresholdMax &&
                v0[2] > earZThresholdMin && v0[2] < earZThresholdMax &&
                v1[2] > earZThresholdMin && v1[2] < earZThresholdMax &&
                v2[2] > earZThresholdMin && v2[2] < earZThresholdMax
            ) {
                earFaces.push(this.faces[fId]); // Adiciona a face à lista
                he0.vertex.color = [1.0, 0.0, 0.0]; // Colore os vértices da face de vermelho
                he1.vertex.color = [1.0, 0.0, 0.0];
                he2.vertex.color = [1.0, 0.0, 0.0];
            }
        }

        return earFaces; // Retorna as faces "orelha"
    }

    getVBOs() {
        const coords = []; // Coordenadas dos vértices
        const colors = []; // Cores dos vértices
        const normals = []; // Normais dos vértices
        const indices = []; // Índices para formação de triângulos

        // Preenche buffers de coordenadas, cores e normais
        for (let vId = 0; vId < this.vertices.length; vId++) {
            const v = this.vertices[vId];

            coords.push(...v.position);
            colors.push(...v.color);
            normals.push(...v.normal);
        }

        // Preenche índices com os triângulos das faces
        for (let fId = 0; fId < this.faces.length; fId++) {
            const he0 = this.faces[fId].baseHe;
            const he1 = he0.next;
            const he2 = he1.next;

            indices.push(he0.vertex.vid, he1.vertex.vid, he2.vertex.vid);
        }

        return { coords, colors, normals, indices }; // Retorna os buffers VBO
    }
}

export { HalfEdgeDS, Vertex, HalfEdge, Face };
