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
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <h2 style={{ fontWeight: 800, fontSize: '1.6rem', color: 'var(--text-primary)', marginBottom: 6 }}>
              Create Account
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
              Join the Issuer Portal
            </p>
          </div>

          <div className="auth-card-body">
            <form onSubmit={this.onSubmit}>
              {[
                { id: 'name', label: 'Full Name', type: 'text', placeholder: 'Dr. Jane Smith', err: errors.name },
                { id: 'email', label: 'Email Address', type: 'email', placeholder: 'admin@institution.edu', err: errors.email },
                { id: 'password', label: 'Password', type: 'password', placeholder: '••••••••', err: errors.password },
                { id: 'password2', label: 'Confirm Password', type: 'password', placeholder: '••••••••', err: errors.password2 },
              ].map(field => (
                <div className="auth-input-group" key={field.id}>
                  <label htmlFor={field.id} className="auth-label">{field.label}</label>
                  <input
                    type={field.type}
                    id={field.id}
                    placeholder={field.placeholder}
                    value={this.state[field.id]}
                    onChange={this.onChange}
                    className={classnames("form-control", { "is-invalid": !!field.err })}
                  />
                  {field.err && <div className="invalid-feedback d-block mt-1">{field.err}</div>}
                </div>
              ))}

              <button type="submit" className="auth-submit-btn" disabled={isLoading}>
                {isLoading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                    <span style={{ width: 18, height: 18, border: '2px solid rgba(5,13,26,0.3)', borderTopColor: '#050d1a', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                    Creating Account…
                  </span>
                ) : 'Create Account'}
              </button>

              <div className="auth-footer-text">
                Already have an account?{' '}
                <Link to="/login" className="auth-link">Sign in</Link>
              </div>
            </form>

            <div className="security-badge">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              Your identity is secured end-to-end
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
