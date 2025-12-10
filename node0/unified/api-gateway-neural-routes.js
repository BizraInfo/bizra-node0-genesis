/**
 * Neural Network API Routes
 * Extension for api-gateway.js - Neural training and distributed compute
 */

function setupNeuralRoutes(app, neuralOrchestrator, selfHealing) {
  // List available neural templates
  app.get("/unified/neural/templates", async (req, res) => {
    try {
      const templates = neuralOrchestrator.listTemplates();
      res.json({
        status: "success",
        templates,
        count: templates.length,
        phiAligned: true,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Train model from template
  app.post("/unified/neural/train", async (req, res) => {
    const { template, custom_config, tier } = req.body;

    try {
      const job = await neuralOrchestrator.trainModel(
        template,
        custom_config || {},
        tier || "small",
      );
      res.json({
        status: "success",
        job,
        message:
          "Training job started - use /unified/neural/status/:jobId to track progress",
      });
    } catch (error) {
      const recovered = await selfHealing.recover(error, req);
      res
        .status(recovered ? 200 : 500)
        .json(recovered || { error: error.message });
    }
  });

  // Get training job status
  app.get("/unified/neural/status/:jobId", async (req, res) => {
    const { jobId } = req.params;

    try {
      const status = await neuralOrchestrator.getTrainingStatus(jobId);
      res.json({ status: "success", training: status });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create distributed training cluster
  app.post("/unified/neural/cluster/create", async (req, res) => {
    const { name, architecture, topology } = req.body;

    try {
      const cluster = await neuralOrchestrator.createDistributedCluster(
        name,
        architecture || "transformer",
        topology || "mesh",
      );
      res.json({
        status: "success",
        cluster,
        message:
          "Cluster created - deploy nodes with /unified/neural/cluster/:clusterId/deploy",
      });
    } catch (error) {
      const recovered = await selfHealing.recover(error, req);
      res
        .status(recovered ? 200 : 500)
        .json(recovered || { error: error.message });
    }
  });

  // Deploy node to cluster
  app.post("/unified/neural/cluster/:clusterId/deploy", async (req, res) => {
    const { clusterId } = req.params;
    const { node_type, model_size, autonomy } = req.body;

    try {
      const deployment = await neuralOrchestrator.deployClusterNode(
        clusterId,
        node_type || "worker",
        model_size || "base",
        autonomy || 0.8,
      );
      res.json({
        status: "success",
        deployment,
        message: "Node deployed successfully",
      });
    } catch (error) {
      const recovered = await selfHealing.recover(error, req);
      res
        .status(recovered ? 200 : 500)
        .json(recovered || { error: error.message });
    }
  });

  // Start distributed training
  app.post("/unified/neural/cluster/:clusterId/train", async (req, res) => {
    const { clusterId } = req.params;
    const { dataset, epochs, federated } = req.body;

    try {
      const training = await neuralOrchestrator.trainDistributed(
        clusterId,
        dataset,
        epochs || 100,
        federated || false,
      );
      res.json({
        status: "success",
        training,
        message: "Distributed training started across cluster nodes",
      });
    } catch (error) {
      const recovered = await selfHealing.recover(error, req);
      res
        .status(recovered ? 200 : 500)
        .json(recovered || { error: error.message });
    }
  });

  // Get cluster status
  app.get("/unified/neural/cluster/:clusterId/status", async (req, res) => {
    const { clusterId } = req.params;

    try {
      const status = await neuralOrchestrator.getClusterStatus(clusterId);
      res.json({ status: "success", cluster: status });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Integrate model with HyperGraph
  app.post("/unified/neural/integrate/hypergraph", async (req, res) => {
    const { model_id, graph_query } = req.body;

    try {
      const integration = await neuralOrchestrator.integrateWithHyperGraph(
        model_id,
        graph_query,
      );
      res.json({
        status: "success",
        integration,
        message:
          "Model integrated with HyperGraph RAG for enhanced semantic search",
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Integrate model with Memory System
  app.post("/unified/neural/integrate/memory", async (req, res) => {
    const { model_id, layer } = req.body;

    try {
      const integration = await neuralOrchestrator.integrateWithMemory(
        model_id,
        layer,
      );
      res.json({
        status: "success",
        integration,
        message: `Model integrated with L${layer} memory for enhanced operations`,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get neural orchestrator statistics
  app.get("/unified/neural/stats", async (req, res) => {
    try {
      const stats = neuralOrchestrator.getStats();
      res.json({ status: "success", stats });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}

module.exports = setupNeuralRoutes;
