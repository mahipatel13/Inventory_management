import React from 'react';
import './Footer.css';

const Footer = () => {
  const college = process.env.REACT_APP_COLLEGE_NAME || 'Chandubhai S. Patel Institute of Technology';
  const email = process.env.REACT_APP_AIML_EMAIL || 'principal.cspit@charusat.ac.in';
  const contact = process.env.REACT_APP_AIML_CONTACT || '+91-2697-265112';

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">{college}</div>
        <div className="footer-meta">
          <a href={`mailto:${email}`} className="footer-link">{email}</a>
          <span className="footer-sep">•</span>
          <a href={`tel:${contact.replace(/\s/g,'')}`} className="footer-link">{contact}</a>
          <span className="footer-sep">•</span>
          <span className="footer-dept">AIML Department</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
