import { NavLink } from "react-router-dom";

import { AppIcon } from "../icons/AppIcon";
import "./section-tabs.css";

export type SectionTab = {
  to: string;
  label: string;
  icon: string;
};

type Props = {
  label: string;
  tabs: SectionTab[];
};

export default function SectionTabs({ label, tabs }: Props) {
  return (
    <nav className="section-tabs" aria-label={label}>
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) =>
            `section-tabs__link${isActive ? " is-active" : ""}`
          }
        >
          <AppIcon name={tab.icon} size={16} />
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
