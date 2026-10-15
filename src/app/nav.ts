import {
  BookOpen,
  Building2,
  CalendarCheck,
  ClipboardList,
  Cog,
  Factory,
  FlaskConical,
  LayoutDashboard,
  Library,
  Network,
  Search,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  group: 'learn' | 'practise' | 'tools' | 'manage';
}

/** Navigation entries. Items are added here as each feature ships. */
export const NAV: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, group: 'learn' },
  { to: '/learn', label: 'Learn', icon: BookOpen, group: 'learn' },
  { to: '/exam/daily', label: 'Daily Exam', icon: CalendarCheck, group: 'practise' },
  { to: '/practice', label: 'Practice & Mock', icon: ClipboardList, group: 'practise' },
  { to: '/sandbox', label: 'PI Sandbox', icon: FlaskConical, group: 'tools' },
  { to: '/reference', label: 'Reference', icon: Library, group: 'tools' },
  { to: '/planner', label: 'Deployment Planner', icon: Network, group: 'tools' },
  { to: '/industries', label: 'Industries', icon: Factory, group: 'tools' },
  { to: '/cases', label: 'Case Studies', icon: Building2, group: 'tools' },
  { to: '/search', label: 'Search', icon: Search, group: 'manage' },
  { to: '/admin', label: 'Admin', icon: ShieldCheck, group: 'manage' },
  { to: '/settings', label: 'Settings', icon: Cog, group: 'manage' },
];

export const NAV_GROUPS: Record<NavItem['group'], string> = {
  learn: 'Learn',
  practise: 'Practise',
  tools: 'Tools',
  manage: 'Manage',
};
