// ============================================================================
// VERSION ARCHIVE — "MarkovBrain" (first Rust version, transcript parts 11-12)
// 4-state psychological Markov chain (Catatonic/Drifting/Searching/Frantic)
// over a 4x4 transition matrix. Superseded by QuantumOracle (spatial 10x10
// grid) in quantum_markov/src/lib.rs — kept here for reference/thesis.
// ============================================================================

use wasm_bindgen::prelude::*;

// Define the discrete psychological states
#[wasm_bindgen]
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum KineticState {
    Catatonic = 0, // Absolute stillness
    Drifting = 1,  // Slow, wandering observation
    Searching = 2, // Intentional, targeted movement
    Frantic = 3,   // Erratic, anxiety-driven motion
}

#[wasm_bindgen]
pub struct MarkovBrain {
    // A flat 16-element array representing a 4x4 transition matrix
    // P[i * 4 + j] = transition frequency from state i to state j
    transition_matrix: [f64; 16],
}

#[wasm_bindgen]
impl MarkovBrain {
    #[wasm_bindgen(constructor)]
    pub fn new() -> MarkovBrain {
        MarkovBrain {
            transition_matrix: [0.0; 16],
        }
    }

    /// Categorizes raw momentum (velocity) into a discrete psychological state
    fn categorize_momentum(velocity: f64) -> KineticState {
        if velocity < 0.005 {
            KineticState::Catatonic
        } else if velocity < 0.03 {
            KineticState::Drifting
        } else if velocity < 0.12 {
            KineticState::Searching
        } else {
            KineticState::Frantic
        }
    }

    /// Ingests the telemetry array, trains the matrix in O(N) time, and predicts the next state
    pub fn train_and_predict(&mut self, velocities: &[f64]) -> KineticState {
        if velocities.len() < 2 {
            return KineticState::Drifting; // Default state if insufficient data
        }

        // Decay old memory slightly to prioritize recent behavior
        for i in 0..16 {
            self.transition_matrix[i] *= 0.95;
        }

        let mut current_state = Self::categorize_momentum(velocities[0]);

        // Build the probability matrix based on the user's actual behavior
        for &velocity in velocities.iter().skip(1) {
            let next_state = Self::categorize_momentum(velocity);
            let index = (current_state as usize) * 4 + (next_state as usize);
            self.transition_matrix[index] += 1.0;
            current_state = next_state;
        }

        // Predict the *next* likely state based on the *final* known state
        let final_state = Self::categorize_momentum(*velocities.last().unwrap());
        let final_index_base = (final_state as usize) * 4;

        let mut max_prob = -1.0;
        let mut predicted_state = KineticState::Drifting;

        // Find the most probable next transition
        for j in 0..4 {
            let prob = self.transition_matrix[final_index_base + j];
            if prob > max_prob {
                max_prob = prob;
                predicted_state = match j {
                    0 => KineticState::Catatonic,
                    1 => KineticState::Drifting,
                    2 => KineticState::Searching,
                    _ => KineticState::Frantic,
                };
            }
        }

        predicted_state
    }
}
