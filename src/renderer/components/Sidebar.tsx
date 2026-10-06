import { NavLink, useLocation } from 'react-router-dom';
import { Command, PanelLeft, AudioLines } from 'lucide-react';
import { useProductivity } from '../hooks/ProductivityProvider';
import { navigation } from '../registry/navigation';
import {
  Sidebar as SidebarFrame,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from './ui/sidebar';
export { navigation } from '../registry/navigation';
export default function Sidebar({ openCommand }: { openCommand: () => void }) {
  const { state } = useProductivity();
  const { pathname } = useLocation();
  const { toggleSidebar, isMobile, setOpenMobile } = useSidebar();
  return (
    <SidebarFrame collapsible="icon" className="tempo-sidebar" aria-label="App sidebar">
      <SidebarHeader>
        <div className="tempo-brand">
          <AudioLines />
          <span>Tempo</span>
        </div>
        <SidebarMenuButton tooltip="Search commands · Ctrl+K" onClick={openCommand}>
          <Command />
          <span>Search</span>
          <kbd>Ctrl K</kbd>
        </SidebarMenuButton>
      </SidebarHeader>
      <SidebarContent>
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
            links[next]?.focus();
          }}
        >
          <SidebarMenu>
            {navigation.map(({ to, label, icon: Icon }) => (
              <SidebarMenuItem key={to}>
                <NavLink
                  to={to}
                  end={to === '/'}
                  aria-label={label}
                  aria-current={
                    to === '/habits' && ['/weekly', '/history'].includes(pathname)
                      ? 'page'
                      : undefined
                  }
                  onClick={() => {
                    if (isMobile) setOpenMobile(false);
                  }}
                >
                  {({ isActive }) => (
                    <SidebarMenuButton
                      asChild
                      isActive={
                        isActive || (to === '/habits' && ['/weekly', '/history'].includes(pathname))
                      }
                      tooltip={label}
                    >
                      <span>
                        <Icon />
                        <span>{label}</span>
                      </span>
                    </SidebarMenuButton>
                  )}
                </NavLink>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </nav>
      </SidebarContent>
      <SidebarFooter>
        <div className="tempo-profile">
          <div className="avatar">
            {state.settings.avatar ? (
              <img src={state.settings.avatar} alt="Your profile" />
            ) : (
              state.settings.name.trim().slice(0, 2).toUpperCase() || 'ME'
            )}
          </div>
          <span>
            {state.settings.name || 'Your workspace'}
            <small>Stored on this device</small>
          </span>
        </div>
        <SidebarMenuButton tooltip="Toggle sidebar · Ctrl+B" onClick={toggleSidebar}>
          <PanelLeft />
          <span>Collapse sidebar</span>
        </SidebarMenuButton>
      </SidebarFooter>
    </SidebarFrame>
  );
}
