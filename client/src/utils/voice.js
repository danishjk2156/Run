/**
 * Voice Coach using Web Speech API
 * Works out-of-the-box in mobile Safari & Chrome with zero API keys or external servers.
 */
class VoiceCoach {
  constructor() {
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.muted = false;
    this.selectedVoice = null;
    this.init();
  }

  init() {
    if (!this.synth) return;
    const loadVoices = () => {
      const voices = this.synth.getVoices();
      // Try to find an energetic English voice
      this.selectedVoice =
        voices.find((v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Siri'))) ||
        voices.find((v) => v.lang.startsWith('en')) ||
        voices[0];
    };

    loadVoices();
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = loadVoices;
    }
  }

  speak(text, priority = false) {
    if (this.muted || !this.synth) return;

    if (priority) {
      this.synth.cancel(); // Stop prior speech immediately for important tier announcements
    }

    const utterance = new SpeechSynthesisUtterance(text);
    if (this.selectedVoice) {
      utterance.voice = this.selectedVoice;
    }
    utterance.rate = 1.05; // Slightly pumped up pace
    utterance.pitch = 1.1; // Energetic tone
    utterance.volume = 1.0;

    this.synth.speak(utterance);
  }

  setMuted(muted) {
    this.muted = muted;
    if (muted && this.synth) {
      this.synth.cancel();
    }
  }

  isMuted() {
    return this.muted;
  }
}

export const voiceCoach = new VoiceCoach();
