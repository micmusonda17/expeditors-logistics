const FAQS: [string, string][] = [
  ['Where do you operate?', 'Across Zambia: Lusaka, the Copperbelt and the provincial towns, including Livingstone, Chipata, Kasama, Mongu and Solwezi. Trips to South Africa, starting with Limpopo, Pretoria and Johannesburg, are coming soon.'],
  ['Can you carry chilled and frozen goods?', 'Yes. Our refrigerated trucks, from 3 to 5 tonnes, carry chilled and frozen products such as poultry, meat and dairy at a controlled temperature, and we follow them by GPS so we can see where your load is at any time.'],
  ['What goods do you carry?', 'All kinds of goods: chilled and frozen food, groceries and beverages, bagged goods such as maize, fertiliser and cement, building materials, packaged and general cargo. If you are not sure about your load, tell us what it is and we will confirm.'],
  ['What trucks do you have?', 'Refrigerated trucks from 3 to 5 tonnes for chilled and frozen goods, and containerised trucks of 2 and 3 tonnes for dry goods. All are kept in excellent condition. For loads over 5 tonnes we split the load across trucks or advise on other options.'],
  ['Can we hire a truck by the day or month?', 'Yes. We hire trucks with an experienced, licensed driver on daily or monthly contracts. Rates cover the truck, the driver and routine maintenance, and fuel arrangements are agreed in the contract.'],
  ['How long have you been in business?', 'Since 2017. Expeditors Logistics is a family-owned company based at Ndeke Farms, off Great East Road in Lusaka.'],
  ['How long does Lusaka to the Copperbelt take?', 'Lusaka to Kitwe is about 380 km by road. We confirm the delivery time with your quote, based on when the truck loads.'],
  ['Is my cargo insured in transit?', 'For contract work we insure goods in transit with a reputable insurance company from the day the contract is signed. For a one-off load, tell us the cargo value when you request a quote and we will confirm the cover before you book.'],
  ['Can you do return loads?', 'Yes. Trucks coming back from a delivery often have space, which can make the rate cheaper. Mention flexible dates in your request.'],
  ['How do I track my load?', 'Use the reference on your booking confirmation in the Track a load section above, or message us on WhatsApp with the reference and we will reply with the latest position.']
];

export function Faq() {
  return (
    <section className="section" id="faq" aria-labelledby="faq-title">
      <div className="wrap faq-grid">
        <div className="section-head">
          <p className="eyebrow">FAQ</p>
          <h2 id="faq-title" className="display" style={{ fontSize: 'clamp(2rem,4.2vw,3.25rem)', marginTop: 14 }}>Questions shippers ask</h2>
          <p className="lede">Anything else, send us a message and we will answer the same way we answer quotes.</p>
        </div>
        <div className="faqs">
          {FAQS.map(([q, a], i) => (
            <details key={q} open={i === 0}>
              <summary>{q}<span className="pm" aria-hidden /></summary>
              <div className="a">{a}</div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
