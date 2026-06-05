import React, { Component } from "react";
import { Link, withRouter } from "react-router-dom";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { registerUser } from "../../actions/authActions";
import classnames from "classnames";

class Register extends Component {
  constructor() {
    super();
    this.state = { name: "", email: "", password: "", password2: "", errors: {}, isLoading: false };
  }

  componentDidMount() {
    if (this.props.auth.isAuthenticated) {
      this.props.history.push("/dashboard");
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.errors) {
      this.setState({ errors: nextProps.errors, isLoading: false });
    }
  }

  onChange = (e) => this.setState({ [e.target.id]: e.target.value });

  onSubmit = (e) => {
    e.preventDefault();
    this.setState({ isLoading: true });
    const newUser = {
      name: this.state.name,
      email: this.state.email,
      password: this.state.password,
      password2: this.state.password2,
    };
    this.props.registerUser(newUser, this.props.history);
  };

  render() {
    const { name, email, password, password2, errors, isLoading } = this.state;
    return (
      <div className="auth-wrapper">
        <div className="auth-card animate-fadeInUp">
          <div className="auth-card-header">
            <div className="auth-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="8.5" cy="7" r="4"/>
                <polyline points="17 11 19 13 23 9"/>
              </svg>
            </div>
            <h2 style={{ fontWeight: 800, fontSize: '1.6rem', color: 'var(--text-primary)', marginBottom: 6 }}>
              Create Account
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
              Join the Receiver Portal
            </p>
          </div>

          <div className="auth-card-body">
            <form onSubmit={this.onSubmit}>
              <div className="auth-input-group">
                <label htmlFor="name" className="auth-label">Full Name</label>
                <input
                  type="text"
                  id="name"
                  placeholder="Your Name"
                  value={name}
                  onChange={this.onChange}
                  className={classnames("form-control", { "is-invalid": !!errors.name })}
                />
                {errors.name && (
                  <div className="invalid-feedback d-block mt-1">{errors.name}</div>
                )}
              </div>

              <div className="auth-input-group">
                <label htmlFor="email" className="auth-label">Email Address</label>
                <input
                  type="email"
                  id="email"
                  placeholder="you@institution.edu"
                  value={email}
                  onChange={this.onChange}
                  className={classnames("form-control", { "is-invalid": !!errors.email })}
                />
                {errors.email && (
                  <div className="invalid-feedback d-block mt-1">{errors.email}</div>
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
                  className={classnames("form-control", { "is-invalid": !!errors.password })}
                />
                {errors.password && (
                  <div className="invalid-feedback d-block mt-1">{errors.password}</div>
                )}
              </div>

              <div className="auth-input-group">
                <label htmlFor="password2" className="auth-label">Confirm Password</label>
                <input
                  type="password"
                  id="password2"
                  placeholder="••••••••"
                  value={password2}
                  onChange={this.onChange}
                  className={classnames("form-control", { "is-invalid": !!errors.password2 })}
                />
                {errors.password2 && (
                  <div className="invalid-feedback d-block mt-1">{errors.password2}</div>
                )}
              </div>

              <button type="submit" className="auth-submit-btn" disabled={isLoading}>
                {isLoading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                    <span style={{ width: 18, height: 18, border: '2px solid rgba(5,13,26,0.3)', borderTopColor: '#050d1a', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                    Registering…
                  </span>
                ) : 'Sign Up'}
              </button>

              <div className="auth-footer-text">
                Already have an account?{' '}
                <Link to="/login" className="auth-link">Login here</Link>
              </div>
            </form>

            <div className="security-badge">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              Cryptographically Secured
            </div>
          </div>
        </div>
      </div>
    );
  }
}

Register.propTypes = {
  registerUser: PropTypes.func.isRequired,
  auth: PropTypes.object.isRequired,
  errors: PropTypes.object.isRequired,
};

const mapStateToProps = (state) => ({ auth: state.auth, errors: state.errors });
export default connect(mapStateToProps, { registerUser })(withRouter(Register));
