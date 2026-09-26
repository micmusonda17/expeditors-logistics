/* Inline SVG icons. All take the current text colour. */
import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement>;
const stroke = (w = 2): P => ({ viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: w, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true });

export const IconArrow = (p: P) => <svg {...stroke(2.2)} {...p}><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
export const IconMenu = (p: P) => <svg {...stroke(2.2)} {...p}><path d="M4 7h16M4 12h16M4 17h16" /></svg>;
export const IconSwap = (p: P) => <svg {...stroke(2.2)} {...p}><path d="M7 4 3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7" /></svg>;
export const IconCheck = (p: P) => <svg {...stroke(2.4)} {...p}><path d="m5 12 5 5L20 7" /></svg>;
export const IconClock = (p: P) => <svg {...stroke()} {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
export const IconChat = (p: P) => <svg {...stroke()} {...p}><path d="M4 5h16v11H8l-4 4z" /></svg>;
export const IconPhone = (p: P) => <svg {...stroke()} {...p}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" /></svg>;
export const IconMail = (p: P) => <svg {...stroke()} {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>;
export const IconPin = (p: P) => <svg {...stroke()} {...p}><path d="M12 21s-7-6.1-7-11.5a7 7 0 0 1 14 0C19 14.9 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>;
export const IconCopy = (p: P) => <svg {...stroke()} {...p}><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></svg>;
export const IconChevron = (p: P) => <svg {...stroke(2.2)} {...p}><path d="m6 9 6 6 6-6" /></svg>;
export const IconDash = (p: P) => <svg {...stroke()} {...p}><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></svg>;
export const IconQuote = (p: P) => <svg {...stroke()} {...p}><path d="M4 4h16v12H8l-4 4z" /><path d="M8 9h8M8 12h5" /></svg>;
export const IconTruck = (p: P) => <svg {...stroke()} {...p}><path d="M2 6h11v10H2zM13 9h4l4 4v3h-8z" /><circle cx="6" cy="18" r="2" /><circle cx="17" cy="18" r="2" /></svg>;
export const IconWeb = (p: P) => <svg {...stroke()} {...p}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></svg>;
export const IconPlus = (p: P) => <svg {...stroke(2.4)} {...p}><path d="M12 5v14M5 12h14" /></svg>;
export const IconX = (p: P) => <svg {...stroke(2.2)} {...p}><path d="M6 6l12 12M18 6 6 18" /></svg>;
export const IconLink = (p: P) => <svg {...stroke()} {...p}><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></svg>;
export const IconSearch = (p: P) => <svg {...stroke()} {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>;
export const IconWhatsApp = (p: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...p}>
    <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.6 0-3.1-.4-4.4-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 1.9s.8 2.2.9 2.4c.1.2 1.6 2.5 4 3.5 1.5.6 2 .7 2.8.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3z" />
  </svg>
);

/* Service icons */
export const IconSnow = (p: P) => <svg {...stroke(1.9)} {...p}><path d="M12 2v20M4.2 6.5l15.6 9M4.2 17.5l15.6-9" /><path d="m9 4 3 2 3-2M9 20l3-2 3 2M3.5 10l3-1.2-.6-3.3M20.5 14l-3 1.2.6 3.3M3.5 14l3 1.2-.6 3.3M20.5 10l-3-1.2.6-3.3" /></svg>;
export const IconCalendar = (p: P) => <svg {...stroke(1.9)} {...p}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4M8 14h3M8 17h6" /></svg>;
export const IconRoad = (p: P) => <svg {...stroke(1.9)} {...p}><path d="M8 3 4 21M16 3l4 18" /><path d="M12 4v3M12 11v3M12 18v2" /></svg>;
export const IconTown = (p: P) => <svg {...stroke(1.9)} {...p}><path d="M3 21h18M5 21V9l5-3v15M10 21V4l9 4v13" /><path d="M13 10h3M13 14h3M13 18h3" /></svg>;
export const IconStar = (p: P) => <svg viewBox="0 0 24 24" aria-hidden {...p}><path fill="currentColor" d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z" /></svg>;
export const IconFamily = (p: P) => <svg {...stroke(1.9)} {...p}><circle cx="8" cy="7" r="3" /><circle cx="17" cy="9" r="2.4" /><path d="M2.5 20c0-3.3 2.5-6 5.5-6s5.5 2.7 5.5 6M13.5 20c.2-2.6 1.7-4.6 3.5-4.6s3.4 2 3.5 4.6" /></svg>;
