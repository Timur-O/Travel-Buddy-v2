import confetti from 'canvas-confetti';

export function useConfetti() {
  const defaults = {
    spread: 360,
    ticks: 100,
    gravity: 0.5,
    decay: 0.94,
    startVelocity: 30,
    particleCount: 150,
    colors: ['#26A69A', '#4CAF50', '#81C784', '#FFD700', '#FFA500', '#FF69B4'],
  };

  const triggerConfetti = () => {
    Promise.all([
      confetti({
        ...defaults,
        origin: { x: 0.2, y: 0.7 },
      }),
      confetti({
        ...defaults,
        origin: { x: 0.8, y: 0.7 },
      }),
    ]);
  };

  return {
    triggerConfetti,
  };
}
