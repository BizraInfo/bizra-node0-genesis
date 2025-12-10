//! BIZRA NODE0 - Main Entry Point
//!
//! ????? (Excellence) Standard - Professional Implementation
//!
//! This is the main executable for BIZRA NODE0, the sovereign AI system.

use anyhow::Result;
use bizra_core::{GenesisConfig, Node0Runtime};
use clap::Parser;
use std::path::PathBuf;
use tracing_subscriber::EnvFilter;

/// BIZRA NODE0 - Sovereign AI System
#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
struct Args {
  /// Path to configuration file
 #[arg(short, long)]
    config: Option<PathBuf>,

    /// Drop zone directory for file ingestion
    #[arg(short, long)]
    drop_zone: Option<PathBuf>,

    /// Storage directory for databases
    #[arg(short, long)]
    storage: Option<PathBuf>,

    /// Validation API port
    #[arg(short, long, default_value_t = 3006)]
    api_port: u16,

    /// Disable TUI interface
    #[arg(long)]
    no_tui: bool,

    /// Disable AI suggestions
    #[arg(long)]
    no_ai: bool,

    /// Maximum concurrent file processing
    #[arg(short, long, default_value_t = 10)]
    max_concurrent: usize,

    /// Generate default configuration file
    #[arg(long)]
    generate_config: bool,
}

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_env_filter(
            EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info")),
        )
        .init();

  // Parse command-line arguments
    let args = Args::parse();

    // Generate config if requested
    if args.generate_config {
        let config = GenesisConfig::default();
        let config_path = PathBuf::from("node0-config.json");
        bizra_core::runtime::save_config(&config, config_path.clone())?;
        println!("? Generated default configuration: {:?}", config_path);
        return Ok(());
    }

    // Load or create configuration
    let mut config = if let Some(config_path) = args.config {
        bizra_core::runtime::load_config(Some(config_path))?
    } else {
        GenesisConfig::default()
  };

    // Override with command-line arguments
if let Some(drop_zone) = args.drop_zone {
      config.drop_zone = drop_zone;
    }
    if let Some(storage) = args.storage {
      config.storage_path = storage;
    }
    config.api_port = args.api_port;
    config.enable_tui = !args.no_tui;
    config.enable_ai = !args.no_ai;
    config.max_concurrent_files = args.max_concurrent;

    // Create runtime
    let mut runtime = Node0Runtime::new(config)?;

    // Bootstrap the system
    runtime.bootstrap().await?;

    // Print status
    let status = runtime.status().await;
    println!("");
    println!("????????????????????????????????????????????????????????");
    println!("?? NODE0 Runtime Status:");
    println!("   Node ID: {}", status.node_id);
    println!("   Active Agents: {}", status.active_agents);
    println!("   DDI Pipeline: {}", if status.ddi_running { "? RUNNING" } else { "? STOPPED" });
  println!("   Validation API: {}", if status.api_running { "? RUNNING" } else { "? PLANNED" });
 println!("   Peak T GUI: {}", if status.tui_running { "? RUNNING" } else { "? PLANNED" });
    println!("   Consensus: {}", if status.consensus_active { "? ACTIVE" } else { "? FOUNDATION" });
 println!("????????????????????????????????????????????????????????");
    println!("");
    println!("????? (Excellence) Standard - System Active");
    println!("");
    println!("Press Ctrl+C to stop...");

    // Keep running until interrupted
    tokio::signal::ctrl_c().await?;

    println!("");
    println!("?? Shutting down NODE0 gracefully...");
    println!("? Shutdown complete");

    Ok(())
}
