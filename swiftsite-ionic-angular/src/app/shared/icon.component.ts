import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

export type IconName =
  | 'home' | 'quote' | 'orders' | 'profile' | 'back' | 'pin' | 'calendar' | 'chat' | 'star'
  | 'chevron-down' | 'chevron-right' | 'spark' | 'clock' | 'arrows' | 'moon' | 'phone' | 'mail' | 'help' | 'warning' | 'receipt' | 'edit' | 'lock' | 'doc' | 'shield' | 'logout' | 'trash' | 'check' | 'camera' | 'plus' | 'minus' | 'eye' | 'eye-off'
  | 'sillas' | 'muebles' | 'colchones' | 'banos'
  | 'servicio' | 'pisos' | 'cisterna' | 'ventanas' | 'alfombras' | 'cocina' | 'auto' | 'jardin' | 'limpieza';

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
        @case ('clock') { <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/> }
        @case ('spark') { <path d="M12 2l2.6 7.4L22 12l-7.4 2.6L12 22l-2.6-7.4L2 12l7.4-2.6z" fill="#FFD23F" stroke-width="1.8"/> }
        @case ('arrows') { <path d="m8 8-4 4 4 4M16 8l4 4-4 4"/> }
        @case ('moon') { <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/> }
        @case ('phone') { <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/> }
        @case ('mail') { <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/> }
        @case ('help') { <circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01"/> }
        @case ('warning') { <path d="m10.3 3.9-8.5 14.7A2 2 0 0 0 3.5 21.6h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01"/> }
        @case ('receipt') { <rect x="5" y="4" width="14" height="18" rx="2"/><path d="M9 4V3h6v1M9 10h6M9 14h6M9 18h3"/> }
        @case ('chevron-right') { <path d="m9 18 6-6-6-6"/> }
        @case ('edit') { <path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/> }
        @case ('lock') { <rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/> }
        @case ('doc') { <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z"/><path d="M14 2v5h5M9 13h6M9 17h6"/> }
        @case ('shield') { <path d="M12 3 4 6v6c0 4.5 3.4 8.2 8 9 4.6-.8 8-4.5 8-9V6z"/><path d="m9 12 2 2 4-4"/> }
        @case ('logout') { <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/> }
        @case ('trash') { <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 10v6M14 10v6"/> }
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
        @case ('servicio') { <path d="M12 3l1.8 4.7 4.7 1.8-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"/><path d="M19 15l.8 2.2 2.2.8-2.2.8L19 21l-.8-2.2-2.2-.8 2.2-.8z"/> }
        @case ('pisos') { <path d="M3 20 8 8h8l5 12z"/><path d="M5.5 14h13M7 10.5h10M12 8v12"/> }
        @case ('cisterna') { <path d="M5 8c0-1.7 3.1-3 7-3s7 1.3 7 3v9c0 1.7-3.1 3-7 3s-7-1.3-7-3z"/><path d="M5 8c0 1.7 3.1 3 7 3s7-1.3 7-3M5 13c0 1.7 3.1 3 7 3s7-1.3 7-3"/> }
        @case ('ventanas') { <rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M12 3v18M4 12h16"/> }
        @case ('alfombras') { <rect x="3" y="7" width="18" height="10" rx="1"/><path d="M6 7V5M10 7V5M14 7V5M18 7V5M6 17v2M10 17v2M14 17v2M18 17v2M7 12h10"/> }
        @case ('cocina') { <path d="M5 10h14v8a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2zM3 10h18"/><path d="M8 6c0-1 1-1.5 1-2.5M12 6c0-1 1-1.5 1-2.5M16 6c0-1 1-1.5 1-2.5"/> }
        @case ('auto') { <path d="M4 15v-3l2-5h12l2 5v3zM7 12h10"/><path d="M4 15v3h3v-3M17 15v3h3v-3"/> }
        @case ('jardin') { <path d="M5 19c0-8 5-14 15-14 0 10-6 15-14 15M5 19l8-8"/> }
        @case ('limpieza') { <path d="M9 10h6v11H9zM10 10V7h4v3M12 4h4M14 7l2-3"/> }
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
