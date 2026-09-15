import React from "react";

/**
 * BridgeTech — Public homepage
 * Converted from index.html (static) to a React functional component.
 *
 * Notes on the conversion:
 * - `class` -> `className`
 * - the original <style> block is kept as-is inside a <style> tag so no CSS
 *   had to be rewritten. If your project already uses a bundler, feel free to
 *   move the contents of STYLES into PublicHomepage.css and `import` it instead.
 * - the <img> tag was made self-closing, as JSX requires.
 * - all the "client.html" / "#" links are left as plain <a href="..."> — swap
 *   these for <Link to="..."> if you're using react-router.
 */

const STYLES = `
*{box-sizing:border-box}body{margin:0;font-family:Inter,Arial,sans-serif;color:#182230;background:#fff}a{text-decoration:none;color:inherit}.container{max-width:1180px;margin:auto;padding:0 30px}.top{height:78px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #eceef1}.logo{font-size:21px;font-weight:800}.logo i{font-style:normal;color:#315db6}.links{display:flex;gap:28px;font-size:14px;color:#596475}.links a:first-child{color:#172239;font-weight:650}.actions{display:flex;gap:10px}.button{padding:11px 17px;border:1px solid #d9dee6;border-radius:7px;background:#fff;font-weight:650;font-size:14px}.button.dark{background:#1a3f8b;border-color:#1a3f8b;color:#fff}.hero{padding:54px 0 72px;background:#f8f8f6}.hero-grid{display:grid;grid-template-columns:47% 53%;align-items:center;gap:38px}.eyebrow{font-size:11px;letter-spacing:.13em;text-transform:uppercase;font-weight:800;color:#315db6}.hero h1{font-size:58px;letter-spacing:-2.8px;line-height:1.02;margin:15px 0 18px;font-weight:720}.hero p{font-size:17px;line-height:1.7;color:#687385;max-width:570px}.hero .actions{margin-top:27px}.note{font-size:12px;color:#7c8796;margin-top:16px}.image-stack{height:510px;position:relative}.hero-img{position:absolute;right:0;top:0;width:84%;height:455px;object-fit:cover}.caption{position:absolute;bottom:10px;left:0;background:#fff;padding:17px 20px;width:48%;box-shadow:0 8px 30px rgba(17,30,50,.09);font-size:13px;line-height:1.5}.caption b{display:block;font-size:15px;margin-bottom:4px}.section{padding:82px 0}.section-head{display:grid;grid-template-columns:300px 1fr;gap:80px;align-items:start}.section h2{font-size:34px;line-height:1.14;letter-spacing:-1.3px;margin:8px 0}.section .lead{color:#6c7787;line-height:1.75;max-width:650px;margin-top:15px}.feature-list{margin-top:48px;border-top:1px solid #e5e8ec}.feature{display:grid;grid-template-columns:80px 1.1fr 1.5fr;gap:25px;padding:26px 0;border-bottom:1px solid #e5e8ec;align-items:center}.number{color:#315db6;font-size:13px;font-weight:800}.feature h3{margin:0;font-size:18px}.feature p{margin:0;color:#6d7787;font-size:14px;line-height:1.6}.split{background:#f3f5f8}.split-grid{display:grid;grid-template-columns:1fr 1fr;min-height:540px}.split-photo{background:url('https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1400&q=85') center/cover}.split-copy{padding:75px;display:flex;flex-direction:column;justify-content:center}.split-copy h2{font-size:38px;line-height:1.12;letter-spacing:-1.5px}.split-copy p{color:#687385;line-height:1.75;max-width:510px}.tracks{padding-top:18px}.track-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:0;border:1px solid #e4e7eb;margin-top:35px}.track{padding:25px;border-right:1px solid #e4e7eb;min-height:220px}.track:last-child{border:0}.track small{font-weight:800;color:#315db6}.track h3{font-size:18px;line-height:1.25}.track p{font-size:13px;color:#707b8b;line-height:1.6}.cta{margin:0 auto 80px;max-width:1120px;background:#182a50;color:#fff;padding:42px 48px;display:flex;justify-content:space-between;align-items:center}.cta h2{font-size:29px;margin:0;letter-spacing:-1px}.cta p{color:#b7c5dc;margin:7px 0 0}.cta .button{border-color:#fff;background:#fff;color:#17284c}footer{border-top:1px solid #e7e9ed;padding:36px 0;color:#788394;font-size:13px}.footer-row{display:flex;justify-content:space-between}@media(max-width:850px){.links{display:none}.hero-grid,.section-head,.split-grid{grid-template-columns:1fr}.image-stack{height:420px}.hero h1{font-size:45px}.section-head{gap:15px}.feature{grid-template-columns:50px 1fr}.feature p{grid-column:2}.track-grid{grid-template-columns:1fr 1fr}.track:nth-child(2){border-right:0}.split-copy{padding:50px 30px}.cta{margin:0 20px 50px;display:block}.cta .button{margin-top:20px}}@media(max-width:560px){.container{padding:0 20px}.track-grid{grid-template-columns:1fr}.track{border-right:0;border-bottom:1px solid #e4e7eb}.stats{display:none}}
`;

const FEATURES = [
  {
    number: "01",
    title: "Learn the workflow",
    body: "Short, structured modules explain how tools such as Git, APIs and CI/CD fit into day-to-day development.",
  },
  {
    number: "02",
    title: "Check your understanding",
    body: "Knowledge checks and quizzes make gaps visible before students move on to practical work.",
  },
  {
    number: "03",
    title: "Do the practical work",
    body: "Hands-on exercises give students a place to apply concepts using realistic development tasks.",
  },
  {
    number: "04",
    title: "Keep the evidence",
    body: "Progress, completed work and certificates can contribute to a clearer picture of what a student has actually practised.",
  },
];

const TRACKS = [
  {
    number: "01",
    title: "Git & Version Control",
    body: "Branches, pull requests, code review and working with other developers.",
  },
  {
    number: "02",
    title: "APIs & Web Services",
    body: "REST, HTTP, JSON and the basics of authentication.",
  },
  {
    number: "03",
    title: "CI/CD Pipelines",
    body: "Automated builds, testing and delivery workflows.",
  },
  {
    number: "04",
    title: "Cloud Basics",
    body: "Hosting, cloud platforms and serverless concepts.",
  },
];

export default function PublicHomepage() {
  return (
    <>
      <style>{STYLES}</style>

      <header className="container top">
        <div className="logo">
          Bridge<i>Tech</i>
        </div>
        <nav className="links">
          <a href="#">How it works</a>
          <a href="#">Learning tracks</a>
          <a href="#">For universities</a>
        </nav>
        <div className="actions">
          <a className="button" href="client.html">
            Sign in
          </a>
          <a className="button dark" href="client.html">
            Get started
          </a>
        </div>
      </header>

      <main className="hero">
        <div className="container hero-grid">
          <div>
            <div className="eyebrow">Built for computer science students</div>
            <h1>Get closer to the work you'll actually do.</h1>
            <p>
              BridgeTech helps students move from understanding concepts to
              using the tools and workflows that show up in real software
              teams.
            </p>
            <div className="actions">
              <a className="button dark" href="client.html">
                Explore the platform
              </a>
              <button className="button">See learning tracks</button>
            </div>
            <div className="note">
              Learn at your own pace · Build practical evidence as you go
            </div>
          </div>
          <div className="image-stack">
            <img
              className="hero-img"
              src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=85"
              alt="Students working together"
            />
            <div className="caption">
              <b>Less abstract. More applied.</b>
              Work through lessons, then put what you learned into practice.
            </div>
          </div>
        </div>
      </main>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <div className="eyebrow">What changes</div>
              <h2>From knowing about a tool to actually using it.</h2>
            </div>
            <div>
              <p className="lead">
                The platform is organised around practical learning moments
                rather than a long list of disconnected features. Each part
                supports a student moving from explanation, to
                understanding, to doing.
              </p>
            </div>
          </div>
          <div className="feature-list">
            {FEATURES.map((f) => (
              <div className="feature" key={f.number}>
                <div className="number">{f.number}</div>
                <h3>{f.title}</h3>
                <p>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="split">
        <div className="split-grid">
          <div className="split-photo" />
          <div className="split-copy">
            <div className="eyebrow">Why this exists</div>
            <h2>
              University gives students the foundation. Industry expects
              them to know the workflow.
            </h2>
            <p>
              BridgeTech sits in that space. It does not replace academic
              learning; it adds structured exposure to the tools and
              practices students are likely to encounter when working on
              software projects.
            </p>
            <p>
              <a className="button dark" href="client.html">
                Take a look inside
              </a>
            </p>
          </div>
        </div>
      </section>

      <section className="section tracks">
        <div className="container">
          <div className="eyebrow">Start with the essentials</div>
          <h2>Four focused learning tracks.</h2>
          <div className="track-grid">
            {TRACKS.map((t) => (
              <div className="track" key={t.number}>
                <small>{t.number}</small>
                <h3>{t.title}</h3>
                <p>{t.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="cta">
        <div>
          <h2>Start building practical experience before graduation.</h2>
          <p>See what the student learning experience looks like.</p>
        </div>
        <a className="button" href="client.html">
          Open student portal
        </a>
      </div>

      <footer>
        <div className="container footer-row">
          <div className="logo">
            Bridge<i>Tech</i>
          </div>
          <div>Practical technology learning for computer science students.</div>
        </div>
      </footer>
    </>
  );
}
