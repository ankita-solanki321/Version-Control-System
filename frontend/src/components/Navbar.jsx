import { Link } from "react-router-dom";
import logo from "../assets/vcs-mark.svg";
import "./navbar.css";

const Navbar = () => {
  return (
    <nav className="app-nav">
      <Link to="/" className="brand-link" aria-label="Go to dashboard">
        <div className="brand-mark">
          <img
            src={logo}
            alt="Version Control System logo"
          />
          <h3>Version Control System</h3>
        </div>
      </Link>
      <div className="nav-actions">
        <Link to="/create" className="nav-link nav-link-primary">
          Create Repository
        </Link>
        <Link to="/profile" className="nav-link">
          Profile
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
