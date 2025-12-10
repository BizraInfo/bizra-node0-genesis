// Additional comprehensive tests for BlockGraph to achieve ≥95% coverage
// احسان (Ihsan) principle: No untested paths

#[cfg(test)]
mod block_graph_extra_tests {
    use crate::block_graph::*;
    use std::sync::Arc;
    use std::thread;

    fn create_test_hash(value: u8) -> BlockHash {
        *blake3::hash(&[value]).as_bytes()
    }

    // ============================================================================
    // COMPREHENSIVE BLOCKGRAPH TESTS
    // ============================================================================

    #[test]
    fn test_finalize_block_bytes_wrapper_valid() {
        use crate::finalize_block_bytes;

        // Test with valid 32-byte hash
        let hash = create_test_hash(0);
        let result = finalize_block_bytes(&hash);

        // Should be deterministic
        assert_eq!(result, finalize_block_bytes(&hash));
    }

    #[test]
    fn test_finalize_block_bytes_wrapper_invalid_length() {
        use crate::finalize_block_bytes;

        // Test too short
        assert_eq!(finalize_block_bytes(&[0u8; 16]), false);

        // Test too long
        assert_eq!(finalize_block_bytes(&[0u8; 64]), false);

        // Test empty
        assert_eq!(finalize_block_bytes(&[]), false);
    }

    #[test]
    fn test_verify_block_bytes_always_true() {
        use crate::verify_block_bytes;

        // Should accept all inputs (placeholder)
        assert!(verify_block_bytes(&[]));
        assert!(verify_block_bytes(&[0u8; 32]));
        assert!(verify_block_bytes(&[0xFF; 1024]));
    }

    #[test]
    fn test_block_compute_hash_deterministic() {
        let hash = create_test_hash(1);
        let parent = Some(create_test_hash(0));

        let block1 = Block::new(hash, parent, 1);
        let block2 = Block::new(hash, parent, 1);

        // Same block should produce same hash
        assert_eq!(block1.compute_hash(), block2.compute_hash());
    }

    #[test]
    fn test_block_compute_hash_different_content() {
        let hash1 = create_test_hash(1);
        let hash2 = create_test_hash(2);

        let block1 = Block::new(hash1, None, 0);
        let block2 = Block::new(hash2, None, 0);

        // Different blocks should produce different hashes
        assert_ne!(block1.compute_hash(), block2.compute_hash());
    }

    #[test]
    fn test_genesis_block_validation() {
        let graph = BlockGraph::new(1000);
        let genesis = Block::genesis(create_test_hash(0));

        // Genesis should have correct properties
        assert_eq!(genesis.height, 0);
        assert_eq!(genesis.parent_hash, None);
        assert_eq!(genesis.weight, 0);
        assert!(!genesis.finalized);

        // Should add successfully
        assert!(graph.add_block(genesis).is_ok());
    }

    #[test]
    fn test_genesis_block_invalid_height() {
        let graph = BlockGraph::new(1000);

        // Genesis with non-zero height should fail
        let mut bad_genesis = Block::genesis(create_test_hash(0));
        bad_genesis.height = 1;

        assert!(graph.add_block(bad_genesis).is_err());
    }

    #[test]
    fn test_chain_of_blocks() {
        let graph = BlockGraph::new(1000);

        // Add genesis
        let genesis = Block::genesis(create_test_hash(0));
        let genesis_hash = genesis.hash;
        graph.add_block(genesis).unwrap();

        // Add chain of 10 blocks
        let mut prev_hash = genesis_hash;
        for i in 1..=10 {
            let block = Block::new(create_test_hash(i), Some(prev_hash), i as u64);
            prev_hash = block.hash;
            assert!(graph.add_block(block).is_ok());
        }

        assert_eq!(graph.block_count(), 11); // genesis + 10
    }

    #[test]
    fn test_update_weight_nonexistent_block() {
        let graph = BlockGraph::new(1000);
        let nonexistent = create_test_hash(42);

        let result = graph.update_weight(&nonexistent, 100);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Block not found"));
    }

    #[test]
    fn test_update_weight_multiple_times() {
        let graph = BlockGraph::new(1000);
        let genesis = Block::genesis(create_test_hash(0));
        let genesis_hash = genesis.hash;

        graph.add_block(genesis).unwrap();

        // Add weight in small increments
        for i in 1..=10 {
            let was_finalized = graph.update_weight(&genesis_hash, 10).unwrap();

            if i < 67 {
                assert!(!was_finalized, "Should not finalize before threshold");
            } else {
                assert!(was_finalized, "Should finalize at threshold");
                break;
            }
        }
    }

    #[test]
    fn test_finality_is_immutable() {
        let graph = BlockGraph::new(1000);
        let genesis = Block::genesis(create_test_hash(0));
        let genesis_hash = genesis.hash;

        graph.add_block(genesis).unwrap();

        // Finalize block
        assert!(graph.update_weight(&genesis_hash, 700).unwrap());
        assert!(graph.is_finalized(&genesis_hash));

        // Add more weight - should not trigger "finalized" again
        assert!(!graph.update_weight(&genesis_hash, 300).unwrap());
        assert!(graph.is_finalized(&genesis_hash));
    }

    #[test]
    fn test_finality_threshold_percent() {
        let graph = BlockGraph::new(1000);
        assert_eq!(graph.finality_threshold_percent(), 66.67);

        let graph51 = BlockGraph::with_threshold(1000, 5100);
        assert_eq!(graph51.finality_threshold_percent(), 51.0);
    }

    #[test]
    fn test_empty_graph() {
        let graph = BlockGraph::new(1000);

        assert_eq!(graph.block_count(), 0);
        assert_eq!(graph.finalized_count(), 0);

        let nonexistent = create_test_hash(42);
        assert!(graph.get_block(&nonexistent).is_none());
        assert!(graph.get_weight(&nonexistent).is_none());
        assert!(!graph.is_finalized(&nonexistent));
    }

    #[test]
    fn test_single_block_graph() {
        let graph = BlockGraph::new(1000);
        let genesis = Block::genesis(create_test_hash(0));
        let genesis_hash = genesis.hash;

        graph.add_block(genesis).unwrap();

        assert_eq!(graph.block_count(), 1);
        assert_eq!(graph.finalized_count(), 0);

        // Finalize it
        graph.update_weight(&genesis_hash, 700).unwrap();
        assert_eq!(graph.finalized_count(), 1);
    }

    #[test]
    fn test_fork_detection_different_children() {
        let graph = BlockGraph::new(1000);
        let genesis = Block::genesis(create_test_hash(0));
        let genesis_hash = genesis.hash;

        graph.add_block(genesis).unwrap();

        // Add two different children (fork)
        let child1 = Block::new(create_test_hash(1), Some(genesis_hash), 1);
        let child2 = Block::new(create_test_hash(2), Some(genesis_hash), 1);

        assert!(graph.add_block(child1).is_ok());
        assert!(graph.add_block(child2).is_ok());

        assert_eq!(graph.block_count(), 3); // genesis + 2 children
    }

    #[test]
    fn test_parallel_chains() {
        let graph = BlockGraph::new(1000);

        // Create two independent chains
        let genesis1 = Block::genesis(create_test_hash(0));
        let genesis2 = Block::genesis(create_test_hash(100));

        graph.add_block(genesis1).unwrap();
        graph.add_block(genesis2).unwrap();

        assert_eq!(graph.block_count(), 2);
    }

    #[test]
    fn test_weight_accumulation() {
        let graph = BlockGraph::new(1000);
        let genesis = Block::genesis(create_test_hash(0));
        let genesis_hash = genesis.hash;

        graph.add_block(genesis).unwrap();

        // Add weights progressively
        graph.update_weight(&genesis_hash, 100).unwrap();
        assert_eq!(graph.get_weight(&genesis_hash), Some(100));

        graph.update_weight(&genesis_hash, 200).unwrap();
        assert_eq!(graph.get_weight(&genesis_hash), Some(300));

        graph.update_weight(&genesis_hash, 400).unwrap();
        assert_eq!(graph.get_weight(&genesis_hash), Some(700));
    }

    #[test]
    fn test_100_percent_threshold() {
        // Require 100% for finality
        let graph = BlockGraph::with_threshold(1000, 10000);
        let genesis = Block::genesis(create_test_hash(0));
        let genesis_hash = genesis.hash;

        graph.add_block(genesis).unwrap();

        // 999 should not finalize
        assert!(!graph.update_weight(&genesis_hash, 999).unwrap());

        // 1000 should finalize (100%)
        assert!(graph.update_weight(&genesis_hash, 1).unwrap());
    }

    #[test]
    fn test_threshold_51_percent() {
        let graph = BlockGraph::with_threshold(1000, 5100); // 51%
        let genesis = Block::genesis(create_test_hash(0));
        let genesis_hash = genesis.hash;

        graph.add_block(genesis).unwrap();

        // 510 should not finalize
        assert!(!graph.update_weight(&genesis_hash, 510).unwrap());

        // 511 should finalize
        assert!(graph.update_weight(&genesis_hash, 1).unwrap());
    }

    #[test]
    #[should_panic(expected = "Finality threshold must be >50%")]
    fn test_reject_threshold_above_100_percent() {
        BlockGraph::with_threshold(1000, 10001); // 100.01%
    }

    #[test]
    fn test_zero_weight_block() {
        let graph = BlockGraph::new(1000);
        let genesis = Block::genesis(create_test_hash(0));
        let genesis_hash = genesis.hash;

        graph.add_block(genesis).unwrap();

        // Block starts with zero weight
        assert_eq!(graph.get_weight(&genesis_hash), Some(0));
        assert!(!graph.is_finalized(&genesis_hash));
    }

    #[test]
    fn test_large_number_of_blocks() {
        let graph = BlockGraph::new(1000);
        let genesis = Block::genesis(create_test_hash(0));
        graph.add_block(genesis).unwrap();

        // Add 1000 blocks
        let mut prev_hash = genesis.hash;
        for i in 1..=1000 {
            let block = Block::new(
                *blake3::hash(&[(i >> 8) as u8, i as u8]).as_bytes(),
                Some(prev_hash),
                i as u64
            );
            prev_hash = block.hash;
            graph.add_block(block).unwrap();
        }

        assert_eq!(graph.block_count(), 1001);
    }

    #[test]
    fn test_block_equality() {
        let hash = create_test_hash(1);
        let parent = Some(create_test_hash(0));

        let block1 = Block::new(hash, parent, 1);
        let block2 = Block::new(hash, parent, 1);

        assert_eq!(block1, block2);
    }

    #[test]
    fn test_block_inequality_different_hash() {
        let block1 = Block::new(create_test_hash(1), None, 0);
        let block2 = Block::new(create_test_hash(2), None, 0);

        assert_ne!(block1, block2);
    }

    #[test]
    fn test_block_clone() {
        let block = Block::new(create_test_hash(1), Some(create_test_hash(0)), 1);
        let cloned = block.clone();

        assert_eq!(block, cloned);
        assert_eq!(block.hash, cloned.hash);
        assert_eq!(block.parent_hash, cloned.parent_hash);
        assert_eq!(block.weight, cloned.weight);
        assert_eq!(block.finalized, cloned.finalized);
        assert_eq!(block.height, cloned.height);
    }

    #[test]
    fn test_create_block_graph_ref() {
        let graph_ref = create_block_graph(1000, 6667);

        let genesis = Block::genesis(create_test_hash(0));
        assert!(graph_ref.add_block(genesis).is_ok());
        assert_eq!(graph_ref.block_count(), 1);
    }

    #[test]
    fn test_arc_sharing() {
        let graph_ref = create_block_graph(1000, 6667);
        let graph_clone = Arc::clone(&graph_ref);

        let genesis = Block::genesis(create_test_hash(0));
        graph_ref.add_block(genesis.clone()).unwrap();

        // Both references see the same data
        assert_eq!(graph_clone.block_count(), 1);
        assert!(graph_clone.get_block(&genesis.hash).is_some());
    }

    #[test]
    fn test_finality_threshold_boundary_exact() {
        let graph = BlockGraph::new(10000);
        let genesis = Block::genesis(create_test_hash(0));
        let genesis_hash = genesis.hash;

        graph.add_block(genesis).unwrap();

        // Exact threshold: 6667
        assert!(!graph.update_weight(&genesis_hash, 6666).unwrap());
        assert!(!graph.is_finalized(&genesis_hash));

        assert!(graph.update_weight(&genesis_hash, 1).unwrap());
        assert!(graph.is_finalized(&genesis_hash));
    }

    #[test]
    fn test_weight_saturating_add() {
        let graph = BlockGraph::new(1000);
        let genesis = Block::genesis(create_test_hash(0));
        let genesis_hash = genesis.hash;

        graph.add_block(genesis).unwrap();

        // Add maximum weight
        graph.update_weight(&genesis_hash, u64::MAX).unwrap();

        // Try adding more (should saturate, not wrap)
        graph.update_weight(&genesis_hash, 1).unwrap();

        assert_eq!(graph.get_weight(&genesis_hash), Some(u64::MAX));
    }

    #[test]
    fn test_multiple_genesis_blocks() {
        let graph = BlockGraph::new(1000);

        // Add multiple genesis blocks (different chains)
        for i in 0..10 {
            let genesis = Block::genesis(create_test_hash(i));
            assert!(graph.add_block(genesis).is_ok());
        }

        assert_eq!(graph.block_count(), 10);
    }

    #[test]
    fn test_finalized_blocks_remain_finalized() {
        let graph = BlockGraph::new(1000);
        let genesis = Block::genesis(create_test_hash(0));
        let genesis_hash = genesis.hash;

        graph.add_block(genesis).unwrap();
        graph.update_weight(&genesis_hash, 700).unwrap();

        // Check multiple times - should remain finalized
        for _ in 0..100 {
            assert!(graph.is_finalized(&genesis_hash));
        }
    }

    #[test]
    fn test_concurrent_weight_updates() {
        let graph = Arc::new(BlockGraph::new(10000));
        let genesis = Block::genesis(create_test_hash(0));
        let genesis_hash = genesis.hash;

        graph.add_block(genesis).unwrap();

        // Spawn 10 threads to add weight concurrently
        let handles: Vec<_> = (0..10)
            .map(|_| {
                let graph = Arc::clone(&graph);
                thread::spawn(move || {
                    graph.update_weight(&genesis_hash, 100).unwrap();
                })
            })
            .collect();

        for handle in handles {
            handle.join().unwrap();
        }

        // Total weight should be 1000 (10 * 100)
        assert_eq!(graph.get_weight(&genesis_hash), Some(1000));
    }

    #[test]
    fn test_error_message_duplicate_block() {
        let graph = BlockGraph::new(1000);
        let genesis = Block::genesis(create_test_hash(0));

        graph.add_block(genesis.clone()).unwrap();

        let err = graph.add_block(genesis).unwrap_err();
        assert!(err.contains("Block already exists"));
    }

    #[test]
    fn test_error_message_missing_parent() {
        let graph = BlockGraph::new(1000);
        let missing_parent = create_test_hash(99);
        let block = Block::new(create_test_hash(1), Some(missing_parent), 1);

        let err = graph.add_block(block).unwrap_err();
        assert!(err.contains("Parent block not found"));
    }

    #[test]
    fn test_error_message_invalid_height() {
        let graph = BlockGraph::new(1000);
        let genesis = Block::genesis(create_test_hash(0));
        graph.add_block(genesis.clone()).unwrap();

        let block = Block::new(create_test_hash(1), Some(genesis.hash), 5);
        let err = graph.add_block(block).unwrap_err();
        assert!(err.contains("Invalid height"));
    }

    #[test]
    fn test_error_message_genesis_wrong_height() {
        let graph = BlockGraph::new(1000);
        let mut genesis = Block::genesis(create_test_hash(0));
        genesis.height = 10;

        let err = graph.add_block(genesis).unwrap_err();
        assert!(err.contains("Genesis block must have height 0"));
    }
}
