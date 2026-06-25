import { Toast } from '../../../components/Toast';
import { logToolAction } from '../../../core/activity';
import { db } from '../../../core/db';
import { ICONS } from '../../../core/icons';
import type { Tool } from '../../../types';

interface SchedulePost {
  id?: number;
  date: string;
  time: string;
  platform: string;
  contentType: string;
  status: 'scheduled' | 'posted' | 'skipped';
  createdAt: number;
}

const PLATFORMS = [
  { id: 'twitter', label: 'X/Twitter', color: '#1d9bf0', icon: '𝕏' },
  { id: 'instagram', label: 'Instagram', color: '#e4405f', icon: 'IG' },
  { id: 'linkedin', label: 'LinkedIn', color: '#0a66c2', icon: 'LI' },
  { id: 'facebook', label: 'Facebook', color: '#1877f2', icon: 'FB' },
  { id: 'tiktok', label: 'TikTok', color: '#ff0050', icon: 'TT' },
  { id: 'youtube', label: 'YouTube', color: '#ff0000', icon: 'YT' },
];

const CONTENT_TYPES = ['Post', 'Story', 'Reel', 'Thread', 'Video'];
const FREQUENCIES = [
  { id: 'daily', label: 'Daily', perWeek: 7 },
  { id: '3x', label: '3x/Week', perWeek: 3 },
  { id: 'weekly', label: 'Weekly', perWeek: 1 },
];

const BEST_TIMES: Record<string, { days: number[]; times: string[] }> = {
  twitter: { days: [1, 2, 3, 4, 5], times: ['09:00', '12:00', '17:00'] },
  instagram: { days: [1, 2, 3, 4, 5, 6], times: ['11:00', '14:00', '19:00'] },
  linkedin: { days: [1, 2, 3, 4, 5], times: ['08:00', '10:00', '12:00'] },
  facebook: { days: [1, 2, 3, 4, 5], times: ['09:00', '13:00', '16:00'] },
  tiktok: { days: [0, 1, 2, 3, 4, 5, 6], times: ['07:00', '12:00', '19:00'] },
  youtube: { days: [4, 5, 6, 0], times: ['14:00', '15:00', '16:00'] },
};

function generateSchedule(
  platforms: string[],
  frequency: string,
  weeks: number,
  contentTypes: string[],
): SchedulePost[] {
  const freq = FREQUENCIES.find((f) => f.id === frequency) || FREQUENCIES[0];
  const posts: SchedulePost[] = [];
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - startDate.getDay() + 1); // Start from Monday

  for (let week = 0; week < weeks; week++) {
    for (const platformId of platforms) {
      const bt = BEST_TIMES[platformId];
      if (!bt) continue;
      const platform = PLATFORMS.find((p) => p.id === platformId)!;

      let postsThisWeek = 0;
      for (let day = 0; day < 7 && postsThisWeek < freq.perWeek; day++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + week * 7 + day);

        if (!bt.days.includes(date.getDay())) continue;

        const time = bt.times[postsThisWeek % bt.times.length];
        const contentType = contentTypes[postsThisWeek % contentTypes.length];

        posts.push({
          date: date.toISOString().split('T')[0],
          time,
          platform: platformId,
          contentType,
          status: 'scheduled',
          createdAt: Date.now(),
        });
        postsThisWeek++;
      }
    }
  }

  return posts;
}

export class SocialScheduler implements Tool {
  id = 'social-scheduler';
  name = 'Social Scheduler';
  icon = ICONS.scheduler;

  private posts: SchedulePost[] = [];
  private selectedPlatforms = new Set(['twitter', 'instagram', 'linkedin']);
  private selectedTypes = new Set(['Post']);
  private frequency = '3x';
  private viewMode: 'month' | 'week' = 'month';
  private currentMonth: number;
  private currentYear: number;
  private root!: HTMLElement;

  constructor() {
    const now = new Date();
    this.currentMonth = now.getMonth();
    this.currentYear = now.getFullYear();
  }

  render(): string {
    return `
      <div class="tool-area">
        <div class="ss-controls">
          <div class="ss-platforms" id="ss-platforms">
            <label class="label">Platforms</label>
            <div class="ss-chips">
              ${PLATFORMS.map(
                (p) => `
                <button class="btn btn--ghost btn--sm ss-chip ${this.selectedPlatforms.has(p.id) ? 'ss-chip--active' : ''}" data-platform="${p.id}" style="--chip-color:${p.color}">
                  <span class="ss-chip-icon">${p.icon}</span> ${p.label}
                </button>
              `,
              ).join('')}
            </div>
          </div>
          <div class="ss-options">
            <div class="form-group">
              <label class="label">Frequency</label>
              <div class="ss-freq-toggle" id="ss-freq-toggle">
                ${FREQUENCIES.map((f) => `<button class="btn btn--ghost btn--sm ${f.id === '3x' ? 'ss-freq--active' : ''}" data-freq="${f.id}">${f.label}</button>`).join('')}
              </div>
            </div>
            <div class="form-group">
              <label class="label">Content Types</label>
              <div class="ss-chips" id="ss-types">
                ${CONTENT_TYPES.map(
                  (t) => `
                  <button class="btn btn--ghost btn--sm ss-type-chip ${this.selectedTypes.has(t) ? 'ss-type--active' : ''}" data-type="${t}">${t}</button>
                `,
                ).join('')}
              </div>
            </div>
          </div>
          <div class="tool-actions">
            <button class="btn btn--primary" id="ss-generate">Generate Schedule</button>
            <button class="btn btn--ghost" id="ss-clear">Clear All</button>
            <button class="btn btn--ghost" id="ss-export">Export CSV</button>
          </div>
        </div>

        <div class="ss-calendar-header">
          <button class="btn btn--ghost btn--sm" id="ss-prev">◀</button>
          <span class="ss-month-label" id="ss-month-label"></span>
          <button class="btn btn--ghost btn--sm" id="ss-next">▶</button>
          <div class="ss-view-toggle" id="ss-view-toggle">
            <button class="btn btn--ghost btn--sm ss-view--active" data-view="month">Month</button>
            <button class="btn btn--ghost btn--sm" data-view="week">Week</button>
          </div>
        </div>

        <div class="ss-calendar" id="ss-calendar"></div>

        <div class="ss-stats" id="ss-stats"></div>
      </div>
    `;
  }

  async init(root: HTMLElement): Promise<void> {
    this.root = root;
    this.posts = await this.loadPosts();

    // Platform toggles
    root.querySelectorAll('.ss-chip[data-platform]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = (btn as HTMLElement).dataset.platform!;
        if (this.selectedPlatforms.has(id)) this.selectedPlatforms.delete(id);
        else this.selectedPlatforms.add(id);
        btn.classList.toggle('ss-chip--active');
      });
    });

    // Frequency
    root.querySelectorAll('#ss-freq-toggle .btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        root
          .querySelectorAll('#ss-freq-toggle .btn')
          .forEach((b) => b.classList.remove('ss-freq--active'));
        btn.classList.add('ss-freq--active');
        this.frequency = (btn as HTMLElement).dataset.freq!;
      });
    });

    // Content types
    root.querySelectorAll('.ss-type-chip').forEach((btn) => {
      btn.addEventListener('click', () => {
        const type = (btn as HTMLElement).dataset.type!;
        if (this.selectedTypes.has(type)) this.selectedTypes.delete(type);
        else this.selectedTypes.add(type);
        btn.classList.toggle('ss-type--active');
      });
    });

    // View toggle
    root.querySelectorAll('#ss-view-toggle .btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        root
          .querySelectorAll('#ss-view-toggle .btn')
          .forEach((b) => b.classList.remove('ss-view--active'));
        btn.classList.add('ss-view--active');
        this.viewMode = (btn as HTMLElement).dataset.view as 'month' | 'week';
        this.renderCalendar();
      });
    });

    // Navigation
    root.querySelector('#ss-prev')!.addEventListener('click', () => this.navigate(-1));
    root.querySelector('#ss-next')!.addEventListener('click', () => this.navigate(1));

    // Generate
    root.querySelector('#ss-generate')!.addEventListener('click', async () => {
      if (this.selectedPlatforms.size === 0) {
        Toast.error('Select at least one platform');
        return;
      }
      if (this.selectedTypes.size === 0) {
        Toast.error('Select at least one content type');
        return;
      }

      const newPosts = generateSchedule(
        Array.from(this.selectedPlatforms),
        this.frequency,
        4,
        Array.from(this.selectedTypes),
      );

      await this.savePosts(newPosts);
      this.posts = [...this.posts, ...newPosts];
      this.renderCalendar();
      this.requestNotifications(newPosts);
      Toast.success(`Generated ${newPosts.length} posts`);
      logToolAction('social-scheduler', `Generated ${newPosts.length} posts`);
    });

    // Clear
    root.querySelector('#ss-clear')!.addEventListener('click', async () => {
      await this.clearPosts();
      this.posts = [];
      this.renderCalendar();
      Toast.info('Schedule cleared');
    });

    // Export
    root.querySelector('#ss-export')!.addEventListener('click', () => this.exportCSV());

    this.renderCalendar();
  }

  private navigate(delta: number): void {
    if (this.viewMode === 'month') {
      this.currentMonth += delta;
      if (this.currentMonth > 11) {
        this.currentMonth = 0;
        this.currentYear++;
      }
      if (this.currentMonth < 0) {
        this.currentMonth = 11;
        this.currentYear--;
      }
    } else {
      const d = new Date(this.currentYear, this.currentMonth, 1);
      d.setDate(d.getDate() + delta * 7);
      this.currentMonth = d.getMonth();
      this.currentYear = d.getFullYear();
    }
    this.renderCalendar();
  }

  private renderCalendar(): void {
    const calEl = this.root.querySelector('#ss-calendar')!;
    const labelEl = this.root.querySelector('#ss-month-label')!;
    const statsEl = this.root.querySelector('#ss-stats')!;

    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    labelEl.textContent = `${months[this.currentMonth]} ${this.currentYear}`;

    if (this.viewMode === 'month') {
      calEl.innerHTML = this.renderMonthView(dayNames);
    } else {
      calEl.innerHTML = this.renderWeekView(dayNames);
    }

    // Stats
    const weekPosts = this.posts.filter((p) => {
      const d = new Date(p.date);
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      return d >= weekStart && d <= weekEnd;
    });

    statsEl.innerHTML = `
      <div class="ss-stat-row">
        <span class="ss-stat-label">Total scheduled</span>
        <span class="ss-stat-value">${this.posts.length}</span>
      </div>
      <div class="ss-stat-row">
        <span class="ss-stat-label">This week</span>
        <span class="ss-stat-value">${weekPosts.length}</span>
      </div>
      ${PLATFORMS.filter((p) => this.posts.some((pp) => pp.platform === p.id))
        .map((p) => {
          const count = this.posts.filter((pp) => pp.platform === p.id).length;
          return `<div class="ss-stat-row"><span class="ss-stat-label" style="color:${p.color}">${p.icon}</span><span class="ss-stat-value">${count}</span></div>`;
        })
        .join('')}
    `;
  }

  private renderMonthView(dayNames: string[]): string {
    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
    const startOffset = (firstDay.getDay() + 6) % 7; // Monday = 0
    const daysInMonth = lastDay.getDate();

    let html = '<div class="ss-month-grid">';
    html += dayNames.map((d) => `<div class="ss-day-header">${d}</div>`).join('');

    // Empty cells
    for (let i = 0; i < startOffset; i++) html += '<div class="ss-day-cell ss-day-empty"></div>';

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayPosts = this.posts.filter((p) => p.date === dateStr);
      const isToday = dateStr === new Date().toISOString().split('T')[0];

      html += `<div class="ss-day-cell ${isToday ? 'ss-day-today' : ''}">`;
      html += `<span class="ss-day-num">${day}</span>`;
      html += '<div class="ss-day-posts">';
      for (const post of dayPosts.slice(0, 3)) {
        const platform = PLATFORMS.find((p) => p.id === post.platform);
        html += `<div class="ss-post-chip" style="background:${platform?.color || '#555'}20;color:${platform?.color || '#555'};border-left:2px solid ${platform?.color || '#555'}" data-id="${post.id}" title="${post.time} - ${post.contentType}">${platform?.icon || '?'} ${post.time}</div>`;
      }
      if (dayPosts.length > 3)
        html += `<span class="ss-day-more">+${dayPosts.length - 3} more</span>`;
      html += '</div></div>';
    }

    html += '</div>';
    return html;
  }

  private renderWeekView(dayNames: string[]): string {
    const now = new Date(this.currentYear, this.currentMonth, 1);
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);

    let html = '<div class="ss-week-grid">';
    html += '<div class="ss-week-times"><div class="ss-week-corner"></div>';
    for (let h = 6; h <= 22; h += 2)
      html += `<div class="ss-week-time">${String(h).padStart(2, '0')}:00</div>`;
    html += '</div>';

    for (let d = 0; d < 7; d++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + d);
      const dateStr = date.toISOString().split('T')[0];
      const dayPosts = this.posts.filter((p) => p.date === dateStr);
      const isToday = dateStr === new Date().toISOString().split('T')[0];

      html += `<div class="ss-week-col ${isToday ? 'ss-week-today' : ''}">`;
      html += `<div class="ss-week-day-header">${dayNames[d]} ${date.getDate()}</div>`;

      for (let h = 6; h <= 22; h += 2) {
        const hourStr = String(h).padStart(2, '0');
        const hourPosts = dayPosts.filter((p) => p.time.startsWith(hourStr));
        html += `<div class="ss-week-slot">`;
        for (const post of hourPosts) {
          const platform = PLATFORMS.find((p) => p.id === post.platform);
          html += `<div class="ss-week-post" style="background:${platform?.color || '#555'}30;border-left:2px solid ${platform?.color || '#555'};color:${platform?.color || '#555'}">${platform?.icon} ${post.time}</div>`;
        }
        html += '</div>';
      }
      html += '</div>';
    }

    html += '</div>';
    return html;
  }

  private async loadPosts(): Promise<SchedulePost[]> {
    try {
      return (await db.getAllSocialSchedule()) as SchedulePost[];
    } catch {
      return [];
    }
  }

  private async savePosts(posts: SchedulePost[]): Promise<void> {
    try {
      for (const post of posts) {
        await db.addSocialSchedulePost(post);
      }
    } catch {}
  }

  private async clearPosts(): Promise<void> {
    try {
      await db.clearSocialSchedule();
    } catch {}
  }

  private requestNotifications(posts: SchedulePost[]): void {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
    if (Notification.permission !== 'granted') return;

    const now = Date.now();
    for (const post of posts.slice(0, 5)) {
      const postTime = new Date(`${post.date}T${post.time}`).getTime();
      const delay = postTime - now - 15 * 60 * 1000; // 15 min before
      if (delay > 0 && delay < 86400000) {
        // Within 24h
        const platform = PLATFORMS.find((p) => p.id === post.platform);
        setTimeout(() => {
          new Notification(`${platform?.label || post.platform} post in 15 min`, {
            body: `${post.contentType} scheduled at ${post.time}`,
            icon: '/favicon.ico',
          });
        }, delay);
      }
    }
  }

  private exportCSV(): void {
    if (this.posts.length === 0) {
      Toast.info('No posts to export');
      return;
    }
    const header = 'Date,Time,Platform,Content Type,Status';
    const rows = this.posts.map(
      (p) => `${p.date},${p.time},${p.platform},${p.contentType},${p.status}`,
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `[Inztun] social-schedule-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    Toast.success('CSV exported');
    logToolAction('social-scheduler', 'Exported schedule CSV');
  }

  destroy(): void {}
}
