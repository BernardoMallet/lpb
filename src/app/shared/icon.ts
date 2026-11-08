import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

interface IconDef {
  d: string;
  fill?: boolean;
}

const ICONS = {
  instagram: {
    d: 'M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM17.5 6.5h.01',
  },
  facebook: {
    fill: true,
    d: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
  },
  spotify: {
    fill: true,
    d: 'M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z',
  },
  prev: { d: 'M15 18l-6-6 6-6' },
  next: { d: 'M9 18l6-6-6-6' },
  menu: { d: 'M4 6h16M4 12h16M4 18h16' },
  close: { d: 'M6 6l12 12M18 6L6 18' },
  pause: { fill: true, d: 'M6 5h4v14H6zM14 5h4v14h-4z' },
  play: { fill: true, d: 'M7 4l13 8-13 8z' },
  pin: {
    d: 'M12 21s7-6.2 7-11.5a7 7 0 1 0-14 0C5 14.8 12 21 12 21zM12 7.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z',
  },
  bag: { d: 'M6 8h12l1 12H5L6 8zM9 8a3 3 0 0 1 6 0' },
  ext: { d: 'M7 17L17 7M8 7h9v9' },
  users: {
    d: 'M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20M10 4a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zM20 20v-1.5a3.5 3.5 0 0 0-2.6-3.4M15.5 4.2a3.5 3.5 0 0 1 0 6.6',
  },
  ticket: { d: 'M3 9V6h18v3a3 3 0 0 0 0 6v3H3v-3a3 3 0 0 0 0-6zM13 6v12' },
  card: { d: 'M3 6h18v12H3zM3 10h18M7 15h4' },
  music: {
    d: 'M9 18V5l11-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM20 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z',
  },
  calendar: { d: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4' },
  bus: {
    d: 'M6 3h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM4 11h16M4 7h16M7 18v2.5M17 18v2.5M7.5 14.5h.01M16.5 14.5h.01',
  },
  tag: { d: 'M3 12V4h8l10 10-8 8L3 12zM7.5 7.5h.01' },
  star: {
    fill: true,
    d: 'M12 2l3 6.5 7 .8-5.2 4.8 1.5 7-6.3-3.6L5.7 21l1.5-7L2 9.3l7-.8z',
  },
  user: { d: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z' },
  logout: { d: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9' },
  chevron: { d: 'M6 9l6 6 6-6' },
  alert: {
    d: 'M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
  },
  info: { d: 'M12 16v-4M12 8h.01M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z' },
  check: { d: 'M5 13l4 4L19 7' },
  lock: { d: 'M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4' },
  news: { d: 'M4 4h13v16H4zM17 8h3v11a1 1 0 0 1-1 1h-2M8 8h5M8 12h5M8 16h3' },
  key: {
    d: 'M15.5 7.5l3 3L22 7l-3-3-3.5 3.5zM12.4 11.6a5 5 0 1 1-7 7 5 5 0 0 1 7-7zM12.4 11.6l3.1-3.1',
  },
  ban: { d: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM5.6 5.6l12.8 12.8' },
} satisfies Record<string, IconDef>;

export type IconName = keyof typeof ICONS;

@Component({
  selector: 'app-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
  template: `
    <svg
      viewBox="0 0 24 24"
      [attr.fill]="def().fill ? 'currentColor' : 'none'"
      [attr.stroke]="def().fill ? 'none' : 'currentColor'"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      focusable="false"
    >
      <path [attr.d]="def().d" />
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
      width: 1.25em;
      height: 1.25em;
      flex: none;
    }
    svg {
      width: 100%;
      height: 100%;
    }
  `,
})
export class Icon {
  readonly name = input.required<IconName>();

  protected readonly def = computed<IconDef>(() => ICONS[this.name()]);
}
