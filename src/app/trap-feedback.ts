export function playTrapEjectFeedback(): void {
  try {
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const startAt = context.currentTime;

    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(520, startAt);
    oscillator.frequency.exponentialRampToValueAtTime(180, startAt + 0.09);
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(0.12, startAt + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.1);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.addEventListener('ended', () => {
      void context.close().catch(() => undefined);
    }, { once: true });

    void context.resume().catch(() => undefined);
    oscillator.start(startAt);
    oscillator.stop(startAt + 0.1);
  } catch {
    // 音效只增添回饋；瀏覽器不支援或拒絕時，遊戲仍照常進行。
  }
}

export function playStubbornHitFeedback(hitStreak: number): void {
  const normalizedHitStreak = Math.min(3, Math.max(1, Math.trunc(hitStreak)));

  try {
    if ('vibrate' in navigator) {
      navigator.vibrate(normalizedHitStreak >= 3 ? [25, 20, 35] : 18);
    }
  } catch {
    // 震動只增添觸控回饋；被瀏覽器拒絕時不影響遊戲。
  }

  try {
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const startAt = context.currentTime;
    const frequency = normalizedHitStreak >= 3
      ? 210
      : 280 + normalizedHitStreak * 55;

    oscillator.type = normalizedHitStreak >= 3 ? 'sawtooth' : 'square';
    oscillator.frequency.setValueAtTime(frequency, startAt);
    oscillator.frequency.exponentialRampToValueAtTime(
      Math.max(120, frequency * 0.72),
      startAt + 0.07
    );
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(0.075, startAt + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.08);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.addEventListener('ended', () => {
      void context.close().catch(() => undefined);
    }, { once: true });

    void context.resume().catch(() => undefined);
    oscillator.start(startAt);
    oscillator.stop(startAt + 0.08);
  } catch {
    // 音效只增添回饋；瀏覽器不支援或拒絕時，遊戲仍照常進行。
  }
}
