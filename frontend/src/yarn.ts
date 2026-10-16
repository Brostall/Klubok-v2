const ANGLES = [0, 20, 40, 60, 80, 100, 120, 140, 160]

export function yarnLoops() {
  return ANGLES.map((angle, index) => ({
    angle,
    index,
  }))
}
