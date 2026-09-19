import { Link } from "react-router-dom";
import "./TermsOfService.css";

function TermsOfService() {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <Link to="/signup" className="legal-back">
          ← Back to Sign Up
        </Link>

        <header className="legal-header">
          <p className="legal-label">BRIDGETECH</p>

          <h1>Terms of Service</h1>

          <p className="legal-updated">
            Last updated: 19 September 2026
          </p>
        </header>

        <section>
          <h2>1. About BridgeTech</h2>

          <p>
            BridgeTech is an educational platform designed to provide
            students with access to practical information technology learning
            materials, activities, assessments, and related educational
            resources.
          </p>
        </section>

        <section>
          <h2>2. Accepting These Terms</h2>

          <p>
            By creating an account or using BridgeTech, you agree to these
            Terms of Service and our Privacy Policy. If you do not agree with
            these terms, you should not create an account or use the platform.
          </p>
        </section>

        <section>
          <h2>3. Your Account</h2>

          <p>
            You are responsible for providing accurate information when
            creating your account and for keeping your account credentials
            confidential.
          </p>

          <p>
            You should not share your password with another person or use
            another user's account without permission. You are responsible for
            activity carried out through your account.
          </p>
        </section>

        <section>
          <h2>4. Acceptable Use</h2>

          <p>When using BridgeTech, you agree not to:</p>

          <ul>
            <li>Use the platform for unlawful or fraudulent purposes.</li>

            <li>
              Attempt to gain unauthorised access to another user's account or
              BridgeTech systems.
            </li>

            <li>
              Interfere with the operation or security of the platform.
            </li>

            <li>
              Upload or submit content that is unlawful, harmful, or intended
              to compromise the platform.
            </li>

            <li>
              Misrepresent your identity or impersonate another person.
            </li>
          </ul>
        </section>

        <section>
          <h2>5. Educational Content</h2>

          <p>
            BridgeTech provides educational resources for learning purposes.
            While reasonable efforts may be made to keep educational content
            useful and accurate, BridgeTech does not guarantee that all
            educational material will always be complete, current, or
            error-free.
          </p>
        </section>

        <section>
          <h2>6. Intellectual Property</h2>

          <p>
            BridgeTech and its contributors retain the rights to content,
            branding, designs, software, and other materials made available
            through the platform unless otherwise stated.
          </p>

          <p>
            You may use BridgeTech's educational materials for their intended
            educational purpose. You may not copy, redistribute, sell, or
            commercially exploit BridgeTech materials without appropriate
            permission.
          </p>
        </section>

        <section>
          <h2>7. Account Suspension or Termination</h2>

          <p>
            Access to an account may be suspended or terminated where there is
            a reasonable basis to believe that the account has been used in
            violation of these Terms of Service, applicable law, or the
            security of the platform.
          </p>
        </section>

        <section>
          <h2>8. Availability of the Platform</h2>

          <p>
            BridgeTech may occasionally be unavailable because of maintenance,
            technical problems, updates, or circumstances outside the
            platform's control.
          </p>

          <p>
            We do not guarantee that BridgeTech will always be available or
            operate without interruption.
          </p>
        </section>

        <section>
          <h2>9. Changes to These Terms</h2>

          <p>
            These Terms of Service may be updated when BridgeTech's features,
            services, or requirements change. The updated version will be
            published on this page with a revised "Last updated" date.
          </p>
        </section>

        <section>
          <h2>10. Privacy</h2>

          <p>
            Your use of BridgeTech is also subject to our Privacy Policy,
            which explains what personal information we collect, why we use
            it, and how it is handled.
          </p>

          <Link to="/privacy-policy" className="legal-inline-link">
            Read the Privacy Policy →
          </Link>
        </section>

        <section>
          <h2>11. Governing Law</h2>

          <p>
            These Terms are intended to operate in accordance with the
            applicable laws of the Republic of South Africa.
          </p>
        </section>

        <section>
          <h2>12. Contact</h2>

          <p>
            If you have questions about these Terms of Service, please contact
            the BridgeTech project administrators through the appropriate
            project or institutional communication channel.
          </p>
        </section>

        <footer className="legal-footer">
          <Link to="/signup">Sign Up</Link>

          <span>•</span>

          <Link to="/privacy-policy">Privacy Policy</Link>
        </footer>
      </div>
    </div>
  );
}

export default TermsOfService;