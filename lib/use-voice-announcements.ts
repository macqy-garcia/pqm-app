import { useCallback, useEffect, useState } from 'react';
import { useStore } from './store';
import type { VoiceType } from './types';

export function useVoiceAnnouncements() {
  const { settings } = useStore();
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if speech synthesis is supported
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsSupported(true);

      // Load voices
      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        setVoices(availableVoices);
      };

      loadVoices();

      // Voices might load asynchronously
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }
  }, []);

  const selectVoice = useCallback(
    (voiceType: VoiceType) => {
      if (voices.length === 0) return null;

      // Try to find a voice matching the preference
      let selectedVoice: SpeechSynthesisVoice | null = null;

      if (voiceType === 'filipino-female') {
        // Prioritize Filipino female voices
        selectedVoice =
          voices.find((v) => (v.lang.startsWith('fil') || v.lang.startsWith('tl')) && v.name.toLowerCase().includes('female')) ||
          voices.find((v) => (v.lang.startsWith('fil') || v.lang.startsWith('tl')) && v.name.toLowerCase().includes('woman')) ||
          voices.find((v) => v.lang.startsWith('fil') || v.lang.startsWith('tl')) ||
          voices.find((v) => v.name.toLowerCase().includes('filipino') && v.name.toLowerCase().includes('female')) ||
          voices.find((v) => v.name.toLowerCase().includes('tagalog') && v.name.toLowerCase().includes('female')) ||
          null;
      } else if (voiceType === 'filipino-male') {
        // Prioritize Filipino male voices
        selectedVoice =
          voices.find((v) => (v.lang.startsWith('fil') || v.lang.startsWith('tl')) && v.name.toLowerCase().includes('male')) ||
          voices.find((v) => (v.lang.startsWith('fil') || v.lang.startsWith('tl')) && v.name.toLowerCase().includes('man')) ||
          voices.find((v) => v.lang.startsWith('fil') || v.lang.startsWith('tl')) ||
          voices.find((v) => v.name.toLowerCase().includes('filipino') && v.name.toLowerCase().includes('male')) ||
          voices.find((v) => v.name.toLowerCase().includes('tagalog') && v.name.toLowerCase().includes('male')) ||
          null;
      } else if (voiceType === 'female') {
        // Prioritize female voices
        selectedVoice =
          voices.find((v) => v.name.toLowerCase().includes('female')) ||
          voices.find((v) => v.name.toLowerCase().includes('woman')) ||
          voices.find((v) => v.name.toLowerCase().includes('samantha')) ||
          voices.find((v) => v.name.toLowerCase().includes('victoria')) ||
          voices.find((v) => v.name.toLowerCase().includes('karen')) ||
          voices.find((v) => v.lang.startsWith('en') && !v.name.toLowerCase().includes('male')) ||
          null;
      } else {
        // Prioritize male voices
        selectedVoice =
          voices.find((v) => v.name.toLowerCase().includes('male')) ||
          voices.find((v) => v.name.toLowerCase().includes('man')) ||
          voices.find((v) => v.name.toLowerCase().includes('daniel')) ||
          voices.find((v) => v.name.toLowerCase().includes('james')) ||
          voices.find((v) => v.name.toLowerCase().includes('alex')) ||
          null;
      }

      // Fallback to any English voice or first available
      if (!selectedVoice) {
        selectedVoice = voices.find((v) => v.lang.startsWith('en')) || voices[0];
      }

      return selectedVoice;
    },
    [voices]
  );

  const announce = useCallback(
    (text: string) => {
      if (!isSupported || !settings.enableVoiceAnnouncements) {
        console.log('Voice announcements disabled or not supported');
        return;
      }

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      const voice = selectVoice(settings.voiceType);

      if (voice) {
        utterance.voice = voice;
      }

      utterance.rate = 0.9; // Slightly slower for clarity
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      window.speechSynthesis.speak(utterance);
    },
    [isSupported, settings.enableVoiceAnnouncements, settings.voiceType, selectVoice]
  );

  const announceNextPlayers = useCallback(
    (playerNames: string[], courtId: number) => {
      if (!settings.enableVoiceAnnouncements) return;

      let message = '';

      if (playerNames.length === 1) {
        message = `${playerNames[0]}, please proceed to court ${courtId}`;
      } else if (playerNames.length === 2) {
        message = `${playerNames[0]} and ${playerNames[1]}, please proceed to court ${courtId}`;
      } else if (playerNames.length === 3) {
        message = `${playerNames[0]}, ${playerNames[1]}, and ${playerNames[2]}, please proceed to court ${courtId}`;
      } else if (playerNames.length === 4) {
        message = `${playerNames[0]}, ${playerNames[1]}, ${playerNames[2]}, and ${playerNames[3]}, please proceed to court ${courtId}`;
      } else {
        const lastPlayer = playerNames[playerNames.length - 1];
        const otherPlayers = playerNames.slice(0, -1).join(', ');
        message = `${otherPlayers}, and ${lastPlayer}, please proceed to court ${courtId}`;
      }

      announce(message);
    },
    [settings.enableVoiceAnnouncements, announce]
  );

  return {
    isSupported,
    announce,
    announceNextPlayers,
    voices,
  };
}
