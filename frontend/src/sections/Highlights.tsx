import { COMPANY } from '../config';
import { IconFamily, IconPin, IconRoad, IconTruck } from '../components/Icons';

/** "Why Expeditors" strip on the home page. Facts only. */
export function Highlights() {
  const items = [
    { icon: IconFamily, k: `Since ${COMPANY.founded}`, v: 'Family-owned and family-run, based in Lusaka' },
    { icon: IconTruck, k: '2 to 5 tonnes', v: 'Refrigerated and containerised trucks, kept in excellent condition' },
    { icon: IconRoad, k: 'All kinds of goods', v: 'Chilled, frozen or dry, across Zambia' },
    { icon: IconPin, k: 'Track every load', v: 'A reference for every booking and updates on WhatsApp' }
  ];
  return (
    <section className="highlights" aria-label="Why Expeditors">
      <div className="wrap">
        {items.map(({ icon: Icon, k, v }) => (
          <div className="hl" key={k}>
            <span className="hl-ico"><Icon /></span>
            <div><b>{k}</b><span>{v}</span></div>
          </div>
        ))}
      </div>
    </section>
  );
}
