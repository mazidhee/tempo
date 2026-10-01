import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { PanelLeftClose, PanelLeftOpen, Command, AudioLines } from 'lucide-react';
import { useProductivity } from '../hooks/ProductivityProvider';
import { navigation } from '../registry/navigation';
export { navigation } from '../registry/navigation';
export default function Sidebar({ openCommand }: { openCommand: () => void }) {
  const { state } = useProductivity();
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('tempo-sidebar') === 'collapsed',
  );
  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`} aria-label="App sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark">
          <AudioLines />
        </div>
        <span className="sidebar-label brand-name">
          tempo<span>PERSONAL WORKSPACE</span>
        </span>
      </div>
      <button
        className="command-trigger"
        onClick={openCommand}
        title="Search commands (Ctrl+K)"
        aria-label="Search commands"
      >
        <Command />
        <span className="sidebar-label">Quick navigation</span>
        <kbd className="sidebar-label">Ctrl K</kbd>
      </button>
      <div className="sidebar-caption sidebar-label">WORKSPACE</div>
      <nav
        aria-label="Main navigation"
        onKeyDown={(e) => {
          if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return;
          const links = Array.from(e.currentTarget.querySelectorAll<HTMLAnchorElement>('a'));
          const index = links.indexOf(document.activeElement as HTMLAnchorElement);
          const next =
            e.key === 'Home'
              ? 0
              : e.key === 'End'
                ? links.length - 1
                : (index + (e.key === 'ArrowDown' ? 1 : -1) + links.length) % links.length;
          e.preventDefault();
          links[next].focus();
        }}
      >
        {navigation.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            title={collapsed ? label : undefined}
            aria-label={label}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon />
            <span className="sidebar-label">{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="local-status sidebar-label">
          <i />
          All yours. All local.
        </div>
        <div className="sidebar-profile">
          <div className="avatar">
            {state.settings.name.trim().slice(0, 2).toUpperCase() || 'ME'}
          </div>
          <div className="sidebar-label">
            <strong>{state.settings.name || 'Your workspace'}</strong>
            <span>A little better, every day.</span>
          </div>
        </div>
        <button
          className="collapse-button"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onClick={() => {
            localStorage.setItem('tempo-sidebar', collapsed ? 'expanded' : 'collapsed');
            setCollapsed(!collapsed);
          }}
        >
          {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
          <span className="sidebar-label">Collapse sidebar</span>
        </button>
      </div>
    </aside>
  );
}
