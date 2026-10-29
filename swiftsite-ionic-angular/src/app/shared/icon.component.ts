import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

export type IconName =
  | 'home' | 'quote' | 'orders' | 'profile' | 'back' | 'pin' | 'calendar' | 'chat' | 'star'
  | 'chevron-down' | 'check' | 'camera' | 'plus' | 'minus' | 'eye' | 'eye-off'
  | 'sillas' | 'muebles' | 'colchones' | 'banos';

/**
 * Iconos de línea de SwiftSite Clean (mismo trazo que los mockups).
 * Uso: <ssc-icon name="home" [size]="24" />   (hereda el color con currentColor)
 */
@Component({
  selector: 'ssc-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [':host { display: inline-flex; line-height: 0; }'],
  template: `
    <svg [attr.width]="size" [attr.height]="size" viewBox="0 0 24 24" [attr.fill]="name === 'star' && filled ? '#FFD23F' : 'none'"
         stroke="currentColor" [attr.stroke-width]="strokeWidth" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      @switch (name) {
        @case ('home') { <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/> }
        @case ('quote') { <path d="M6 2h12v20l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/> }
        @case ('orders') { <rect x="5" y="4" width="14" height="18" rx="2"/><path d="M9 4V3h6v1M9 10h6M9 14h6M9 18h3"/> }
        @case ('profile') { <circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/> }
        @case ('back') { <path d="m15 18-6-6 6-6"/> }
        @case ('pin') { <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/> }
        @case ('calendar') { <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/> }
        @case ('chat') { <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/> }
        @case ('star') { <path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.9L12 17.8 5.8 21l1.2-6.9-5-4.9 6.9-1z"/> }
        @case ('chevron-down') { <path d="m6 9 6 6 6-6"/> }
        @case ('check') { <path d="M20 6 9 17l-5-5"/> }
        @case ('camera') { <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/><circle cx="12" cy="13" r="3.2"/> }
        @case ('plus') { <path d="M12 5v14M5 12h14"/> }
        @case ('minus') { <path d="M5 12h14"/> }
        @case ('eye') { <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/> }
        @case ('eye-off') { <path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.2A9.8 9.8 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4.2M6.6 6.6A17 17 0 0 0 2 12s3.6 7 10 7a9.7 9.7 0 0 0 4.2-1"/> }
        @case ('sillas') { <path d="M7 3h10v8H7zM9.5 6h5M6 11h12v3H6zM8 14v7M16 14v7"/> }
        @case ('muebles') { <path d="M5 11V8a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v3"/><path d="M3 12a2 2 0 0 1 4 0v3h10v-3a2 2 0 0 1 4 0v5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z" fill="#FFD23F"/><path d="M6 18v2M18 18v2"/> }
        @case ('colchones') { <path d="M2 18V6M2 14h20v4M22 14v-2a3 3 0 0 0-3-3h-7v5"/><circle cx="7" cy="11" r="2" fill="#FFD23F"/> }
        @case ('banos') { <path d="M3 13h18v2a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5zM6 13V7a2.5 2.5 0 0 1 5 0"/><path d="M14 6c0 0-1.5 1.6-1.5 2.5a1.5 1.5 0 0 0 3 0C15.5 7.6 14 6 14 6z" fill="#00E5FF"/> }
      }
    </svg>
  `,
})
export class IconComponent {
  @Input({ required: true }) name!: IconName;
  @Input() size = 24;
  @Input() strokeWidth = 2;
  /** Solo para `star`: la rellena de amarillo. */
  @Input() filled = false;
}
