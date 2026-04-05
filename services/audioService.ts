
/**
 * Solo Task Audio Engine - Dark RPG Edition
 * Pure Web Audio API Implementation (Offline / Zero Asset)
 */

class AudioEngine {
    private ctx: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private ambientSource: AudioBufferSourceNode | null = null;
    private ambientGain: GainNode | null = null;
    private volume: number = 0.5;
    private isMuted: boolean = false;
    private noiseBuffer: AudioBuffer | null = null;

    constructor() {
        // Lazy init in methods to adhere to browser autoplay policies
    }

    private getContext(): AudioContext {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.connect(this.ctx.destination);
            this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
            this.createNoiseBuffer();
        }
        
        // Android Fix: Ensure context is running if it was suspended by OS
        if (this.ctx.state === 'suspended') {
            this.ctx.resume().catch(e => console.warn("Audio resume failed", e));
        }
        
        return this.ctx;
    }

    // ⚡ Public Method to force resume on App Foreground
    public resumeContext() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().then(() => {
                console.log("Audio Engine: Resumed by System");
            });
        }
    }

    private createNoiseBuffer() {
        if (!this.ctx) return;
        const bufferSize = this.ctx.sampleRate * 2; // 2 seconds of noise
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1; // White noise
        }
        this.noiseBuffer = buffer;
    }

    public setVolume(vol: number) {
        this.volume = Math.max(0, Math.min(1, vol));
        if (this.masterGain && this.ctx) {
            this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime, 0.1);
        }
    }

    public setMute(muted: boolean) {
        this.isMuted = muted;
        if (this.masterGain && this.ctx) {
            this.masterGain.gain.setTargetAtTime(muted ? 0 : this.volume, this.ctx.currentTime, 0.1);
        }
    }

    // --- FX Helpers ---

    private createReverb(duration: number = 1.0, decay: number = 2.0): GainNode {
        const ctx = this.getContext();
        // Simulating reverb using delay feedback for "metallic" room sound
        const input = ctx.createGain();
        const delay = ctx.createDelay();
        const feedback = ctx.createGain();
        const output = ctx.createGain();
        
        delay.delayTime.value = 0.03; // 30ms slapback for metallic feel
        feedback.gain.value = 0.4;
        
        input.connect(output);
        input.connect(delay);
        delay.connect(feedback);
        feedback.connect(delay);
        feedback.connect(output);
        
        // Connect to master
        if (this.masterGain) output.connect(this.masterGain);
        return input;
    }

    // --- Sound Synthesis Methods ---

    /**
     * UI Click: Short, crisp blip
     */
    public playClick() {
        const ctx = this.getContext();
        const now = ctx.currentTime;
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.05);
        
        gain.gain.setValueAtTime(0.08, now); // Quiet
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

        osc.connect(gain);
        if (this.masterGain) gain.connect(this.masterGain);
        
        osc.start(now);
        osc.stop(now + 0.05);
    }

    /**
     * Stat Tick: Very short, high pitch digital tick for sequential text
     */
    public playStatTick() {
        const ctx = this.getContext();
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(1200, now);
        
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

        osc.connect(gain);
        if (this.masterGain) gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.03);
    }

    /**
     * Tab Switch: Airy swoosh
     */
    public playTabSwitch() {
        const ctx = this.getContext();
        const now = ctx.currentTime;
        
        // Swoosh sound (filtered noise)
        const bufferSize = ctx.sampleRate * 0.2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(400, now);
        filter.frequency.linearRampToValueAtTime(1200, now + 0.15);
        filter.Q.value = 1;
        
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.15);
        
        noise.connect(filter).connect(gain);
        if (this.masterGain) gain.connect(this.masterGain);
        
        noise.start(now);
    }

    /**
     * Toggle Switch: Up/Down pitch
     */
    public playToggle(state: boolean) {
        const ctx = this.getContext();
        const now = ctx.currentTime;
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        // Up for on, Down for off
        const f1 = state ? 400 : 600;
        const f2 = state ? 600 : 400;
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f1, now);
        osc.frequency.linearRampToValueAtTime(f2, now + 0.1);
        
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        
        osc.connect(gain);
        if (this.masterGain) gain.connect(this.masterGain);
        
        osc.start(now);
        osc.stop(now + 0.1);
    }

    /**
     * Pop: Modal Open
     */
    public playPop() {
        const ctx = this.getContext();
        const now = ctx.currentTime;
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.linearRampToValueAtTime(600, now + 0.05);
        
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        
        osc.connect(gain);
        if (this.masterGain) gain.connect(this.masterGain);
        
        osc.start(now);
        osc.stop(now + 0.05);
    }

    /**
     * Error: Sharp buzz
     */
    public playError() {
        const ctx = this.getContext();
        const now = ctx.currentTime;
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(100, now + 0.15);
        
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        
        osc.connect(gain);
        if (this.masterGain) gain.connect(this.masterGain);
        
        osc.start(now);
        osc.stop(now + 0.15);
    }

    /**
     * Success: Bright chime
     */
    public playSuccess() {
        const ctx = this.getContext();
        const now = ctx.currentTime;
        
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(600, now);
        osc1.frequency.linearRampToValueAtTime(800, now + 0.1);
        
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(800, now + 0.1);
        osc2.frequency.linearRampToValueAtTime(1200, now + 0.2);
        
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.15, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        
        osc1.connect(gain);
        osc2.connect(gain);
        if (this.masterGain) gain.connect(this.masterGain);
        
        osc1.start(now);
        osc1.stop(now + 0.1);
        osc2.start(now + 0.1);
        osc2.stop(now + 0.3);
    }

    /**
     * Standard Task Completion: Soft metallic ping
     */
    public playTaskComplete() {
        const ctx = this.getContext();
        const now = ctx.currentTime;
        const gain = ctx.createGain();
        
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
        
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

        osc.connect(gain);
        // Add subtle echo
        const reverb = this.createReverb();
        gain.connect(reverb);
        
        osc.start(now);
        osc.stop(now + 0.3);
    }

    /**
     * Hard/Expert Task: Heavy impact tone
     */
    public playHardTaskComplete() {
        const ctx = this.getContext();
        const now = ctx.currentTime;
        const gain = ctx.createGain();
        
        // Low impact
        const osc1 = ctx.createOscillator();
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(100, now);
        osc1.frequency.exponentialRampToValueAtTime(40, now + 0.4);

        // High metallic ring
        const osc2 = ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(400, now);
        osc2.frequency.linearRampToValueAtTime(800, now + 0.1);

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

        osc1.connect(gain);
        osc2.connect(gain);
        
        if (this.masterGain) gain.connect(this.masterGain);
        
        osc1.start(now);
        osc1.stop(now + 0.6);
        osc2.start(now);
        osc2.stop(now + 0.6);
    }

    /**
     * XP Gain: Sci-fi digital pulse
     */
    public playXpGain() {
        const ctx = this.getContext();
        const now = ctx.currentTime;
        const gain = ctx.createGain();
        const osc = ctx.createOscillator();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(600, now + 0.15);
        
        // Lowpass to make it less harsh
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1000;

        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.15);

        osc.connect(filter);
        filter.connect(gain);
        if (this.masterGain) gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.15);
    }

    /**
     * LEVEL UP: Complex multi-layered cinematic sound
     */
    public playLevelUp() {
        const ctx = this.getContext();
        const now = ctx.currentTime;

        // Layer 1: Sub-bass Swell (The Power)
        const subOsc = ctx.createOscillator();
        const subGain = ctx.createGain();
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(40, now);
        subOsc.frequency.linearRampToValueAtTime(60, now + 1.5);
        subGain.gain.setValueAtTime(0, now);
        subGain.gain.linearRampToValueAtTime(0.6, now + 0.5);
        subGain.gain.exponentialRampToValueAtTime(0.01, now + 2.5);

        // Layer 2: Mid-range Sweep (The Rise)
        const midOsc = ctx.createOscillator();
        const midGain = ctx.createGain();
        const midFilter = ctx.createBiquadFilter();
        midOsc.type = 'sawtooth';
        midOsc.frequency.setValueAtTime(100, now);
        midOsc.frequency.exponentialRampToValueAtTime(800, now + 1.0);
        midFilter.type = 'lowpass';
        midFilter.frequency.setValueAtTime(200, now);
        midFilter.frequency.linearRampToValueAtTime(2000, now + 1.0);
        midGain.gain.setValueAtTime(0, now);
        midGain.gain.linearRampToValueAtTime(0.2, now + 0.8);
        midGain.gain.linearRampToValueAtTime(0, now + 1.2);

        // Layer 3: Impact/Explosion (The Release)
        const impactTime = now + 1.0;
        const noiseSrc = ctx.createBufferSource();
        if (this.noiseBuffer) noiseSrc.buffer = this.noiseBuffer;
        const noiseFilter = ctx.createBiquadFilter();
        const noiseGain = ctx.createGain();
        noiseFilter.type = 'lowpass';
        noiseFilter.frequency.setValueAtTime(500, impactTime);
        noiseFilter.frequency.exponentialRampToValueAtTime(100, impactTime + 1.0);
        noiseGain.gain.setValueAtTime(0, impactTime);
        noiseGain.gain.setValueAtTime(0.4, impactTime); // Burst
        noiseGain.gain.exponentialRampToValueAtTime(0.01, impactTime + 1.5);
        
        // Routing
        if (this.masterGain) {
            subOsc.connect(subGain).connect(this.masterGain);
            midOsc.connect(midFilter).connect(midGain).connect(this.masterGain);
            
            // Reverb on impact
            const reverb = this.createReverb();
            noiseSrc.connect(noiseFilter).connect(noiseGain);
            noiseGain.connect(reverb); 
        }

        // Execution
        subOsc.start(now);
        subOsc.stop(now + 2.5);
        midOsc.start(now);
        midOsc.stop(now + 1.2);
        noiseSrc.start(impactTime);
        noiseSrc.stop(impactTime + 1.5);
    }

    /**
     * Energy Restore: Calm Chime
     */
    public playEnergyRestore() {
        const ctx = this.getContext();
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now); // A4
        osc.frequency.setValueAtTime(554, now + 0.1); // C#5
        osc.frequency.setValueAtTime(659, now + 0.2); // E5
        
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.1, now + 0.1);
        gain.gain.linearRampToValueAtTime(0, now + 1.0);

        osc.connect(gain);
        if (this.masterGain) gain.connect(this.masterGain);
        
        osc.start(now);
        osc.stop(now + 1.0);
    }

    /**
     * Energy Depleted: Low Pulse
     */
    public playEnergyWarning() {
        const ctx = this.getContext();
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(60, now);
        osc.frequency.linearRampToValueAtTime(40, now + 0.3);
        
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

        osc.connect(gain);
        if (this.masterGain) gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.4);
    }

    /**
     * Failure/Missed Task: Low metallic thud
     */
    public playFailure() {
        const ctx = this.getContext();
        const now = ctx.currentTime;
        const gain = ctx.createGain();
        
        // Low thud
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(80, now);
        osc.frequency.exponentialRampToValueAtTime(10, now + 0.5);

        // Filter
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(200, now);
        filter.frequency.linearRampToValueAtTime(50, now + 0.5);

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

        osc.connect(filter);
        filter.connect(gain);
        if (this.masterGain) gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.5);
    }

    /**
     * Weekly Report/Hidden Unlock: Mystery Reveal
     */
    public playMysteryReveal() {
        const ctx = this.getContext();
        const now = ctx.currentTime;
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.frequency.setValueAtTime(200, now);
        osc2.frequency.setValueAtTime(204, now); // Slight detune for phasing

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.15, now + 0.5);
        gain.gain.linearRampToValueAtTime(0, now + 2.0);

        osc1.connect(gain);
        osc2.connect(gain);
        
        const reverb = this.createReverb();
        gain.connect(reverb);

        osc1.start(now);
        osc1.stop(now + 2.0);
        osc2.start(now);
        osc2.stop(now + 2.0);
    }

    /**
     * Motivation Boost: Rising energy sound
     */
    public playBoost() {
        if (!this.ctx) this.getContext(); 
        const ctx = this.getContext();
        const now = ctx.currentTime;
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.4);
        
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.2, now + 0.1);
        gain.gain.linearRampToValueAtTime(0, now + 0.4);
        
        osc.connect(gain);
        if (this.masterGain) gain.connect(this.masterGain);
        
        osc.start(now);
        osc.stop(now + 0.4);
    }
    
    // --- Ambient Drone (Dungeon Vibe) ---
    
    public startAmbient() {
        if (this.ambientSource) return; // Already playing

        const ctx = this.getContext();
        const src = ctx.createBufferSource();
        if (this.noiseBuffer) src.buffer = this.noiseBuffer;
        src.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 100; // Low rumble
        filter.Q.value = 1;

        const gain = ctx.createGain();
        gain.gain.value = 0.05; // Very subtle

        // LFO to modulate filter (breathing effect)
        const lfo = ctx.createOscillator();
        lfo.frequency.value = 0.2; // Slow cycle
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 50;
        lfo.connect(lfoGain).connect(filter.frequency);

        src.connect(filter).connect(gain);
        if (this.masterGain) gain.connect(this.masterGain);

        src.start();
        lfo.start();

        this.ambientSource = src;
        this.ambientGain = gain;
    }

    public stopAmbient() {
        if (this.ambientSource) {
            // Fade out
            if (this.ambientGain && this.ctx) {
                this.ambientGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.5);
            }
            setTimeout(() => {
                this.ambientSource?.stop();
                this.ambientSource = null;
                this.ambientGain = null;
            }, 600);
        }
    }
}

export const AudioService = new AudioEngine();
