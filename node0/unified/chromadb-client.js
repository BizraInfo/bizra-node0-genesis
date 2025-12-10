/**
 * ChromaDB Client - L4 Semantic Memory Integration
 * Professional HTTP client for ChromaDB vector database
 * Handles semantic embeddings with φ-aligned importance weighting
 */

const http = require("http");

class ChromaDBClient {
  constructor(host = "localhost", port = 8000) {
    this.host = host;
    this.port = port;
    this.PHI = 1.618033988749;
    this.collectionName = "bizra_semantic_memory";
  }

  async request(method, path, body = null) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: this.host,
        port: this.port,
        path: `/api/v1${path}`,
        method,
        headers: {
          "Content-Type": "application/json",
        },
      };

      const req = http.request(options, (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(data));
            } catch (err) {
              resolve(data);
            }
          } else {
            reject(new Error(`ChromaDB error ${res.statusCode}: ${data}`));
          }
        });
      });

      req.on("error", reject);
      req.setTimeout(5000, () => {
        req.destroy();
        reject(new Error("ChromaDB request timeout"));
      });

      if (body) {
        req.write(JSON.stringify(body));
      }

      req.end();
    });
  }

  async createCollection() {
    try {
      await this.request("POST", "/collections", {
        name: this.collectionName,
        metadata: {
          description: "BIZRA L4 Semantic Memory - φ-aligned vector embeddings",
          phi_ratio: this.PHI,
        },
      });
      return { success: true, collection: this.collectionName };
    } catch (err) {
      if (err.message.includes("already exists")) {
        return {
          success: true,
          collection: this.collectionName,
          note: "Collection already exists",
        };
      }
      throw err;
    }
  }

  async add(documents, metadatas, ids) {
    await this.request("POST", `/collections/${this.collectionName}/add`, {
      documents,
      metadatas,
      ids,
    });

    return {
      added: documents.length,
      collection: this.collectionName,
    };
  }

  async query(queryTexts, nResults = 10) {
    const result = await this.request(
      "POST",
      `/collections/${this.collectionName}/query`,
      {
        query_texts: Array.isArray(queryTexts) ? queryTexts : [queryTexts],
        n_results: nResults,
      },
    );

    return result;
  }

  async getCollection() {
    return await this.request("GET", `/collections/${this.collectionName}`);
  }

  async count() {
    const collection = await this.getCollection();
    return collection.count || 0;
  }

  async heartbeat() {
    return await this.request("GET", "/heartbeat");
  }
}

module.exports = ChromaDBClient;
