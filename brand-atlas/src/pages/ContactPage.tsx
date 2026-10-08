export function ContactPage() {
  return (
    <main className="shell section">
      <h2>Contact us</h2>
      <p className="muted">Questions about Seen, the catalogue, or your account.</p>
      <div className="banner">
        <p style={{ margin: 0 }}>
          <strong>Email:</strong>{" "}
          <a href="mailto:hello@seen-catalogue.example">hello@seen-catalogue.example</a>
        </p>
        <p style={{ margin: "0.6rem 0 0" }}>
          We read every message. For catalogue corrections (add / modify / remove), mention
          the category and item name — weekly refresh incorporates verified updates.
        </p>
      </div>
      <form
        className="auth-form"
        onSubmit={(e) => {
          e.preventDefault();
          alert("Thanks — for this demo, please email hello@seen-catalogue.example.");
        }}
      >
        <div className="field">
          <label htmlFor="c-name">Name</label>
          <input id="c-name" required />
        </div>
        <div className="field">
          <label htmlFor="c-email">Email</label>
          <input id="c-email" type="email" required />
        </div>
        <div className="field">
          <label htmlFor="c-msg">Message</label>
          <textarea id="c-msg" rows={5} required />
        </div>
        <button type="submit" className="btn btn--forest">
          Send message
        </button>
      </form>
    </main>
  );
}
