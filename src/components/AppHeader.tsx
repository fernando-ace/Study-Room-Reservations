import { Building2, ChevronDown, HelpCircle } from "lucide-react";
import type { Site, View } from "../types";

type AppHeaderProps = {
  activeSite?: Site;
  activeSiteId: string;
  activeView: View;
  profileInitials: string;
  siteMenuOpen: boolean;
  sites: Site[];
  onHelp: () => void;
  onHome: () => void;
  onNavigate: (view: View) => void;
  onProfile: () => void;
  onSiteChange: (site: Site) => void;
  onSiteMenuToggle: () => void;
};

const navigation: Array<{ label: string; view: View }> = [
  { label: "Find a room", view: "map" },
  { label: "My reservations", view: "bookings" },
  { label: "Special requests", view: "requests" },
];

export function AppHeader({
  activeSite,
  activeSiteId,
  activeView,
  profileInitials,
  siteMenuOpen,
  sites,
  onHelp,
  onHome,
  onNavigate,
  onProfile,
  onSiteChange,
  onSiteMenuToggle,
}: AppHeaderProps) {
  return (
    <header className="site-header">
      <button className="wordmark" type="button" onClick={onHome} aria-label="Auburn Engineering room reservations home">
        <span className="brand-mark" aria-hidden="true">AU</span>
        <span><strong>Auburn Engineering</strong><small>Room reservations</small></span>
      </button>

      <nav className="header-nav" aria-label="Primary navigation">
        {navigation.map((item) => {
          const active = activeView === item.view || (item.view === "map" && activeView === "reserve");
          return (
            <button
              className={active ? "active" : ""}
              key={item.view}
              type="button"
              aria-current={active ? "page" : undefined}
              onClick={() => onNavigate(item.view)}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="header-actions">
        <button
          className="building-switch"
          type="button"
          aria-expanded={siteMenuOpen}
          aria-haspopup="menu"
          onClick={onSiteMenuToggle}
        >
          <Building2 size={18} />
          <span>{activeSite?.shortName ?? "Choose site"}</span>
          <ChevronDown size={16} />
        </button>
        <button className="help-button" type="button" onClick={onHelp}><HelpCircle size={18} /> Help</button>
        <button className="avatar-button" type="button" aria-label="Open profile" onClick={onProfile}>{profileInitials}</button>
      </div>

      {siteMenuOpen ? (
        <div className="site-menu header-site-menu" role="menu" aria-label="Choose a reservation site">
          {sites.map((site) => (
            <button
              className={site.id === activeSiteId ? "active" : ""}
              key={site.id}
              type="button"
              role="menuitem"
              onClick={() => onSiteChange(site)}
            >
              <strong>{site.name}</strong>
              <small>{site.category}</small>
            </button>
          ))}
        </div>
      ) : null}
    </header>
  );
}
