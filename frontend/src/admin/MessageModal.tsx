import { useState } from 'react';
import { IS_DEMO } from '../config';
import { waLink } from '../lib/format';
import { copyText } from '../lib/clipboard';
import { toast } from '../components/Toast';
import { IconCopy, IconWhatsApp, IconX } from '../components/Icons';
import { Drawer } from './Drawer';
import type { MessageRequest } from './AdminContext';

/** Shows a prepared WhatsApp message the team can edit, then opens WhatsApp with it. */
export function MessageModal({ req, onClose }: { req: MessageRequest; onClose(): void }) {
  const [text, setText] = useState(req.text);
  return (
    <Drawer modal onClose={onClose} labelledBy="md-title">
      <div className="dr-head">
        <div>
          <p className="dr-eyebrow">WhatsApp message</p>
          <h2 id="md-title">{req.title || `Message ${req.to || ''}`}</h2>
          <p className="muted mono">{req.phone ? '+' + req.phone : 'No number saved'}</p>
        </div>
        <button className="icon-btn" type="button" data-close aria-label="Close" onClick={onClose}><IconX /></button>
      </div>
      <div className="dr-body">
        <label className="sr-only" htmlFor="md-text">Message</label>
        <textarea id="md-text" className="md-text" value={text} onChange={e => setText(e.target.value)} data-autofocus />
        {IS_DEMO && <p className="notice">Demo mode: sample customers have placeholder numbers. In the live portal this button opens WhatsApp with the message ready to send.</p>}
        <div className="btn-row">
          {req.phone && (
            <a className="btn btn-wa" href={waLink(text, req.phone)} target="_blank" rel="noopener"
              onClick={e => { if (IS_DEMO) { e.preventDefault(); toast('Demo mode: WhatsApp opens in the live portal'); } else setTimeout(onClose, 300); }}>
              <IconWhatsApp />Open in WhatsApp
            </a>
          )}
          <button type="button" className="btn btn-ghost" onClick={() => copyText(text)}><IconCopy />Copy message</button>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Not now</button>
        </div>
      </div>
    </Drawer>
  );
}
