import { Link, useLocation } from 'wouter';
import { useAuth } from '../context/AuthContext';
import { useUnreadCount } from '../hooks/useQueries';
import Avatar from './Avatar';
import { useState, useCallback, useMemo, memo, useContext, useEffect } from 'react';
import { OverlayContext } from '../context/OverlayContext';

export function useOverlay() {
  const ctx = useContext(OverlayContext);
  if (!ctx) throw new Error('useOverlay must be used within OverlayProvider');
  return ctx;
}

import AppLogo from '../asssets/AppLogo.png';
import mobileBackground from '../asssets/mobile_background.png';
import desktopBackground from '../asssets/desktop_background.jpg';
import styles from './Layout.module.css';

const categories = [
  { name: 'Society', emoji: '🌐' },
  { name: 'Tech', emoji: '🤖' },
  { name: 'Culture', emoji: '🎭' },
  { name: 'Money', emoji: '💸' },
];

// Icon Components
const LiveRoomIcon = memo(function LiveRoomIcon({ active, size = 22 }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" fill={active ? 'currentColor' : 'none'} fillOpacity="0.2" />
    </svg>
  );
});

const ExploreIcon = memo(function ExploreIcon({ active, size = 22 }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
});

const ThreadsIcon = memo(function ThreadsIcon({ active, size = 22 }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
});

const NotifIcon = memo(function NotifIcon({ active, size = 22, unreadCount = 0 }) {
  return (
    <div className="relative">
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" fill={active ? 'currentColor' : 'none'} fillOpacity="0.2" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full border border-[hsl(var(--sidebar))]" />
      )}
    </div>
  );
});

const ProfileIcon = memo(function ProfileIcon({ active, size = 22 }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" fill={active ? 'currentColor' : 'none'} fillOpacity="0.2" />
    </svg>
  );
});

// NavItem Component with memoization
const NavItem = memo(function NavItem({ path, label, icon: Icon, isActive }) {
  return (
    <Link href={path} className={styles.navItem}>
      <span className={`${styles.navItem} ${isActive ? styles.active : ''}`} role="link" tabIndex={0}>
        <span className={styles.navIcon}>
          <Icon active={isActive} />
        </span>
        <span className={styles.navLabel}>{label}</span>
      </span>
    </Link>
  );
});

NavItem.displayName = 'NavItem';

// DesktopSidebar Component
export const DesktopSidebar = memo(function DesktopSidebar({ onCategoryClick, activeCategory }) {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);
  const { data: unreadData } = useUnreadCount();
  const unreadCount = unreadData?.count || 0;

  const navItems = useMemo(() => [
    { path: '/', label: 'Live Room', icon: LiveRoomIcon },
    { path: '/explore', label: 'Explore', icon: ExploreIcon },
    { path: '/threads', label: 'Your Threads', icon: ThreadsIcon },
    { path: '/notifications', label: 'Notification', icon: NotifIcon },
  ], []);

  const isActive = useCallback((path) => {
    return location === path || (path !== '/' && location.startsWith(path));
  }, [location]);

  const handleMouseEnter = useCallback(() => {
    setIsExpanded(true);
  }, []);

  const handleMouseLeave = useCallback((e) => {
    // Don't close sidebar if mouse is moving to dropdown content
    const relatedTarget = e.relatedTarget;
    if (
      relatedTarget &&
      typeof relatedTarget.closest === 'function' &&
      relatedTarget.closest('[role="menu"]')
    ) {
      return;
    }
    setIsExpanded(false);
  }, []);

  const handleKeyDown = useCallback((e, index) => {
    const items = navItems.length + categories.length;
    let nextIndex = index;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        nextIndex = (index + 1) % items;
        break;
      case 'ArrowUp':
        e.preventDefault();
        nextIndex = (index - 1 + items) % items;
        break;
      case 'Home':
        e.preventDefault();
        nextIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        nextIndex = items - 1;
        break;
      default:
        return;
    }

    // Focus the next element
    const nextElement = document.querySelector(`[data-nav-index="${nextIndex}"]`);
    if (nextElement) {
      nextElement.focus();
    }
  }, [navItems]);

  return (
    <aside 
      className={`${styles.sidebar} ${isExpanded ? styles.expanded : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className={styles.logoContainer}>
        <Link href="/" className={styles.logoLink}>
          <img src={AppLogo} alt="Let's Talk" className={styles.logoImage} />
        </Link>
        <span className={styles.logoLabel}>Let's Talk</span>
      </div>

      <nav className={styles.navItems} role="menubar" aria-label="Primary">
        {navItems.map(({ path, label, icon: Icon }, index) => {
          const active = isActive(path);
          return (
            <Link 
              key={path} 
              href={path}
              data-nav-index={index}
              className={styles.navItem}
              role="menuitem"
              tabIndex={0}
              onKeyDown={(e) => handleKeyDown(e, index)}
            >
              <span className={`${styles.navItem} ${active ? styles.active : ''}`}>
                <span className={styles.navIcon}>
                  <Icon active={active} unreadCount={label === 'Notification' ? unreadCount : 0} />
                </span>
                <span className={styles.navLabel}>
                  {label}
                  {label === 'Notification' && unreadCount > 0 && (
                    <span className="ml-auto bg-purple-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </span>
              </span>
            </Link>
          );
        })}
      </nav>

      <div className={styles.categoriesSection}>
        <div className={styles.categoriesList}>
          {categories.map((category) => {
            const isActive = activeCategory === category.name;
            return (
              <button
                key={category.name}
                className={`${styles.categoryButton} ${isActive ? styles.active : ''}`}
                onClick={() => {
                  if (onCategoryClick) {
                    onCategoryClick(category.name);
                  } else {
                    // If no handler, navigate to explore with the category
                    setLocation(`/explore?category=${category.name}`);
                  }
                }}
                type="button"
              >
                <span className={styles.categoryEmoji}>{category.emoji}</span>
                <span className={styles.categoryLabel}>{category.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {user && (
        <div className={`${styles.userSection} ${location === '/profile' ? styles.active : ''}`}>
          <Link href="/profile" className={styles.userProfile}>
            <Avatar user={user} size={32} className={styles.userAvatar} />
            <div className={styles.userInfo}>
              <span className={styles.userYou}>You</span>
              <span className={styles.userUsername}>@{user.username}</span>
            </div>
          </Link>
        </div>
      )}
    </aside>
  );
});

DesktopSidebar.displayName = 'DesktopSidebar';

// MobileNav Component
export function MobileNav() {
  const [location] = useLocation();
  const { data: unreadData } = useUnreadCount();
  const unreadCount = unreadData?.count || 0;
  
  const navItems = useMemo(() => [
    { path: '/', label: 'Live', icon: LiveRoomIcon },
    { path: '/explore', label: 'Explore', icon: ExploreIcon },
    { path: '/threads', label: 'Threads', icon: ThreadsIcon },
    { path: '/notifications', label: 'Notification', icon: NotifIcon },
    { path: '/profile', label: 'Profile', icon: ProfileIcon },
  ], []);

  const isActive = useCallback((path) => {
    return location === path || (path !== '/' && location.startsWith(path));
  }, [location]);

  return (
    <nav className={styles.mobileNav} role="navigation" aria-label="Mobile navigation">
      <div className={styles.mobileNavItems}>
        {navItems.map(({ path, label, icon: Icon }) => {
          const active = isActive(path);
          return (
            <Link key={path} href={path} className={styles.mobileNavItem}>
              <span className={`${styles.mobileNavItem} ${active ? styles.active : ''}`}>
                <Icon active={active} size={22} unreadCount={label === 'Notification' ? unreadCount : 0} />
                <span className={styles.mobileNavLabel}>{label}</span>
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// Layout Component
function Layout({ children, onCategoryClick, activeCategory, hideMobileNav, headerProps }) {
  const { isOverlayEnabled } = useOverlay();

  // Keyboard awareness logic removed in favor of 100dvh flexbox layout
  // which handles resizing more reliably across different mobile browsers.
  
  return (
    <div className={styles.appContainer}>
      <div className={isOverlayEnabled ? styles.backgroundOverlay : styles.backgroundOverlayHidden} />

      {/* Desktop sidebar — full height, left edge */}
      <DesktopSidebar onCategoryClick={onCategoryClick} activeCategory={activeCategory} />

      {/* Desktop header — spans content area only (left: 64px) */}
      {headerProps && (
        <header className={styles.desktopHeader}>
          <div className={styles.headerContent}>
            <div className={styles.headerLeft}>
              {headerProps.showBack && (
                <button
                  key={`back-${headerProps.title || 'default'}`}
                  onClick={headerProps.onBack}
                  className={styles.backButton}
                  aria-label="Go back"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
              )}
              {headerProps.icon && <span className={styles.headerIcon}>{headerProps.icon}</span>}
              <h1 className={styles.headerTitle}>{headerProps.title}</h1>
              {headerProps.subtitle && <span className={styles.headerSubtitle}>{headerProps.subtitle}</span>}
            </div>
            {headerProps.rightElement && (
              <div className={styles.headerRight}>{headerProps.rightElement}</div>
            )}
          </div>
        </header>
      )}

      {/* Mobile fixed header */}
      {headerProps && (
        <header className={styles.mobileHeader}>
          <div className={styles.headerContent}>
            <div className={styles.headerLeft}>
              {headerProps.showBack && (
                <button
                  onClick={headerProps.onBack}
                  className={styles.backButton}
                  aria-label="Go back"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
              )}
              {headerProps.icon && <span className={styles.headerIcon}>{headerProps.icon}</span>}
              <h1 className={styles.headerTitle}>{headerProps.title}</h1>
              {headerProps.subtitle && <span className={styles.headerSubtitle}>{headerProps.subtitle}</span>}
            </div>
            {headerProps.rightElement && (
              <div className={styles.headerRight}>{headerProps.rightElement}</div>
            )}
          </div>
        </header>
      )}

      <div className={`${styles.mainContent} ${headerProps ? styles.mainContentWithHeader : ''} ${hideMobileNav ? styles.noMobileNav : ''}`}>
        {children}
      </div>

      {!hideMobileNav && <MobileNav />}
    </div>
  );
}

// Default export
export default Layout;