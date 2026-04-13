import { useState } from 'react';

export default function SiteHeader({ activePage, authUser, onHomeClick, onPlannerClick, onInfoClick, onAuthClick, onProfileClick, onAdminClick, onSignOut }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMenu = () => setMobileMenuOpen(false);

  const handleNavClick = (handler) => (event) => {
    closeMenu();
    handler(event);
  };

  const handleSignOut = async () => {
    closeMenu();
    await onSignOut();
  };

  return (
    <header className="site-header">
      <div className="container header-inner">
        <div className="logo">
          <a href="#home" title="Cairo Metro Navigator Home" onClick={handleNavClick(onHomeClick)}>
            <img src="/favicon/metrom-23.png" alt="Cairo Metro Navigator Logo" width="120" height="60" loading="lazy" decoding="async" />
          </a>
        </div>
        <nav className="nav-links" aria-label="Primary navigation">
          <a href="#home" className={activePage === 'home' ? 'active' : ''} onClick={handleNavClick(onHomeClick)}>Home</a>
          <a href="#planner" className={activePage === 'planner' ? 'active' : ''} onClick={handleNavClick(onPlannerClick)}>Planner</a>
          <a href="#metroInfo" className={activePage === 'info' ? 'active' : ''} onClick={handleNavClick(onInfoClick)}>Info</a>
          {authUser?.role === 'ADMIN' ? (
            <a href="#admin" className={activePage === 'admin' ? 'active' : ''} onClick={handleNavClick(onAdminClick)}>Admin</a>
          ) : null}
        </nav>

        <div className="auth-links" aria-label="Authentication actions">
          {authUser ? (
            <>
              <a href="#profile" className={activePage === 'profile' ? 'active' : ''} onClick={handleNavClick(onProfileClick)}>{authUser.name}</a>
              <button type="button" className="auth-btn" onClick={handleSignOut}>Sign Out</button>
            </>
          ) : (
            <a href="#auth" className={activePage === 'auth' ? 'active' : ''} onClick={handleNavClick(onAuthClick)}>Log In</a>
          )}
        </div>

        <button
          type="button"
          className="mobile-menu-toggle"
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-menu-panel"
          onClick={() => setMobileMenuOpen((open) => !open)}
        >
          Menu
        </button>

        <div className={`mobile-menu-panel ${mobileMenuOpen ? 'open' : ''}`} id="mobile-menu-panel">
          <nav className="mobile-menu-group" aria-label="Mobile primary navigation">
            <a href="#home" className={activePage === 'home' ? 'active' : ''} onClick={handleNavClick(onHomeClick)}>Home</a>
            <a href="#planner" className={activePage === 'planner' ? 'active' : ''} onClick={handleNavClick(onPlannerClick)}>Planner</a>
            <a href="#metroInfo" className={activePage === 'info' ? 'active' : ''} onClick={handleNavClick(onInfoClick)}>Info</a>
            {authUser?.role === 'ADMIN' ? (
              <a href="#admin" className={activePage === 'admin' ? 'active' : ''} onClick={handleNavClick(onAdminClick)}>Admin</a>
            ) : null}
          </nav>

          <div className="mobile-menu-group" aria-label="Mobile account actions">
            {authUser ? (
              <>
                <a href="#profile" className={activePage === 'profile' ? 'active' : ''} onClick={handleNavClick(onProfileClick)}>{authUser.name}</a>
                <button type="button" className="auth-btn" onClick={handleSignOut}>Sign Out</button>
              </>
            ) : (
              <a href="#auth" className={activePage === 'auth' ? 'active' : ''} onClick={handleNavClick(onAuthClick)}>Log In</a>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
