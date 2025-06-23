import React from "react";
import { useAuth } from "../contexts/AuthContext";
import "./Dashboard.css";

const Dashboard = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1 className="dashboard-title">
            <span className="logo-icon">🔗</span>
            LinkSweep Dashboard
          </h1>
          <div className="user-section">
            <span className="welcome-text">
              Welcome, <strong>{user?.username || user?.email}</strong>!
            </span>
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-content">
          <div className="welcome-card">
            <h2>🎉 Authentication Successful!</h2>
            <p>You have successfully logged in to LinkSweep.</p>
            <p>Your secure session is managed with httpOnly cookies.</p>

            <div className="user-info">
              <h3>Your Profile:</h3>
              <ul>
                <li>
                  <strong>Email:</strong> {user?.email}
                </li>
                <li>
                  <strong>Username:</strong> {user?.username}
                </li>
                <li>
                  <strong>User ID:</strong> {user?.id}
                </li>
              </ul>
            </div>

            <div className="security-info">
              <h3>🔒 Security Features:</h3>
              <ul>
                <li>✅ JWT tokens stored in httpOnly cookies</li>
                <li>✅ Automatic token refresh</li>
                <li>✅ Secure CORS configuration</li>
                <li>✅ No tokens exposed in browser storage</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;