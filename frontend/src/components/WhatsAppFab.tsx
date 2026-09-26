import { COMPANY } from '../config';
import { waLink } from '../lib/format';
import { IconWhatsApp } from './Icons';

export function WhatsAppFab() {
  if (!COMPANY.whatsapp) return null;
  return (
    <a className="fab" href={waLink('Hello Expeditors, I would like a quote.')} aria-label="Chat on WhatsApp" target="_blank" rel="noopener">
      <IconWhatsApp />
    </a>
  );
}
