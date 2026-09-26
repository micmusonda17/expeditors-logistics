import { BORDERS } from '../lib/network';

export function BorderChips({ borders }: { borders: string[] }) {
  return (
    <>
      {borders.map(b => (
        <span className="chip" key={b}><i />{BORDERS[b].name} <span className="pair">{BORDERS[b].pair.join('/')}</span></span>
      ))}
    </>
  );
}
