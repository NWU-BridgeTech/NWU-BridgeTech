import React from "react";

const STYLES = `
*{box-sizing:border-box}body{margin:0;font-family:Inter,Arial,sans-serif;color:#182230;background:#fff}a{text-decoration:none;color:inherit}.container{max-width:1180px;margin:auto;padding:0 30px}.top{height:78px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #eceef1}.logo{font-size:21px;font-weight:800}.logo i{font-style:normal;color:#315db6}.links{display:flex;gap:28px;font-size:14px;color:#596475}.links a:first-child{color:#172239;font-weight:650}.actions{display:flex;gap:10px}.button{padding:11px 17px;border:1px solid #d9dee6;border-radius:7px;background:#fff;font-weight:650;font-size:14px}.button.dark{background:#1a3f8b;border-color:#1a3f8b;color:#fff}.hero{padding:54px 0 72px;background:#f8f8f6}.hero-grid{display:grid;grid-template-columns:47% 53%;align-items:center;gap:38px}.eyebrow{font-size:11px;letter-spacing:.13em;text-transform:uppercase;font-weight:800;color:#315db6}.hero h1{font-size:50px;letter-spacing:-2.8px;line-height:1.02;margin:15px 0 18px;font-weight:720}.hero p{font-size:17px;line-height:1.7;color:#687385;max-width:570px}.hero .actions{margin-top:27px}.note{font-size:12px;color:#7c8796;margin-top:16px}.image-stack{height:510px;position:relative}.hero-img{position:absolute;right:0;top:0;width:84%;height:455px;object-fit:cover}.caption{position:absolute;bottom:10px;left:0;background:#fff;padding:17px 20px;width:48%;box-shadow:0 8px 30px rgba(17,30,50,.09);font-size:13px;line-height:1.5}.caption b{display:block;font-size:15px;margin-bottom:4px}.section{padding:82px 0}.section-head{display:grid;grid-template-columns:300px 1fr;gap:80px;align-items:start}.section h2{font-size:34px;line-height:1.14;letter-spacing:-1.3px;margin:8px 0}.section .lead{color:#6c7787;line-height:1.75;max-width:650px;margin-top:15px}.feature-list{margin-top:48px;border-top:1px solid #e5e8ec}.feature{display:grid;grid-template-columns:80px 1.1fr 1.5fr;gap:25px;padding:26px 0;border-bottom:1px solid #e5e8ec;align-items:center}.number{color:#315db6;font-size:13px;font-weight:800}.feature h3{margin:0;font-size:18px}.feature p{margin:0;color:#6d7787;font-size:14px;line-height:1.6}.split{background:#f3f5f8}.split-grid{display:grid;grid-template-columns:1fr 1fr;min-height:540px}.split-copy{padding:75px;display:flex;flex-direction:column;justify-content:center}.split-copy h2{font-size:38px;line-height:1.12;letter-spacing:-1.5px}.split-copy p{color:#687385;line-height:1.75;max-width:510px}.tracks{padding-top:18px}.track-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:0;border:1px solid #e4e7eb;margin-top:35px}.track{padding:25px;border-right:1px solid #e4e7eb;min-height:220px}.track:last-child{border:0}.track small{font-weight:800;color:#315db6}.track h3{font-size:18px;line-height:1.25}.track p{font-size:13px;color:#707b8b;line-height:1.6}.cta{margin:0 auto 80px;max-width:1120px;background:#182a50;color:#fff;padding:42px 48px;display:flex;justify-content:space-between;align-items:center}.cta h2{font-size:29px;margin:0;letter-spacing:-1px}.cta p{color:#b7c5dc;margin:7px 0 0}.cta .button{border-color:#fff;background:#fff;color:#17284c}footer{border-top:1px solid #e7e9ed;padding:36px 0;color:#788394;font-size:13px}.footer-row{display:flex;justify-content:space-between}@media(max-width:850px){.links{display:none}.hero-grid,.section-head,.split-grid{grid-template-columns:1fr}.image-stack{height:420px}.hero h1{font-size:45px}.section-head{gap:15px}.feature{grid-template-columns:50px 1fr}.feature p{grid-column:2}.track-grid{grid-template-columns:1fr 1fr}.track:nth-child(2){border-right:0}.split-copy{padding:50px 30px}.cta{margin:0 20px 50px;display:block}.cta .button{margin-top:20px}}@media(max-width:560px){.container{padding:0 20px}.track-grid{grid-template-columns:1fr}.track{border-right:0;border-bottom:1px solid #e4e7eb}.stats{display:none}}
.note{font-size:12px;color:#7c8796;margin-top:16px}
.badges{display:flex;flex-direction:column;gap:14px;margin-top:22px;align-items:flex-start}
.badge{display:flex;align-items:center;gap:9px;background:#fff;border:1px solid #e4e7eb;border-radius:30px;padding:8px 16px 8px 8px;font-size:12px;font-weight:750;letter-spacing:.03em;text-transform:uppercase;color:#182230}
.badge-icon{width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.badge-icon svg{width:14px;height:14px}

.split-photo {
  background: url('https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1400&q=85') center/cover;
  width: 380px;          /* Equal width and height for a perfect circle */
  height: 380px;
  border-radius: 50%;    /* Makes it round */
  margin: auto;          /* Centers it in its grid column */
}

.modern-feature-section {
  padding: 80px 0;
}

.modern-feature-grid {
  display: grid;
  grid-template-columns: 1fr 1.1fr;
  gap: 60px;
  align-items: center;
}

.modern-feature-left h2 {
  font-size: 38px;
  line-height: 1.15;
  color: #182230;
  font-weight: 800;
  letter-spacing: -1.3px;
  margin: 10px 0 16px;
}

.modern-feature-left .lead {
  font-size: 15px;
  color: #687385;
  line-height: 1.65;
  margin-bottom: 28px;
}

.btn-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: 1px solid #d9dee6;
  border-radius: 30px;
  background: #ffffff;
  color: #182230;
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
  box-shadow: 0 2px 5px rgba(0,0,0,0.04);
  transition: all 0.2s ease;
}

.btn-pill:hover {
  border-color: #315db6;
  color: #315db6;
}

.feature-cards-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  align-items: stretch; /* Ensures equal height for centering */
}

.feature-card-item {
  background: #fff;
  border-radius: 20px;
  min-height: 220px; /* Sets fixed area height */
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;    /* Center horizontally */
  justify-content: center; /* Center vertically */
  text-align: center;
  border: 1px solid #f0f2f5;
  box-shadow: 0 10px 30px rgba(24, 34, 48, 0.04);
}

.feature-card-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 14px 35px rgba(24, 34, 48, 0.08);
}

.feature-card-icon {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0; /* Prevents top/bottom margin skew */
}

.feature-card-icon svg {
  width: 22px;
  height: 22px;
}

.feature-card-item h3 {
  font-size: 16px;
  font-weight: 750;
  color: #182230;
  margin: 0; 
  line-height: 1.35;
}

.blue-badge-num {
  background: #315db6;
  color: #ffffff;
  font-size: 13px;
  font-weight: 800;
  padding: 4px 14px;
  border-radius: 20px;
  margin: 12px 0 10px 0; /* Clear extra side margins */
  display: inline-block;
}

@media (max-width: 850px) {
  .modern-feature-grid {
    grid-template-columns: 1fr;
    gap: 40px;
  }
}

@media (max-width: 560px) {
  .feature-cards-grid {
    grid-template-columns: 1fr;
  }
}
`;

const FEATURES = [
  {
    number: "01",
    title: "Learn the workflow",
    body: "Short, structured modules are provided for easy and efficient learning.",
  },
  {
    number: "02",
    title: "Check your understanding",
    body: "Quizes are provided to test your knowledge and identify areas for improvement.",
  },
  {
    number: "03",
    title: "Do practical work",
    body: "Students make use of industry-standard tools to apply their new skills using provided exercises.",
  },
  {
    number: "04",
    title: "Keep the evidence",
    body: "CV worthy certificates are provided after modules are completed.",
  },
];

const TRACKS = [
  {
    number: "01",
    title: "Git & Version Control",
    body: "Branching strategies, pull requests, code review and working along side other developers.",
  },
  {
    number: "02",
    title: "APIs & Web Services",
    body: "RESTful API design, HTTP protocols, JSON and authentication tokens.",
  },
  {
    number: "03",
    title: "CI/CD Pipelines",
    body: "Automated builds, unit testing automation, and continuous development.",
  },
  {
    number: "04",
    title: "Cloud Basics",
    body: "Fundamentals of AWS/Azure, serverless functions, and hosting.",
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
        <div className="actions">
          <a className="button" href="/login">
            Sign in
          </a>
          <a className="button dark" href="/signup">
            Get started
          </a>
        </div>
      </header>

 <main className="hero">
  <div className="container hero-grid">
    <div>
      <h1>
        Bridging the <br />
        <span style={{ color: "#315db6" }}>Classroom-to-Career</span>
        <br />
        Gap
      </h1>
      <p>
        BridgeTech aims to bridge the gap between the theoretical knowledge
        taught in university and the skills expected in the industry.
      </p>

      <div className="badges">
        <div className="badge">
          <div className="badge-icon" style={{ background: "#315db6" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 3" />
            </svg>
          </div>
          Learn at your own pace
        </div>

        <div className="badge">
          <div className="badge-icon" style={{ background: "#e08a2c" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
              <path d="M8 6l-6 6 6 6M16 6l6 6-6 6" />
            </svg>
          </div>
          Build practical experience
        </div>

        <div className="badge">
          <div className="badge-icon" style={{ background: "#2f9e5b" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
              <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z" />
            </svg>
          </div>
          Track real progress
        </div>  

        <div className="badge">
          <div className="badge-icon" style={{ background: "#9b3fc9" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
              <path d="M3 12l3-3 3 3-3 3zM9 6h12M9 12h12M9 18h12" />
            </svg>
          </div>
          Industry-standard tools
        </div>      
      </div>
    </div>

    <div className="image-stack">
      <img
        className="hero-img"
        src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=85"
        alt="Students working together"
      />
    </div>
  </div>
</main>

      <section className="modern-feature-section">
        <div className="container modern-feature-grid">
          <div className="modern-feature-left">
            <h2>Move beyond theory into real development</h2>
            <p className="lead">
              BridgeTech focuses on providing students with industry-relevant practical exercises rather 
              only lessons dedicated to theoretical knowledge. Every module is deigned to take you from 
              understanding how the tool works to applying it at an industry level.
            </p>          
          </div>

          <div className="feature-cards-grid">
            {FEATURES.map((f) => (
              <div className="feature-card-item" key={f.number}>
                <div
                  className="feature-card-icon"
                  style={{ backgroundColor: f.bg, color: f.color }}
                >
                  {f.icon}
                </div>
                <span className="blue-badge-num">{f.number}</span>
                <h3>{f.title}</h3>
                <p>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      
      <section className="split">
        <div className="split-grid" style={{ alignItems: "center", padding: "60px 0" }}>
          <div className="split-photo" />
          <div className="split-copy">
            <div className="eyebrow">Why BridgeTech?</div>
            <h2>
              University gives you the foundation. The industry expects
              you to know more.
            </h2>
            <p>
              Students are often underprepared for the actual work that they 
              will be expected to do in the industry. This causes new graduates
              to struggle finding employement since they lack the necessary
              skills and experience needed to work effectively in a professional
              environment.              
            </p>              
            <p>
              BridgeTech was designed to help students gain an understanding
              of and practical experience for what is expected in the industry.
              BridgeTech gives students exposure to the tools used to develop
              software projects once they have joined a workforce.
            </p>
          </div>
        </div>
      </section>

      <section className="section tracks">
        <div className="container">
          <h2>The modules we focus on</h2>
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
          <h2>Start building practical experience before graduation</h2>
          <p>Join BridgeTech for a transformative learning experience.</p>
        </div>
      </div>

      <footer>
        <div className="container footer-row">
          <div className="logo">
            <span style={{ color: "#000000" }}>Bridge</span><i>Tech</i>
          </div>
          <div>Practical industry tool learning for computer science students.</div>
        </div>
      </footer>
    </>
  );
}
