import { useState } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "/api";

function getErrorMessage(error) {
  return error.response?.data?.detail
    || error.response?.data?.message
    || "Something went wrong. Please try again.";
}

function AuthPage({ mode, onClose, onSuccess, onSwitch }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const isRegistering = mode === "register";

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const response = await axios.post(`${API}/auth/${mode}`, {
        ...(isRegistering ? { name: name.trim() } : {}),
        email: email.trim(),
        password,
      });
      onSuccess(response.data);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <header className="auth-page-header">
        <div className="auth-page-brand">
          <span className="auth-brand-mark">SK</span>
          <span className="auth-page-logo">Shop<span>Kart</span></span>
        </div>
        <button className="auth-back-link" type="button" onClick={onClose}>
          ← Back to ShopKart
        </button>
      </header>

      <main className="auth-page-main">
        <section className="auth-dialog" aria-labelledby="auth-title">
          <p className="auth-eyebrow">WELCOME TO SHOPKART</p>
          <h1 id="auth-title">{isRegistering ? "Create your account" : "Welcome back"}</h1>
          <p className="auth-description">
            {isRegistering
              ? "Sign up to save your favorites and shop the latest styles."
              : "Sign in to continue your ShopKart experience."}
          </p>

          <form className="auth-form" onSubmit={submit}>
            {isRegistering && (
              <label>
                Full name
                <input
                  autoComplete="name"
                  maxLength={150}
                  onChange={(event) => setName(event.target.value)}
                  required
                  value={name}
                />
              </label>
            )}
            <label>
              Email address
              <input
                autoComplete="email"
                maxLength={255}
                onChange={(event) => setEmail(event.target.value)}
                required
                type="email"
                value={email}
              />
            </label>
            <label>
              Password
              <input
                autoComplete={isRegistering ? "new-password" : "current-password"}
                minLength={isRegistering ? 8 : undefined}
                maxLength={72}
                onChange={(event) => setPassword(event.target.value)}
                required
                type="password"
                value={password}
              />
            </label>
            {isRegistering && (
              <p className="auth-password-hint">Use at least 8 characters.</p>
            )}
            {error && <p className="auth-error" role="alert">{error}</p>}
            <button className="auth-submit" disabled={submitting} type="submit">
              {submitting
                ? "Please wait..."
                : isRegistering
                  ? "Create account"
                  : "Sign in"}
            </button>
          </form>

          <p className="auth-switch">
            {isRegistering ? "Already have an account?" : "New to ShopKart?"}
            <button type="button" onClick={onSwitch}>
              {isRegistering ? "Sign in" : "Create an account"}
            </button>
          </p>
        </section>
      </main>
    </div>
  );
}

export default AuthPage;
