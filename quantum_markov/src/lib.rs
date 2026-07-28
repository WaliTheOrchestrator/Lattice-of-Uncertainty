// ============================================================================
// THE QUANTUM ORACLE — Rust/WebAssembly Spatial Markov Chain
// 10x10 screen grid (100 sectors), 100x100 transition matrix on the Wasm heap.
// Compile: wasm-pack build --target web
// Then copy the generated pkg/ folder into ../src/pkg/
// ============================================================================

use wasm_bindgen::prelude::*;

const COLS: usize = 10;
const ROWS: usize = 10;
const GRID_SIZE: usize = COLS * ROWS;

#[wasm_bindgen]
pub struct QuantumOracle {
    // 100x100 transition matrix mapped as a 1D contiguous vector for L1 cache optimization
    transition_matrix: Vec<f64>,
}

#[wasm_bindgen]
impl QuantumOracle {
    #[wasm_bindgen(constructor)]
    pub fn new() -> QuantumOracle {
        QuantumOracle {
            transition_matrix: vec![0.0; GRID_SIZE * GRID_SIZE],
        }
    }

    fn get_sector(x: f64, y: f64, width: f64, height: f64) -> usize {
        let cell_w = width / (COLS as f64);
        let cell_h = height / (ROWS as f64);
        let col = (x / cell_w).floor() as usize;
        let row = (y / cell_h).floor() as usize;
        let safe_col = col.clamp(0, COLS - 1);
        let safe_row = row.clamp(0, ROWS - 1);
        safe_row * COLS + safe_col
    }

    /// Ingests a flat array of [x1, y1, x2, y2...], screen dimensions, and predicts the next N steps
    pub fn hallucinate_trajectory(
        &mut self,
        flat_coords: &[f64],
        width: f64,
        height: f64,
        steps: usize,
    ) -> Vec<f64> {
        if flat_coords.len() < 4 {
            return vec![];
        }

        // 1. Decay Old Memories (The AI forgets slowly, like human memory)
        for val in self.transition_matrix.iter_mut() {
            *val *= 0.98;
        }

        // 2. Train the Matrix in O(N) Time
        let mut current_sector = Self::get_sector(flat_coords[0], flat_coords[1], width, height);
        for i in (2..flat_coords.len()).step_by(2) {
            let next_sector = Self::get_sector(flat_coords[i], flat_coords[i + 1], width, height);
            let idx = current_sector * GRID_SIZE + next_sector;
            self.transition_matrix[idx] += 1.0;
            current_sector = next_sector;
        }

        // 3. Predict the Future (Stochastic Hallucination)
        let mut predictions = Vec::with_capacity(steps * 2);
        let cell_w = width / (COLS as f64);
        let cell_h = height / (ROWS as f64);

        for _ in 0..steps {
            let row_start = current_sector * GRID_SIZE;
            let mut best_next = current_sector;
            let mut highest_prob = -1.0;
            for j in 0..GRID_SIZE {
                let prob = self.transition_matrix[row_start + j];
                if prob > highest_prob {
                    highest_prob = prob;
                    best_next = j;
                }
            }
            current_sector = best_next;

            // Map back to center of pixel coordinates
            let pred_x = ((current_sector % COLS) as f64) * cell_w + (cell_w / 2.0);
            let pred_y = ((current_sector / COLS) as f64) * cell_h + (cell_h / 2.0);
            predictions.push(pred_x);
            predictions.push(pred_y);
        }

        predictions
    }
}
