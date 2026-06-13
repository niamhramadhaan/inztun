import { Toast } from '../../../components/Toast';
import type { Tool } from '../../../types';

export class MorseCode implements Tool {
  id = 'morse-code';
  name = 'Morse Code';
  icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <circle cx="12" cy="12" r="10"/>
      <path d="M8 12h.01M12 12h.01M16 12h.01"/>
    </svg>`;
  badge = '';

  private readonly toMorse: Record<string, string> = {
    'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
    'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
    'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
    'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
    'Y': '-.--', 'Z': '--..',
    '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
    '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.',
    '.': '.-.-.-', ',': '--..--', '?': '..--..', '!': '-.-.--', '/': '-..-.',
    '(': '-.--.', ')': '-.--.-', '&': '.-...', ':': '---...', ';': '-.-.-.',
    '=': '-...-', '+': '.-.-.', '-': '-....-', '_': '..--.-', '"': '.-..-.',
    '$': '...-..-', '@': '.--.-.',
  };

  private readonly fromMorse: Record<string, string> = Object.fromEntries(
    Object.entries(this.toMorse).map(([k, v]) => [v, k])
  );

  private textEl!: HTMLTextAreaElement;
  private morseEl!: HTMLTextAreaElement;
  private countEl!: HTMLElement;

  render(): string {
    return `
      <div class="tool-area">
        <div class="tool-split">
          <div class="tool-area__input">
            <div class="label-row">
              <label class="label">Text</label>
              <span class="char-count" id="mc-text-count">0 chars</span>
            </div>
            <textarea class="input input--textarea" id="mc-text" placeholder="Enter text..." spellcheck="false">HELLO WORLD</textarea>
          </div>
          <div class="tool-area__output">
            <label class="label">Morse Code</label>
            <textarea class="input input--textarea" id="mc-morse" placeholder="Enter morse..." spellcheck="false"></textarea>
          </div>
        </div>
        <div class="tool-actions">
          <button class="btn btn--primary" id="mc-to-morse">Text → Morse</button>
          <button class="btn btn--primary" id="mc-to-text">Morse → Text</button>
          <button class="btn btn--ghost" id="mc-copy">Copy Morse</button>
          <button class="btn btn--ghost" id="mc-play">Play Sound</button>
        </div>
      </div>
    `;
  }

  init(root: HTMLElement): void {
    this.textEl = root.querySelector('#mc-text') as HTMLTextAreaElement;
    this.morseEl = root.querySelector('#mc-morse') as HTMLTextAreaElement;
    this.countEl = root.querySelector('#mc-text-count') as HTMLElement;

    (root.querySelector('#mc-to-morse') as HTMLElement)?.addEventListener('click', () => this.encode());
    (root.querySelector('#mc-to-text') as HTMLElement)?.addEventListener('click', () => this.decode());
    (root.querySelector('#mc-copy') as HTMLElement)?.addEventListener('click', () => {
      navigator.clipboard.writeText(this.morseEl.value);
      Toast.copied('Morse');
    });
    (root.querySelector('#mc-play') as HTMLElement)?.addEventListener('click', () => this.playSound());

    this.textEl?.addEventListener('input', () => {
      this.countEl.textContent = this.textEl.value.length + ' chars';
    });

    this.encode();
  }

  encode(): void {
    const text = this.textEl.value.toUpperCase();
    let result = '';
    for (const char of text) {
      if (char === ' ') {
        result += ' / ';
      } else if (this.toMorse[char]) {
        result += this.toMorse[char] + ' ';
      }
    }
    this.morseEl.value = result.trim();
    Toast.success('Encoded');
  }

  decode(): void {
    const morse = this.morseEl.value;
    const words = morse.split(' / ');
    let result = '';
    for (const word of words) {
      const letters = word.trim().split(' ');
      for (const letter of letters) {
        result += this.fromMorse[letter] || '?';
      }
      result += ' ';
    }
    this.textEl.value = result.trim();
    Toast.success('Decoded');
  }

  playSound(): void {
    const morse = this.morseEl.value;
    const AudioCtxClass = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const audioCtx = new AudioCtxClass();
    let time = audioCtx.currentTime;

    const dot = 0.1;
    const dash = dot * 3;
    const gap = dot;

    for (const char of morse) {
      if (char === '.') {
        this.beep(audioCtx, time, dot);
        time += dot + gap;
      } else if (char === '-') {
        this.beep(audioCtx, time, dash);
        time += dash + gap;
      } else if (char === ' ') {
        time += gap * 2;
      } else if (char === '/') {
        time += gap * 4;
      }
    }
    Toast.info('Playing morse...');
  }

  private beep(audioCtx: AudioContext, time: number, duration: number): void {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.value = 600;
    osc.type = 'sine';
    gain.gain.value = 0.3;
    gain.gain.exponentialRampToValueAtTime(0.01, time + duration);
    osc.start(time);
    osc.stop(time + duration);
  }

  destroy(): void {}
}
