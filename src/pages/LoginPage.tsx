import React, { useState } from "react";
import "./App.css";

interface LoginPageProps {
  onLogin: () => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple mock authentication
    if (username === "admin" && password === "password") {
      onLogin();
    } else {
      setError("Invalid username or password");
    }
  };

  return (
    <div className="start-page-wrapper">
      <div className="start-page-content" style={{ maxWidth: "400px" }}>
        <div className="start-header">
          <h1>RD Workstation</h1>
          <p>Please log in to continue</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>

            {error && (
              <div className="alert-banner danger" style={{ marginTop: "1rem" }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary"
              style={{ width: "100%", marginTop: "1rem", padding: "0.75rem" }}
            >
              Log In
            </button>
          </form>
        </div>

        <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "1.5rem" }}>
          Demo credentials: admin / password
        </p>
      </div>
    </div>
  );
}
