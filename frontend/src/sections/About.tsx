import { COMPANY, TEAM } from '../config';
import { IconFamily, IconPin, IconRoad, IconTruck } from '../components/Icons';
import { TeamGrid } from './Team';

/* The family story. Edit the paragraphs below freely. */
export function About({ head = true }: { head?: boolean } = {}) {
  const founder = TEAM.find(m => m.founder)?.name ?? COMPANY.director;
  return (
    <section className="section about" id="about" aria-labelledby={head ? 'about-title' : undefined}>
      <div className="wrap">
        {head && (
          <div className="section-head">
            <div>
              <p className="eyebrow">About us</p>
              <h2 id="about-title" className="display">Started by a father, run by a family</h2>
            </div>
            <p className="lede">{COMPANY.name} has been on the road since {COMPANY.founded}. This is how it began.</p>
          </div>
        )}

        <div className="story-grid" id="story">
          <div className="story">
            <p className="story-lead">
              Expeditors Logistics began as {founder}&rsquo;s idea. He realised businesses deserved a transporter they
              could truly rely on, run by a family that treats you like family.
            </p>
            <p>
              In {COMPANY.founded} he stopped waiting for someone else to build that company and chose to found it himself.
              From the first load it has been a family business, and today his family works alongside him: running the
              day-to-day operations, looking after customers and sales, and building the systems that let you request a
              quote and follow your load online.
            </p>
            <p>
              We deliver all kinds of goods, from chilled and frozen food to groceries, beverages, bagged goods, building
              materials and general cargo. Whatever you are moving, we handle it the way our founder intended: with care,
              on time, and with a family standing behind every delivery.
            </p>
          </div>
          <aside className="story-facts" aria-label="Company facts">
            <div className="fact"><b className="num">{COMPANY.founded}</b><span>Founded by {founder}</span></div>
            <div className="fact"><IconFamily /><span>Family-owned and family-run</span></div>
            <div className="fact"><IconTruck /><span>Refrigerated and containerised trucks, 2 to 5 tonnes</span></div>
            <div className="fact"><IconRoad /><span>All kinds of goods, across Zambia</span></div>
            <div className="fact"><IconPin /><span>Based at Ndeke Farms, off Great East Road, Lusaka</span></div>
          </aside>
        </div>

        <div className="team-head" id="team">
          <h3>About our team</h3>
          <p>The people behind every load.</p>
        </div>
        <TeamGrid />
      </div>
    </section>
  );
}
