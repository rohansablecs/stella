export function speak(
  message: string,
) {
  if (
    typeof window ===
      "undefined" ||
    !(
      "speechSynthesis" in
      window
    )
  ) {
    return;
  }

  window.speechSynthesis.cancel();

  const utterance =
    new SpeechSynthesisUtterance(
      message,
    );

  utterance.rate = 0.95;
  utterance.pitch = 1;
  utterance.volume = 0.8;

  window.speechSynthesis.speak(
    utterance,
  );
}