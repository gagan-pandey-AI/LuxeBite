const openingHours = [
  { day: "Monday", hours: "Closed" },
  { day: "Tuesday – Thursday", hours: "5:00 pm – 10:30 pm" },
  { day: "Friday – Sunday", hours: "5:00 pm – 10:30 pm" },
];

export function ContactLocation() {
  return (
    <section
      aria-labelledby="contact-location-title"
      className="contact-location"
      id="contact-location"
    >
      <div className="contact-location-heading">
        <span className="eyebrow eyebrow-dark">A sense of place</span>
        <h2 id="contact-location-title">
          Somewhere in
          <br />
          <em>New York.</em>
        </h2>
        <p>
          This map shows a general city-area preview only. LuxeBite has no real
          restaurant address or map pin.
        </p>
      </div>

      <div className="contact-location-layout">
        <div className="contact-map-frame">
          <iframe
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src="https://maps.google.com/maps?q=New%20York%20City%2C%20NY&output=embed"
            title="Google Maps demo placeholder showing New York City, not a restaurant location"
          />
          <span>Google Maps placeholder · general New York area</span>
        </div>

        <div className="contact-hours">
          <span className="eyebrow eyebrow-dark">Sample service hours</span>
          <h3>Time set aside for a good evening.</h3>
          <dl>
            {openingHours.map(({ day, hours }) => (
              <div className="contact-hours-row" key={day}>
                <dt>{day}</dt>
                <dd>{hours}</dd>
              </div>
            ))}
          </dl>
          <p>Illustrative hours for this fictional restaurant concept.</p>
        </div>
      </div>
    </section>
  );
}
