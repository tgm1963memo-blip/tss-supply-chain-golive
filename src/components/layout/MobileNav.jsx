import { NavLink } from 'react-router-dom';
import { mobileNavItems } from '../../app/navigation';

export default function MobileNav() {
  return (
    <nav className="mobile-nav" aria-label="Mobile quick navigation">
      {mobileNavItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/executive/management'}
            className={({ isActive }) =>
              `mobile-nav__link ${isActive ? 'mobile-nav__link--active' : ''}`
            }
          >
            <Icon size={16} />
            {item.label}
          </NavLink>
        );
      })}
    </nav>
  );
}
