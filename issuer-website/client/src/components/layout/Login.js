import React, { Component } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { loginUser } from "../../actions/authActions";
import classnames from "classnames";

class Login extends Component {
  constructor() {
    super();
    this.state = { email: "", password: "", errors: {}, isLoading: false };
  }

  componentDidMount() {
    if (this.props.auth.isAuthenticated) {
      this.props.history.push("/dashboard");
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.auth.isAuthenticated) {
      this.props.history.push("/dashboard");
    }
    if (nextProps.errors) {
      this.setState({ errors: nextProps.errors, isLoading: false });
    }
  }

  onChange = (e) => this.setState({ [e.target.id]: e.target.value });

  onSubmit = (e) => {
    e.preventDefault();
    this.setState({ isLoading: true });
    this.props.loginUser({ email: this.state.email, password: this.state.password });
  };

  render() {
    const { email, password, errors, isLoading } = this.state;
    return (
      <div className="auth-wrapper">
        <div className="auth-card animate-fadeInUp">
          <div className="auth-card-header">
            <div className="auth-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <h2 style={{ fontWeight: 800, fontSize: '1.6rem', color: 'var(--text-primary)', marginBottom: 6 }}>
              Welcome Back
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
              Sign in to the Issuer Portal
            </p>
          </div>

          <div className="auth-card-body">
            <form onSubmit={this.onSubmit}>
              <div className="auth-input-group">
                <label htmlFor="email" className="auth-label">Email Address</label>
                <input
                  type="email"
                  id="email"
                  placeholder="you@institution.edu"
                  value={email}
                  onChange={this.onChange}
                  className={classnames("form-control", { "is-invalid": !!errors.email || !!errors.emailnotfound })}
                />
                {(errors.email || errors.emailnotfound) && (
                  <div className="invalid-feedback d-block mt-1">{errors.email || errors.emailnotfound}</div>
                )}
              </div>

              <div className="auth-input-group">
                <label htmlFor="password" className="auth-label">Password</label>
                <input
                  type="password"
                  id="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={this.onChange}
                  className={classnames("form-control", { "is-invalid": !!errors.password || !!errors.passwordincorrect })}
                />
                {(errors.password || errors.passwordincorrect) && (
                  <div className="invalid-feedback d-block mt-1">{errors.password || errors.passwordincorrect}</div>
                )}
              </div>

              <button type="submit" className="auth-submit-btn" disabled={isLoading}>
                {isLoading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                    <span style={{ width: 18, height: 18, border: '2px solid rgba(5,13,26,0.3)', borderTopColor: '#050d1a', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                    Authenticating…
                  </span>
                ) : 'Sign In'}
              </button>

              <div className="auth-footer-text">
                Don't have an account?{' '}
                <Link to="/register" className="auth-link">Register here</Link>
              </div>
            </form>

            <div className="security-badge">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              JWT Protected Session
            </div>
          </div>
        </div>
      </div>
    );
  }
}

Login.propTypes = {
  loginUser: PropTypes.func.isRequired,
  auth: PropTypes.object.isRequired,
  errors: PropTypes.object.isRequired,
};

const mapStateToProps = (state) => ({ auth: state.auth, errors: state.errors });
export default connect(mapStateToProps, { loginUser })(Login);
