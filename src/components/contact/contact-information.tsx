import { Clock3, Mail, MapPin, Phone } from "lucide-react";

const contactDetails = [
  {
    icon: MapPin,
    label: "Find the table",
    value: (
      <>
        18 West 27th Street
        <br />
        New York, NY 10001
      </>
    ),
    note: "Fictional demo address · not a real LuxeBite location",
  },
  {
    icon: Phone,
    label: "Give us a ring",
    value: <a href="tel:+12125550148">(212) 555-0148</a>,
    note: "Fictional demonstration number",
  },
  {
    icon: Mail,
    label: "Send a note",
    value: <a href="mailto:hello@luxebite.com">hello@luxebite.com</a>,
    note: "Sample email · replies are not configured",
  },
  {
    icon: Clock3,
    label: "When we're here",
    value: (
      <>
        Tuesday – Sunday
        <br />
        5:00 pm – 10:30 pm
      </>
    ),
    note: "Illustrative opening hours",
  },
];

export function ContactInformation() {
  return (
    <section
      aria-labelledby="contact-information-title"
      className="contact-information"
      id="contact-information"
    >
      <div className="contact-information-heading">
        <div>
          <span className="eyebrow eyebrow-dark">The little details</span>
          <h2 id="contact-information-title">
            Here&apos;s where
            <br />
            <em>to find us.</em>
          </h2>
        </div>
        <p>
          LuxeBite is a fictional restaurant concept. These contact details and
          hours are samples, not a real venue listing.
        </p>
      </div>
      <div className="contact-information-grid">
        {contactDetails.map(({ icon: Icon, label, value, note }, index) => (
          <article className="contact-information-item" key={label}>
            <span className="contact-information-index">
              0{index + 1}
              <Icon aria-hidden="true" size={17} />
            </span>
            <h3>{label}</h3>
            <p className="contact-information-value">{value}</p>
            <p className="contact-information-note">{note}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
