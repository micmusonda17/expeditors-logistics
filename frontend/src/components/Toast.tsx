import { useEffect, useState } from 'react';

const EVENT = 'ell-toast';

/** Show a short message at the bottom of the screen. Callable from anywhere. */
export function toast(message: string) {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: message }));
}

export function Toaster() {
  const [msg, setMsg] = useState('');
  const [show, setShow] = useState(false);
  useEffect(() => {
    let timer: number | undefined;
    const on = (e: Event) => {
      setMsg((e as CustomEvent<string>).detail);
      setShow(true);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setShow(false), 2400);
    };
    window.addEventListener(EVENT, on);
    return () => { window.removeEventListener(EVENT, on); window.clearTimeout(timer); };
  }, []);
  return <div className={'toast' + (show ? ' show' : '')} role="status" aria-live="polite">{msg}</div>;
}
