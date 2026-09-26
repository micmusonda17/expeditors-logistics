const STEPS = [
  ['Request a quote', 'Send pickup, delivery, cargo, weight and loading date. We reply with a rate and truck availability.', 'Online or WhatsApp'],
  ['Book and load', 'Confirm the rate and we send the truck registration and driver details before the truck arrives at your site.', 'Truck and driver confirmed'],
  ['On the road', 'The truck is tracked by GPS and the driver sends updates along the way, so you always know where your goods are.', 'Live GPS tracking'],
  ['Delivered', 'Cargo is offloaded and the signed proof of delivery comes to you by WhatsApp or email.', 'Signed POD']
];

export function Process() {
  return (
    <section className="section process" id="process" aria-labelledby="process-title">
      <div className="wrap">
        <div className="section-head">
          <div>
            <p className="eyebrow">How it works</p>
            <h2 id="process-title" className="display">How a load moves</h2>
          </div>
          <p className="lede">Four steps from your first message to a signed delivery note. You deal with one person from quote to delivery.</p>
        </div>
        <ol className="road-steps">
          {STEPS.map(([title, text, when]) => (
            <li key={title}><h3>{title}</h3><p>{text}</p><p className="when">{when}</p></li>
          ))}
        </ol>
      </div>
    </section>
  );
}
