import { Building2, ChevronDown, HelpCircle, Menu, X } from "lucide-react";
import type { Site } from "../types";

type AppHeaderProps = {
  activeSite?: Site;
  activeSiteId: string;
  navOpen: boolean;
  siteMenuOpen: boolean;
  sites: Site[];
  onHome: () => void;
  onProfile: () => void;
  onSiteChange: (site: Site) => void;
  onSiteMenuToggle: () => void;
  onNavToggle: () => void;
};

export function AppHeader({
  activeSite,
  activeSiteId,
  navOpen,
  siteMenuOpen,
  sites,
  onHome,
  onProfile,
  onSiteChange,
  onSiteMenuToggle,
  onNavToggle,
}: AppHeaderProps) {
  return (
    <header className="site-header">
      <button className="mobile-menu-button" type="button" aria-label="Toggle navigation" onClick={onNavToggle}>
        {navOpen ? <X size={21} /> : <Menu size={21} />}
      </button>
      <button className="wordmark" type="button" onClick={onHome}>
        <span className="brand-mark">AU</span>
        <span><strong>Auburn Engineering</strong><small>Room reservations</small></span>
      </button>
      <div className="header-actions">
        <button className="building-switch" type="button" onClick={onSiteMenuToggle}>
          <Building2 size={18} />
          <span>{activeSite?.name ?? "Choose site"}</span>
          <ChevronDown size={16} />
        </button>
        <button className="help-button" type="button"><HelpCircle size={18} /> Help</button>
        <button className="avatar-button" type="button" aria-label="Open profile" onClick={onProfile}>FA</button>
      </div>
      {siteMenuOpen ? (
        <div className="site-menu header-site-menu">
          {sites.map((site) => (
            <button
              className={site.id === activeSiteId ? "active" : ""}
              key={site.id}
              type="button"
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
