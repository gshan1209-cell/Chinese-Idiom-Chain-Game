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
