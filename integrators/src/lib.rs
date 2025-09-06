mod dop853;
mod feagin14;
mod runge_kutta;
mod types;
mod utils;
mod velocity_verlet;

pub use dop853::evolve as evolve_dop853;
pub use feagin14::evolve as evolve_feagin14;
pub use runge_kutta::evolve as evolve_rk4;
pub use velocity_verlet::evolve as evolve_verlet;

pub use crate::{types::Body, utils::total_angular_momentum, utils::total_energy};

pub fn sum(a: &str, b: &str) -> String {
    let a: bigdecimal::BigDecimal = a.parse().unwrap();
    let b: bigdecimal::BigDecimal = b.parse().unwrap();
    (a + b).to_string()
}
