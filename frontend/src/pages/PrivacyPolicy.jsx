import { Link } from "react-router-dom";
import "./PrivacyPolicy.css";

function PrivacyPolicy() {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <Link to="/signup" className="legal-back">
          ← Back to Sign Up
        </Link>

        <header className="legal-header">
          <p className="legal-label">BRIDGETECH</p>

          <h1>Privacy Policy</h1>

          <p className="legal-updated">
            Last updated: 19 September 2026
          </p>
        </header>

        <section>
          <h2>1. Introduction</h2>

          <p>
            BridgeTech respects your privacy and is committed to handling
            personal information responsibly. This Privacy Policy explains
            what information may be collected when you create and use a
            BridgeTech account and how that information is used.
          </p>

          <p>
            This policy is intended to provide information about BridgeTech's
            handling of personal information in accordance with applicable
            South African privacy requirements, including the Protection of
            Personal Information Act 4 of 2013 (POPIA).
          </p>
        </section>

        <section>
          <h2>2. Information We Collect</h2>

          <p>
            When you create a BridgeTech account, we may collect the following
            information:
          </p>

          <ul>
            <li>Username</li>
            <li>First name</li>
            <li>Last name</li>
            <li>Email address</li>
            <li>Password information</li>
            <li>Optional GitHub username</li>
            <li>Account role information</li>
          </ul>
        </section>

        <section>
          <h2>3. Passwords</h2>

          <p>
            BridgeTech does not intend to store user passwords as readable
            plain text. Passwords should be securely processed using
            appropriate password-hashing mechanisms before being stored.
          </p>

          <p>
            You should also use a unique password for your BridgeTech account
            and avoid sharing it with other people.
          </p>
        </section>

        <section>
          <h2>4. Why We Use Your Information</h2>

          <p>
            The information associated with your account may be used to:
          </p>

          <ul>
            <li>Create and manage your BridgeTech account.</li>

            <li>Authenticate you when you sign in.</li>

            <li>Identify your account and assigned role.</li>

            <li>Track educational progress where applicable.</li>

            <li>Provide relevant BridgeTech learning functionality.</li>

            <li>Maintain the security and operation of the platform.</li>
          </ul>
        </section>

        <section>
          <h2>5. Information We Do Not Need</h2>

          <p>
            BridgeTech should only request information that is relevant to
            providing and maintaining the platform. We do not require
            information such as payment-card details to create a standard
            BridgeTech learning account.
          </p>
        </section>

        <section>
          <h2>6. Sharing of Information</h2>

          <p>
            BridgeTech does not sell your personal information.
          </p>

          <p>
            Personal information should only be disclosed to other parties
            where there is a legitimate reason to do so, such as providing the
            service, maintaining the platform, complying with a legal
            obligation, or protecting the security and rights of users and the
            platform.
          </p>
        </section>

        <section>
          <h2>7. Data Security</h2>

          <p>
            Reasonable technical and organisational measures should be used to
            protect personal information against unauthorised access,
            disclosure, alteration, loss, or destruction.
          </p>

          <p>
            No online service can guarantee absolute security. Users should
            therefore also take reasonable steps to protect their own account
            credentials.
          </p>
        </section>

        <section>
          <h2>8. Retention of Information</h2>

          <p>
            Personal information should not be retained for longer than is
            reasonably necessary for the purpose for which it was collected,
            unless a longer retention period is required or permitted by law.
          </p>
        </section>

        <section>
          <h2>9. Your Rights</h2>

          <p>
            Subject to applicable law, users may have rights relating to their
            personal information, including the right to request access to
            information held about them and to request correction of
            inaccurate information.
          </p>

          <p>
            POPIA also provides data subjects with rights relating to the
            processing of their personal information.
          </p>
        </section>

        <section>
          <h2>10. Cookies and Similar Technologies</h2>

          <p>
            BridgeTech may use technologies necessary for the operation of the
            platform, such as authentication-related storage. If additional
            analytics, advertising, or non-essential tracking technologies are
            introduced, this Privacy Policy should be updated to explain their
            use.
          </p>
        </section>

        <section>
          <h2>11. Changes to This Privacy Policy</h2>

          <p>
            This Privacy Policy may be updated when BridgeTech's features,
            data practices, or applicable legal requirements change. The
            latest version will be published on this page together with an
            updated date.
          </p>
        </section>

        <section>
          <h2>12. Contact</h2>

          <p>
            If you have questions about this Privacy Policy or how your
            personal information is handled, please contact the BridgeTech
            project administrators through the appropriate project or
            institutional communication channel.
          </p>
        </section>

        <footer className="legal-footer">
          <Link to="/signup">Sign Up</Link>

          <span>•</span>

          <Link to="/terms">Terms of Service</Link>
        </footer>
      </div>
    </div>
  );
}

export default PrivacyPolicy;