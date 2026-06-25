import { Toast } from '../../../components/Toast';
import { db } from '../../../core/db';
import type { Tool } from '../../../types';

type Difficulty = 'easy' | 'medium' | 'hard';
type Mode = 'words' | 'timed';

interface TypingState {
  started: boolean;
  startTime: number;
  text: string;
  input: string;
  errors: number;
  finished: boolean;
}

const DIFFICULTY_META: Record<Difficulty, { label: string; target: number }> = {
  easy: { label: 'Easy', target: 30 },
  medium: { label: 'Medium', target: 50 },
  hard: { label: 'Hard', target: 70 },
};

const TIMED_OPTIONS = [15, 30, 60, 120] as const;

const TEXTS: Record<Difficulty, string[]> = {
  easy: [
    'The quick brown fox jumps over the lazy dog.',
    'Pack my box with five dozen liquor jugs.',
    'How vexingly quick daft zebras jump.',
    'Sphinx of black quartz, judge my vow.',
    'Two driven jocks help fax my big quiz.',
    'The five boxing wizards jump quickly.',
    'Jackdaws love my big sphinx of quartz.',
    'Crazy Frederick bought many very exquisite opal jewels.',
    'We promptly judged antique ivory buckles for the next prize.',
    'A mad boxer shot a quick, gloved jab to the jaw of his dizzy opponent.',
    'The job requires extra pluck and zeal from every young wage earner.',
    'Jaded zombies acted quaintly but kept driving their oxen forward.',
    'Sixty zippers were quickly picked from the woven jute bag.',
    'The bleak breeze blew beyond the broken blinds.',
    'Heavy boxes perform quick waltzes and jigs.',
    'Watch Jeopardy, Alex Trebek fun TV quiz game.',
    'By Jove, my quick study of lexicography won a prize.',
    'Waxy and quivering, jocks fumble the pizza.',
    'Quick zephyrs blow, vexing daft Jim.',
    'Two driven jocks help fax my big quiz.',
  ],
  medium: [
    'The rain had been falling steadily for three hours, turning the narrow streets into small rivers that carried leaves and debris toward the harbor. Maria watched from her window as the last few pedestrians hurried along with their umbrellas bent against the wind.',
    'In the heart of the old quarter, where cobblestone alleys twisted between ancient stone buildings, a small café served the best espresso in the city. The owner, a retired professor, spent his mornings reading philosophy and his afternoons debating with customers.',
    'The laboratory was quiet except for the hum of the centrifuge and the occasional click of a pipette. Dr. Chen carefully added the reagent to the solution, watching as the color shifted from clear to a deep amber over the course of several minutes.',
    'Software architecture decisions made early in a project have lasting consequences that ripple through every subsequent feature. Choosing the right data model, establishing clear boundaries between services, and defining clean interfaces can save months of refactoring later.',
    'The ancient library contained thousands of manuscripts carefully preserved behind glass panels. Scholars traveled from around the world to study these texts, some of which had not been read in centuries. The ink had faded but the words remained legible.',
    'Modern web development requires understanding both the visible layer that users interact with and the invisible infrastructure that powers it. Performance optimization, accessibility, and security are not afterthoughts but fundamental design principles.',
    'The mountain trail wound through dense forest before emerging onto a rocky ridge. From there, climbers could see the entire valley spread out below, patchwork fields of green and gold stretching to the distant horizon where peaks met the sky.',
    'Music theory provides a framework for understanding why certain combinations of notes evoke specific emotions. The interplay between tension and resolution, dissonance and harmony, creates the emotional arc that listeners experience as a journey.',
    'The detective examined the scene carefully, noting the position of every object. A overturned chair, a half-empty glass of water, and a book open to page forty-seven. Each detail told part of a story that had ended abruptly.',
    'Climate change affects ecosystems in complex ways that are difficult to predict. Rising temperatures shift growing seasons, alter migration patterns, and force species to adapt or relocate. Some thrive while others face extinction.',
    'The startup pivoted three times before finding its product market fit. Each iteration taught the team something valuable about customer needs, technical feasibility, and business models. Failure was not the opposite of success but a stepping stone toward it.',
    'Typography is the art of arranging type to make written language legible, readable, and appealing. The choice of typeface, line spacing, letter spacing, and line length all contribute to how effectively a message communicates its meaning.',
    'The chef prepared the mise en place with practiced efficiency, organizing every ingredient in its designated station. Onions diced, herbs washed, sauces reduced. When service began, there would be no time to search for anything.',
    'Quantum computing promises to solve problems that classical computers cannot efficiently handle. By leveraging superposition and entanglement, quantum algorithms could revolutionize cryptography, drug discovery, and optimization problems.',
    'The documentary filmmaker spent two years living among the indigenous community, building trust before even picking up a camera. The resulting film captured not just their traditions but their humor, resilience, and hope for the future.',
    'Urban planning requires balancing competing interests: economic development, environmental sustainability, historical preservation, and quality of life. The best cities find ways to honor their past while embracing the future.',
  ],
  hard: [
    'const debounce = <T extends (...args: unknown[]) => unknown>(fn: T, ms: number): ((...args: Parameters<T>) => void) => { let timer: ReturnType<typeof setTimeout>; return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); }; };',
    'interface StateMachine<S extends string, E extends string> { current: S; transitions: Record<S, Record<E, S>>; dispatch(event: E): void; } function createStateMachine<S extends string, E extends string>(initial: S, transitions: Record<S, Record<E, S>>): StateMachine<S, E> { return { current: initial, transitions, dispatch(event) { const next = this.transitions[this.current]?.[event]; if (next) this.current = next; }; } }',
    'export function mergeSort<T>(arr: T[], compare: (a: T, b: T) => number): T[] { if (arr.length <= 1) return arr; const mid = Math.floor(arr.length / 2); const left = mergeSort(arr.slice(0, mid), compare); const right = mergeSort(arr.slice(mid), compare); const result: T[] = []; let i = 0, j = 0; while (i < left.length && j < right.length) { if (compare(left[i], right[j]) <= 0) result.push(left[i++]); else result.push(right[j++]); } return result.concat(left.slice(i)).concat(right.slice(j)); }',
    'type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E }; function tryCatch<T>(fn: () => T): Result<T> { try { return { ok: true, value: fn() }; } catch (e) { return { ok: false, error: e instanceof Error ? e : new Error(String(e)) }; } }',
    "SELECT u.name, u.email, COUNT(o.id) AS order_count, SUM(o.total) AS lifetime_value FROM users u LEFT JOIN orders o ON u.id = o.user_id WHERE u.created_at >= '2025-01-01' AND u.status = 'active' GROUP BY u.id, u.name, u.email HAVING COUNT(o.id) > 5 ORDER BY lifetime_value DESC LIMIT 100;",
    'class EventEmitter<Events extends Record<string, unknown[]>> { private listeners = new Map<keyof Events, Set<Function>>(); on<K extends keyof Events>(event: K, fn: (...args: Events[K]) => void): void { if (!this.listeners.has(event)) this.listeners.set(event, new Set()); this.listeners.get(event)!.add(fn); } emit<K extends keyof Events>(event: K, ...args: Events[K]): void { this.listeners.get(event)?.forEach(fn => fn(...args)); } }',
    'fn build_pattern(regex: &str) -> Result<Regex, RegexError> { let parsed = parse(regex)?; let nfa = Thompson::build(&parsed); let dfa = Subset::convert(&nfa); let minimized = Hopcroft::minimize(&dfa); Ok(Regex { dfa: minimized, }) }',
    'import hashlib, struct def merkle_root(hashes: list[bytes]) -> bytes: while len(hashes) > 1: if len(hashes) % 2: hashes.append(hashes[-1]) hashes = [hashlib.sha256(hashes[i] + hashes[i+1]).digest() for i in range(0, len(hashes), 2)] return hashes[0]',
    'const pipeline = (...fns: Function[]) => (input: unknown) => fns.reduce((acc, fn) => fn(acc), input); const compose = (...fns: Function[]) => (input: unknown) => fns.reduceRight((acc, fn) => fn(acc), input);',
    'git rebase -i HEAD~5 --autosquash && git push --force-with-lease origin feature/auth-refactor && gh pr create --title "refactor(auth): consolidate session handling" --body "Migrates from JWT to server-side sessions with Redis backing store."',
    'docker compose -f docker-compose.prod.yml up -d --build --remove-orphans && docker exec app npx prisma migrate deploy && docker exec app npx prisma generate && curl -fsSL https://healthcheck.internal/ready | jq .',
    "SELECT DISTINCT p.name, p.price, c.category_name FROM products p INNER JOIN product_categories pc ON p.id = pc.product_id INNER JOIN categories c ON pc.category_id = c.id WHERE p.price BETWEEN 10.00 AND 100.00 AND c.category_name IN ('Electronics', 'Books') ORDER BY p.price ASC;",
    'ssh -L 5432:localhost:5432 -N -f -i ~/.ssh/prod_key deploy@bastion.example.com && PGPASSWORD=$(vault read -field=password secret/db/readonly) psql -h localhost -p 5432 -U readonly -d analytics -c "SELECT count(*) FROM events WHERE created_at > now() - interval \'24 hours\';"',
    'type Prettify<T> = { [K in keyof T]: T[K] } & {}; type DeepPartial<T> = T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } : T; type RequiredKeys<T> = { [K in keyof T]-?: undefined extends T[K] ? never : K }[keyof T];',
    'import numpy as np def attention(Q, K, V, mask=None): d_k = Q.shape[-1] scores = np.matmul(Q, K.transpose(-2, -1)) / np.sqrt(d_k) if mask is not None: scores = np.where(mask, scores, -1e9) weights = np.exp(scores - scores.max(axis=-1, keepdims=True)) weights = weights / weights.sum(axis=-1, keepdims=True) return np.matmul(weights, V)',
    'func (s *Server) handleWebSocket(w http.ResponseWriter, r *http.Request) { conn, err := upgrader.Upgrade(w, r, nil) if err != nil { log.Printf("upgrade error: %v", err); return } defer conn.Close() for { _, msg, err := conn.ReadMessage() if err != nil { break } s.broadcast <- msg } }',
  ],
};

export class TypingTest implements Tool {
  id = 'typing-test';
  name = 'Typing Test';
  icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10"/>
    </svg>`;
  badge = 'Fun';

  private difficulty: Difficulty = 'easy';
  private mode: Mode = 'words';
  private timedDuration = 30;
  private state: TypingState = {
    started: false,
    startTime: 0,
    text: '',
    input: '',
    errors: 0,
    finished: false,
  };
  private bestWpm: Record<Difficulty, number> = { easy: 0, medium: 0, hard: 0 };

  private displayEl!: HTMLElement;
  private inputEl!: HTMLTextAreaElement;
  private wpmEl!: HTMLElement;
  private accuracyEl!: HTMLElement;
  private timeEl!: HTMLElement;
  private errorsEl!: HTMLElement;
  private targetEl!: HTMLElement;
  private bestEl!: HTMLElement;
  private progressBar!: HTMLElement;
  private resultsEl!: HTMLElement;
  private timer: ReturnType<typeof setInterval> | undefined;

  render(): string {
    return `
      <div class="tool-area">
        <div class="tt-controls">
          <div class="tt-segment" id="tt-difficulty">
            <button class="tt-seg-btn tt-seg-btn--active" data-val="easy">Easy</button>
            <button class="tt-seg-btn" data-val="medium">Medium</button>
            <button class="tt-seg-btn" data-val="hard">Hard</button>
          </div>
          <div class="tt-segment" id="tt-mode">
            <button class="tt-seg-btn tt-seg-btn--active" data-val="words">Words</button>
            <button class="tt-seg-btn" data-val="timed">Timed</button>
          </div>
          <div class="tt-timed-select" id="tt-timed-select" style="display:none;">
            <button class="tt-time-btn" data-val="15">15s</button>
            <button class="tt-time-btn tt-time-btn--active" data-val="30">30s</button>
            <button class="tt-time-btn" data-val="60">60s</button>
            <button class="tt-time-btn" data-val="120">120s</button>
          </div>
        </div>
        <div class="tt-progress" id="tt-progress" style="display:none;">
          <div class="tt-progress__bar" id="tt-progress-bar"></div>
        </div>
        <div class="typing-stats" id="tt-stats">
          <div class="typing-stat typing-stat--main">
            <span class="typing-stat__value" id="tt-wpm">0</span>
            <span class="typing-stat__label">WPM</span>
            <span class="typing-stat__target" id="tt-target">target: 30</span>
          </div>
          <div class="typing-stat"><span class="typing-stat__value" id="tt-accuracy">100%</span><span class="typing-stat__label">Accuracy</span></div>
          <div class="typing-stat"><span class="typing-stat__value" id="tt-time">0s</span><span class="typing-stat__label">Time</span></div>
          <div class="typing-stat"><span class="typing-stat__value" id="tt-errors">0</span><span class="typing-stat__label">Errors</span></div>
          <div class="typing-stat"><span class="typing-stat__value" id="tt-best">0</span><span class="typing-stat__label">Best WPM</span></div>
        </div>
        <div class="typing-display" id="tt-display"></div>
        <textarea class="typing-input" id="tt-input" placeholder="Start typing to begin..." spellcheck="false" autocomplete="off"></textarea>
        <div class="tt-results" id="tt-results" style="display:none;"></div>
        <div class="tool-actions">
          <button class="btn btn--ghost" id="tt-new">New Text</button>
          <button class="btn btn--primary" id="tt-restart">Restart</button>
        </div>
      </div>
    `;
  }

  init(root: HTMLElement): void {
    this.displayEl = root.querySelector('#tt-display') as HTMLElement;
    this.inputEl = root.querySelector('#tt-input') as HTMLTextAreaElement;
    this.wpmEl = root.querySelector('#tt-wpm') as HTMLElement;
    this.accuracyEl = root.querySelector('#tt-accuracy') as HTMLElement;
    this.timeEl = root.querySelector('#tt-time') as HTMLElement;
    this.errorsEl = root.querySelector('#tt-errors') as HTMLElement;
    this.targetEl = root.querySelector('#tt-target') as HTMLElement;
    this.bestEl = root.querySelector('#tt-best') as HTMLElement;
    this.progressBar = root.querySelector('#tt-progress-bar') as HTMLElement;
    this.resultsEl = root.querySelector('#tt-results') as HTMLElement;

    this.inputEl?.addEventListener('input', () => this.onInput());
    (root.querySelector('#tt-restart') as HTMLElement)?.addEventListener('click', () =>
      this.restart(),
    );
    (root.querySelector('#tt-new') as HTMLElement)?.addEventListener('click', () => this.newText());

    root.querySelectorAll('#tt-difficulty .tt-seg-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.difficulty = (btn as HTMLElement).dataset.val as Difficulty;
        root
          .querySelectorAll('#tt-difficulty .tt-seg-btn')
          .forEach((b) => b.classList.remove('tt-seg-btn--active'));
        btn.classList.add('tt-seg-btn--active');
        this.updateTarget();
        this.updateBest();
        this.newText();
      });
    });

    root.querySelectorAll('#tt-mode .tt-seg-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.mode = (btn as HTMLElement).dataset.val as Mode;
        root
          .querySelectorAll('#tt-mode .tt-seg-btn')
          .forEach((b) => b.classList.remove('tt-seg-btn--active'));
        btn.classList.add('tt-seg-btn--active');
        const timedSelect = root.querySelector('#tt-timed-select') as HTMLElement;
        const progressWrap = root.querySelector('#tt-progress') as HTMLElement;
        timedSelect.style.display = this.mode === 'timed' ? '' : 'none';
        progressWrap.style.display = this.mode === 'timed' ? '' : 'none';
        this.newText();
      });
    });

    root.querySelectorAll('#tt-timed-select .tt-time-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.timedDuration = parseInt((btn as HTMLElement).dataset.val!);
        root
          .querySelectorAll('#tt-timed-select .tt-time-btn')
          .forEach((b) => b.classList.remove('tt-time-btn--active'));
        btn.classList.add('tt-time-btn--active');
        this.newText();
      });
    });

    this.loadBest();
    this.updateTarget();
    this.newText();
  }

  private loadBest(): void {
    db.getPreference('typingBest', {}).then((val) => {
      if (val && typeof val === 'object') {
        this.bestWpm = { ...this.bestWpm, ...(val as Record<Difficulty, number>) };
      }
      this.updateBest();
    });
  }

  private saveBest(): void {
    db.setPreference('typingBest', this.bestWpm);
  }

  private updateTarget(): void {
    this.targetEl.textContent = `target: ${DIFFICULTY_META[this.difficulty].target}`;
  }

  private updateBest(): void {
    this.bestEl.textContent = String(this.bestWpm[this.difficulty] || 0);
  }

  newText(): void {
    const pool = TEXTS[this.difficulty];
    if (this.mode === 'words') {
      this.state.text = pool[Math.floor(Math.random() * pool.length)];
    } else {
      const shuffled = [...pool].sort(() => Math.random() - 0.5);
      this.state.text = shuffled.slice(0, 3).join(' ');
    }
    this.restart();
  }

  restart(): void {
    this.state = {
      started: false,
      startTime: 0,
      text: this.state.text,
      input: '',
      errors: 0,
      finished: false,
    };
    this.inputEl.value = '';
    this.inputEl.disabled = false;
    this.resultsEl.style.display = 'none';
    this.progressBar.style.width = '0%';
    this.renderDisplay();
    this.updateStats();
    this.inputEl.focus();
  }

  onInput(): void {
    if (this.state.finished) return;

    if (!this.state.started) {
      this.state.started = true;
      this.state.startTime = Date.now();
      this.timer = setInterval(() => this.tick(), 100);
    }

    this.state.input = this.inputEl.value;
    this.state.errors = 0;
    for (let i = 0; i < this.state.input.length; i++) {
      if (this.state.input[i] !== this.state.text[i]) this.state.errors++;
    }

    this.renderDisplay();
    this.updateStats();

    if (this.mode === 'words' && this.state.input.length >= this.state.text.length) {
      this.finish();
    }
  }

  private tick(): void {
    const elapsed = (Date.now() - this.state.startTime) / 1000;

    if (this.mode === 'timed') {
      const remaining = Math.max(0, this.timedDuration - elapsed);
      const pct = Math.min((elapsed / this.timedDuration) * 100, 100);
      this.progressBar.style.width = `${pct}%`;
      this.timeEl.textContent = Math.ceil(remaining) + 's';

      if (remaining <= 0) {
        this.finish();
        return;
      }
    } else {
      this.timeEl.textContent = Math.floor(elapsed) + 's';
    }

    this.updateStats();
  }

  private finish(): void {
    this.state.finished = true;
    clearInterval(this.timer);
    this.inputEl.disabled = true;

    const wpm = this.calcWpm();
    const accuracy = this.calcAccuracy();

    if (wpm > this.bestWpm[this.difficulty]) {
      this.bestWpm[this.difficulty] = wpm;
      this.saveBest();
      this.updateBest();
    }

    const target = DIFFICULTY_META[this.difficulty].target;
    const hitTarget = wpm >= target;

    this.resultsEl.innerHTML = `
      <div class="tt-results__card">
        <div class="tt-results__wpm ${hitTarget ? 'tt-results__wpm--hit' : ''}">${wpm}</div>
        <div class="tt-results__label">WPM ${hitTarget ? '(target reached!)' : `(target: ${target})`}</div>
        <div class="tt-results__row">
          <span>Accuracy: <strong>${accuracy}%</strong></span>
          <span>Errors: <strong>${this.state.errors}</strong></span>
          <span>Best: <strong>${this.bestWpm[this.difficulty]}</strong></span>
        </div>
        <div class="tt-results__actions">
          <button class="btn btn--primary" id="tt-results-restart">Try Again</button>
          <button class="btn btn--ghost" id="tt-results-new">New Text</button>
        </div>
      </div>
    `;
    this.resultsEl.style.display = '';

    this.resultsEl
      .querySelector('#tt-results-restart')
      ?.addEventListener('click', () => this.restart());
    this.resultsEl
      .querySelector('#tt-results-new')
      ?.addEventListener('click', () => this.newText());

    Toast.success(hitTarget ? `WPM target reached! ${wpm} WPM` : `Test complete: ${wpm} WPM`);
  }

  private calcWpm(): number {
    const elapsed = (Date.now() - this.state.startTime) / 1000;
    const words = this.state.input.length / 5;
    return elapsed > 0 ? Math.round((words / elapsed) * 60) : 0;
  }

  private calcAccuracy(): number {
    const { input, errors } = this.state;
    return input.length > 0 ? Math.round(((input.length - errors) / input.length) * 100) : 100;
  }

  renderDisplay(): void {
    const { text, input } = this.state;
    let html = '';
    const displayLen = this.mode === 'timed' ? text.length : text.length;
    for (let i = 0; i < displayLen; i++) {
      let cls = '';
      if (i < input.length) {
        cls = input[i] === text[i] ? 'typing-char--correct' : 'typing-char--wrong';
      } else if (i === input.length) {
        cls = 'typing-char--current';
      }
      html += `<span class="typing-char ${cls}">${text[i] === ' ' ? '&nbsp;' : text[i]}</span>`;
    }
    this.displayEl.innerHTML = html;
  }

  updateStats(): void {
    const wpm = this.state.started ? this.calcWpm() : 0;
    const accuracy = this.calcAccuracy();

    this.wpmEl.textContent = String(wpm);
    this.accuracyEl.textContent = accuracy + '%';
    this.errorsEl.textContent = String(this.state.errors);

    if (!this.state.started && this.mode === 'timed') {
      this.timeEl.textContent = this.timedDuration + 's';
    }
  }

  destroy(): void {
    clearInterval(this.timer);
  }
}
