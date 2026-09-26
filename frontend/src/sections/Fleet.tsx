import { TruckArt } from '../components/TruckArt';

export function Fleet() {
  return (
    <section className="section" id="fleet" aria-labelledby="fleet-title">
      <div className="wrap">
        <div className="section-head">
          <div>
            <p className="eyebrow">Fleet</p>
            <h2 id="fleet-title" className="display">The trucks</h2>
          </div>
          <p className="lede">Refrigerated and containerised trucks from 2 to 5 tonnes, all kept in excellent condition and driven by experienced, licensed drivers. If a truck develops a problem while loaded, another truck from our fleet takes over so your goods keep moving.</p>
        </div>
        <div className="fleet-grid">
          <article className="truck">
            <div className="truck-pic"><TruckArt kind="reefer" /></div>
            <h3>Refrigerated trucks</h3>
            <p>Insulated bodies with refrigeration units that keep chilled and frozen products at a controlled temperature from pickup to delivery.</p>
            <dl className="spec"><dt>Best for</dt><dd>Poultry, meat, dairy, frozen food</dd><dt>Payload</dt><dd className="mono">3 to 5 t</dd><dt>Tracking</dt><dd>Real-time GPS</dd></dl>
          </article>
          <article className="truck">
            <div className="truck-pic"><TruckArt kind="box" /></div>
            <h3>Containerised trucks</h3>
            <p>Closed, lockable cargo boxes that keep dry goods out of the sun, rain and dust, and away from prying hands. Ideal for town deliveries and runs between provinces.</p>
            <dl className="spec"><dt>Best for</dt><dd>Groceries, beverages, bagged and packaged goods</dd><dt>Payload</dt><dd className="mono">2 and 3 t</dd></dl>
          </article>
          <article className="truck truck-more">
            <div className="truck-pic"><TruckArt kind="semi" /></div>
            <h3>Bigger loads</h3>
            <p>Moving more than 5 tonnes, or several loads at once? Tell us the cargo and weight and we will split it across our trucks or come back with other options.</p>
            <a className="btn btn-ghost btn-sm" href="#quote">Ask about a bigger load</a>
          </article>
        </div>
      </div>
    </section>
  );
}
