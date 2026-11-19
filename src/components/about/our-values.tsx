const values = [
  {
    number: "01",
    title: "Quality",
    description: "Choose well, prepare carefully, and let the ingredients show.",
  },
  {
    number: "02",
    title: "Creativity",
    description: "Stay curious, follow a good idea, and make room for delight.",
  },
  {
    number: "03",
    title: "Hospitality",
    description: "Offer genuine warmth, thoughtful service, and an unhurried welcome.",
  },
  {
    number: "04",
    title: "Authenticity",
    description: "Be honest about what we make and true to the spirit behind it.",
  },
];

export function OurValues() {
  return (
    <section aria-labelledby="about-values-title" className="about-values">
      <div className="about-values-heading">
        <span className="eyebrow eyebrow-dark">What guides us</span>
        <h2 id="about-values-title">
          A few things
          <br />
          <em>we hold close.</em>
        </h2>
      </div>
      <ul className="about-values-list">
        {values.map((value) => (
          <li className="about-value" key={value.title}>
            <span className="about-value-number">{value.number}</span>
            <div>
              <h3>{value.title}</h3>
              <p>{value.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
