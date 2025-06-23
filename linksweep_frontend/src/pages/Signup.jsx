import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import InputField from "../components/InputField";
import "./AuthPages.css";

const Signup = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  });

  const [passwordMatch, setPasswordMatch] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Auto-generate username from email
  useEffect(() => {
    if (formData.email) {
      const emailParts = formData.email.split("@");
      if (emailParts.length > 0) {
        setFormData((prev) => ({
          ...prev,
          username: emailParts[0],
        }));
      }
    }
  }, [formData.email]);

  // Check password match
  useEffect(() => {
    if (formData.confirmPassword) {
      setPasswordMatch(formData.password === formData.confirmPassword);
    }
  }, [formData.password, formData.confirmPassword]);

  const handleInputChange = (field) => (e) => {
    // Prevent username changes if it was auto-generated
    if (field === "username" && formData.email) {
      return; // Don't allow manual username editing when email exists
    }

    setFormData((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));

    // Clear error when user starts typing
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!passwordMatch) {
      setError("Passwords do not match!");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await signup({
        email: formData.email,
        username: formData.username,
        password: formData.password,
      });

      if (result.success) {
        // Redirect to dashboard or home page
        navigate("/dashboard");
      } else {
        setError(result.error || "Signup failed. Please try again.");
      }
    } catch (err) {
      console.error("Signup error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Left side - 60% */}
      <div className="auth-left">
        <div className="auth-background">
          <div className="auth-overlay">
            <div className="auth-content">
              <div className="logo-section">
                <h1 className="logo">LinkSweep</h1>
                <div className="logo-icon">🔗</div>
              </div>
              <div className="quote-section">
                <h2 className="quote-title">Join LinkSweep!</h2>
                <p className="quote-text">
                  "Transform the way you discover, save, and organize web
                  content. Your personalized link management journey begins
                  now."
                </p>
                <div className="quote-author">
                  - Start Building Your Digital Library
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - 40% */}
      <div className="auth-right">
        <div className="auth-form-container">
          <div className="auth-header">
            <h2 className="auth-title">Create Account</h2>
            <p className="auth-subtitle">
              Join thousands of users organizing the web
            </p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {error && <div className="auth-error">{error}</div>}

            <InputField
              type="email"
              label="Email Address"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleInputChange("email")}
              required
              icon="📧"
            />

            <InputField
              type="text"
              label="Username"
              placeholder={
                formData.email ? "Auto-generated from email" : "Your username"
              }
              value={formData.username}
              onChange={handleInputChange("username")}
              required
              icon="👤"
            />

            <InputField
              type="password"
              label="Password"
              placeholder="Create a strong password"
              value={formData.password}
              onChange={handleInputChange("password")}
              required
              icon="🔒"
            />

            <InputField
              type="password"
              label="Confirm Password"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleInputChange("confirmPassword")}
              required
              icon="🔐"
            />

            {formData.confirmPassword && !passwordMatch && (
              <div className="password-error">Passwords do not match</div>
            )}

            <div className="auth-options">
              <label className="remember-me">
                <input type="checkbox" required />
                <span className="checkmark"></span>I agree to the{" "}
                <button type="button" className="terms-link">
                  Terms & Conditions
                </button>
              </label>
            </div>

            <button
              type="submit"
              className="auth-button primary"
              disabled={!passwordMatch || loading}
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>
          <div className="auth-footer">
            <p>
              Already have an account?{" "}
              <Link to="/login" className="auth-link">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;