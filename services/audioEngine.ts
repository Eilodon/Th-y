import * as Tone from 'tone';

let synth: Tone.Source | null = null;
let effect: Tone.Effect | null = null;
let breathingLoop: Tone.Loop | null = null;
let breathSynth: Tone.Synth | null = null;
let isInitialized = false;

export const initAudio = async () => {
  if (isInitialized) return;
  await Tone.start();
  Tone.Destination.volume.value = -15; // Global volume ceiling (~18%)
  isInitialized = true;
};

export const setMute = (mute: boolean) => {
  Tone.Destination.mute = mute;
};

export const stopAudio = () => {
  synth?.stop(); synth?.dispose(); synth = null;
  effect?.dispose(); effect = null;
  breathingLoop?.stop(); breathingLoop?.dispose(); breathingLoop = null;
  breathSynth?.dispose(); breathSynth = null;
  Tone.Transport.stop();
  Tone.Transport.cancel();
};

export const playAmbient = (emotion: string) => {
  if (!isInitialized) return;
  // Stop existing ambient, keep breathing if active (handled separately or reset)
  if (synth) { synth.stop(); synth.dispose(); synth = null; }
  if (effect) { effect.dispose(); effect = null; }

  const vol = new Tone.Volume(-5).toDestination();

  switch (emotion) {
    case 'anxious': // Grounding: Lowpass Pink Noise (Rain-like)
      synth = new Tone.Noise('pink').start();
      effect = new Tone.AutoFilter({ frequency: 0.1, depth: 0.4, baseFrequency: 200 }).start();
      synth.connect(effect); effect.connect(vol);
      break;
    case 'sad': // Comfort: Warm Singing Bowl (Sine + Tremolo)
      synth = new Tone.Oscillator(174, 'sine').start(); // 174Hz Solfeggio frequency
      effect = new Tone.Tremolo({ frequency: 3, depth: 0.3, spread: 0 }).start();
      synth.connect(effect); effect.connect(vol);
      break;
    case 'joyful': // Uplifting: Bright Pad
      synth = new Tone.Oscillator(432, 'triangle').start();
      effect = new Tone.Chorus({ frequency: 1.5, delayTime: 3.5, depth: 0.7 }).start();
      synth.connect(effect); effect.connect(vol);
      break;
    case 'calm': // Nature: Wind (Brown Noise + Sweeping Filter)
    case 'neutral':
      synth = new Tone.Noise('brown').start();
      effect = new Tone.Filter(400, "lowpass");
      const lfo = new Tone.LFO(0.05, 200, 600).start();
      lfo.connect((effect as Tone.Filter).frequency);
      synth.connect(effect); effect.connect(vol);
      break;
  }
};

export const startBreathing = (type: string) => {
  if (!isInitialized || type !== '4-7-8') return;
  
  // Clean up previous breathing
  if (breathingLoop) { breathingLoop.dispose(); }
  if (breathSynth) { breathSynth.dispose(); }

  // Soft sine for guide
  breathSynth = new Tone.Synth({
    oscillator: { type: 'sine' },
    envelope: { attack: 2, decay: 0.1, sustain: 1, release: 2 }
  }).toDestination();
  breathSynth.volume.value = -8;

  // 4-7-8 Cycle: Inhale 4s, Hold 7s, Exhale 8s = 19s
  breathingLoop = new Tone.Loop(time => {
    // Inhale: Rise pitch
    breathSynth?.triggerAttack("C3", time);
    breathSynth?.frequency.rampTo("G3", 4, time);
    
    // Exhale: Fall pitch (starts at 4+7 = 11s)
    breathSynth?.triggerRelease(time + 11); // Sustain holds during 'Hold'
    breathSynth?.triggerAttack("G3", time + 11);
    breathSynth?.frequency.rampTo("C3", 8, time + 11);
    breathSynth?.triggerRelease(time + 19);
  }, 19).start(0);

  Tone.Transport.start();
};