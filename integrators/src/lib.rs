mod types;
mod runge_kutta;
mod velocity_verlet;
mod utils;
mod dop853;
mod qd;
mod dop853_hp;
mod feagin14;

pub use runge_kutta::evolve as evolve_rk4;
pub use velocity_verlet::evolve as evolve_verlet;
pub use dop853::evolve as evolve_dop853;
pub use dop853_hp::evolve_hp as evolve_dop853_hp;
pub use feagin14::evolve as evolve_feagin14;

pub use crate::{types::Body, utils::total_energy, utils::total_angular_momentum};


pub fn sum(a: &str, b: &str) -> String {
    let a: bigdecimal::BigDecimal = a.parse().unwrap();
    let b: bigdecimal::BigDecimal = b.parse().unwrap();
    (a + b).to_string()
}