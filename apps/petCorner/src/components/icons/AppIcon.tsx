import type { LucideIcon } from "lucide-react";
import ArrowLeft from "lucide-react/dist/esm/icons/arrow-left.js";
import Bell from "lucide-react/dist/esm/icons/bell.js";
import BriefcaseMedical from "lucide-react/dist/esm/icons/briefcase-medical.js";
import CalendarDays from "lucide-react/dist/esm/icons/calendar-days.js";
import Chrome from "lucide-react/dist/esm/icons/chrome.js";
import CircleCheck from "lucide-react/dist/esm/icons/circle-check.js";
import Heart from "lucide-react/dist/esm/icons/heart.js";
import Home from "lucide-react/dist/esm/icons/home.js";
import LoaderCircle from "lucide-react/dist/esm/icons/loader-circle.js";
import LogOut from "lucide-react/dist/esm/icons/log-out.js";
import Menu from "lucide-react/dist/esm/icons/menu.js";
import MessageCircle from "lucide-react/dist/esm/icons/message-circle.js";
import MessagesSquare from "lucide-react/dist/esm/icons/messages-square.js";
import Monitor from "lucide-react/dist/esm/icons/monitor.js";
import PawPrint from "lucide-react/dist/esm/icons/paw-print.js";
import Pencil from "lucide-react/dist/esm/icons/pencil.js";
import Plus from "lucide-react/dist/esm/icons/plus.js";
import RefreshCw from "lucide-react/dist/esm/icons/refresh-cw.js";
import Repeat2 from "lucide-react/dist/esm/icons/repeat-2.js";
import Scissors from "lucide-react/dist/esm/icons/scissors.js";
import ShoppingBag from "lucide-react/dist/esm/icons/shopping-bag.js";
import Trash2 from "lucide-react/dist/esm/icons/trash-2.js";
import TriangleAlert from "lucide-react/dist/esm/icons/triangle-alert.js";
import Upload from "lucide-react/dist/esm/icons/upload.js";
import Users from "lucide-react/dist/esm/icons/users.js";
import X from "lucide-react/dist/esm/icons/x.js";

import "./app-icon.css";

const iconMap: Record<string, LucideIcon> = {
  "arrow-left": ArrowLeft,
  "arrow-up-from-bracket": Upload,
  "arrows-rotate": Repeat2,
  bars: Menu,
  bell: Bell,
  calendar: CalendarDays,
  "circle-check": CircleCheck,
  comments: MessagesSquare,
  "file-arrow-up": Upload,
  google: Chrome,
  heart: Heart,
  home: Home,
  medkit: BriefcaseMedical,
  paw: PawPrint,
  pencil: Pencil,
  plus: Plus,
  "rotate-right": RefreshCw,
  scissors: Scissors,
  "shopping-bag": ShoppingBag,
  "sign-out": LogOut,
  spinner: LoaderCircle,
  times: X,
  trash: Trash2,
  "trash-can": Trash2,
  "triangle-exclamation": TriangleAlert,
  users: Users,
  windows: Monitor,
};

type AppIconProps = {
  name: string;
  className?: string;
  size?: number;
  spin?: boolean;
};

export function AppIcon({ name, className = "", size = 18, spin = false }: AppIconProps) {
  const Icon = iconMap[name] ?? MessageCircle;
  const iconClassName = ["app-icon", spin ? "app-icon--spin" : "", className]
    .filter(Boolean)
    .join(" ");

  return <Icon aria-hidden="true" focusable="false" className={iconClassName} size={size} />;
}
