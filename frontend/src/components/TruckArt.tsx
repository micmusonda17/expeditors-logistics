/* Simple side-on truck drawings for the fleet cards. */
const N = '#0B2048', S = '#CFDDF0', B = '#1466B8', R = '#C8302A';

function Cab() {
  return (
    <>
      <path d="M190 64 V22 Q190 16 196 16 H221 Q225 16 227 20 L237 38 V64 Z" fill="#fff" stroke={N} strokeWidth={3} strokeLinejoin="round" />
      <path d="M200 23 H220 L229 38 H200 Z" fill={N} />
      <rect x={229} y={48} width={8} height={6} rx={1} fill={S} />
    </>
  );
}
const Wheel = ({ x }: { x: number }) => (<><circle cx={x} cy={71} r={9} fill={N} /><circle cx={x} cy={71} r={3.5} fill="#fff" /></>);

export function TruckArt({ kind }: { kind: 'reefer' | 'box' | 'semi' }) {
  if (kind === 'reefer') {
    return (
      <svg viewBox="0 0 244 84" aria-hidden>
        <rect x={44} y={12} width={138} height={50} rx={3} fill="#fff" stroke={N} strokeWidth={3} />
        <rect x={170} y={6} width={16} height={30} rx={2} fill={S} stroke={N} strokeWidth={2.5} />
        <path d="M174 13h8M174 19h8M174 25h8" stroke={N} strokeWidth={1.6} />
        <g stroke={B} strokeWidth={3} strokeLinecap="round"><path d="M110 24v28M97.9 31l24.2 14M97.9 45l24.2-14" /></g>
        <rect x={40} y={61} width={198} height={6} rx={2} fill={N} />
        <Cab />
        {[80, 102, 214].map(x => <Wheel key={x} x={x} />)}
      </svg>
    );
  }
  if (kind === 'box') {
    // Containerised body: closed, ribbed cargo box with rear doors.
    return (
      <svg viewBox="0 0 244 84" aria-hidden>
        <rect x={72} y={18} width={112} height={44} rx={3} fill="#fff" stroke={N} strokeWidth={3} />
        {Array.from({ length: 6 }, (_, i) => <line key={i} x1={96 + i * 14} y1={23} x2={96 + i * 14} y2={57} stroke={S} strokeWidth={2.5} />)}
        <line x1={84} y1={21} x2={84} y2={59} stroke={N} strokeWidth={2} />
        <path d="M76 36h5M76 44h5" stroke={N} strokeWidth={2} strokeLinecap="round" />
        <rect x={72} y={52} width={112} height={5} fill={R} />
        <rect x={68} y={61} width={170} height={6} rx={2} fill={N} />
        <Cab />
        {[104, 214].map(x => <Wheel key={x} x={x} />)}
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 244 84" aria-hidden>
      <rect x={8} y={14} width={176} height={48} rx={3} fill="#fff" stroke={N} strokeWidth={3} />
      {Array.from({ length: 10 }, (_, i) => <line key={i} x1={22 + i * 16} y1={19} x2={22 + i * 16} y2={57} stroke={S} strokeWidth={2.5} />)}
      <rect x={8} y={14} width={176} height={7} fill={N} />
      <rect x={6} y={61} width={232} height={6} rx={2} fill={N} />
      <Cab />
      {[30, 50, 70, 176, 198, 226].map(x => <Wheel key={x} x={x} />)}
    </svg>
  );
}
