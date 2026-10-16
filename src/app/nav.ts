import {
  BookOpen,
  Building2,
  CalendarCheck,
  ClipboardList,
  Cog,
  Factory,
  FlaskConical,
  House,
  Library,
  Network,
  Palette,
  Search,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  group: 'learn' | 'practise' | 'tools' | 'manage';
  /** Token background class for the sidebar's icon tile (iOS Settings style). */
  tile: string;
}

/** Navigation entries. Items are added here as each feature ships. */
export const NAV: NavItem[] = [
  { to: '/', label: 'Home', icon: House, group: 'learn', tile: 'bg-primary-solid' },
  { to: '/learn', label: 'Learn', icon: BookOpen, group: 'learn', tile: 'bg-path-done' },
  {
    to: '/exam/daily',
    label: 'Daily Exam',
    icon: CalendarCheck,
    group: 'practise',
    tile: 'bg-flame',
  },
  {
    to: '/practice',
    label: 'Practice & Mock',
    icon: ClipboardList,
    group: 'practise',
    tile: 'bg-challenge',
  },
  { to: '/sandbox', label: 'PI Sandbox', icon: FlaskConical, group: 'tools', tile: 'bg-chart-6' },
  { to: '/reference', label: 'Reference', icon: Library, group: 'tools', tile: 'bg-chart-1' },
  {
    to: '/planner',
    label: 'Deployment Planner',
    icon: Network,
    group: 'tools',
    tile: 'bg-chart-4',
  },
  { to: '/industries', label: 'Industries', icon: Factory, group: 'tools', tile: 'bg-chart-2' },
  { to: '/cases', label: 'Case Studies', icon: Building2, group: 'tools', tile: 'bg-chart-3' },
  { to: '/search', label: 'Search', icon: Search, group: 'manage', tile: 'bg-fg-subtle' },
  { to: '/admin', label: 'Admin', icon: ShieldCheck, group: 'manage', tile: 'bg-fg-subtle' },
  { to: '/styleguide', label: 'Style guide', icon: Palette, group: 'manage', tile: 'bg-chart-4' },
  { to: '/settings', label: 'Settings', icon: Cog, group: 'manage', tile: 'bg-fg-subtle' },
];

export const NAV_GROUPS: Record<NavItem['group'], string> = {
  learn: 'Learn',
  practise: 'Practise',
  tools: 'Tools',
  manage: 'Manage',
};
