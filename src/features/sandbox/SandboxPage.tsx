import { Link } from 'react-router-dom';
import {
  Activity,
  FileSpreadsheet,
  FolderTree,
  Globe,
  LayoutDashboard,
  ServerCog,
  type LucideIcon,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/misc';
import { Badge } from '@/components/ui/badge';
import { plant, allElements } from '@/core/sim/plant';

interface Tool {
  to: string;
  title: string;
  icon: LucideIcon;
  blurb: string;
  tryThis: string;
}

const TOOLS: Tool[] = [
  {
    to: '/sandbox/vision',
    title: 'PI Vision',
    icon: LayoutDashboard,
    blurb:
      'Build displays from symbols, drag attributes from the asset tree, use the time bar, swap assets and colour values by state.',
    tryThis: 'Open "Feed Pumps Overview", then swap the pump from P-101 to P-103.',
  },
  {
    to: '/sandbox/explorer',
    title: 'PI System Explorer',
    icon: FolderTree,
    blurb:
      'Browse the AF hierarchy, templates and attributes, write and evaluate analyses, find event frames and practise check-in.',
    tryThis: 'Select P-102, open Analyses and press Evaluate.',
  },
  {
    to: '/sandbox/smt',
    title: 'PI System Management Tools',
    icon: ServerCog,
    blurb:
      'Edit points in Point Builder, watch current values, browse archives and message logs, and run piconfig and piartool.',
    tryThis: 'In piconfig, list every pump flow tag with @select tag=RB.P10*.FLOW.',
  },
  {
    to: '/sandbox/webapi',
    title: 'PI Web API browser',
    icon: Globe,
    blurb:
      'Send REST requests, follow Links, decode WebIDs and turn any request into curl, Python or JavaScript.',
    tryThis: 'Find the WebID of RB.P102.FLOW, then get its hourly averages.',
  },
  {
    to: '/sandbox/compression',
    title: 'Compression lab',
    icon: Activity,
    blurb:
      'See exception and swinging-door compression decide which values are sent and stored, one event at a time.',
    tryThis: 'Load the "CompDev = 0" preset and count what is still dropped.',
  },
  {
    to: '/sandbox/datalink',
    title: 'DataLink-style sheet',
    icon: FileSpreadsheet,
    blurb:
      'A spreadsheet with DataLink-style functions for current, compressed, sampled and calculated data.',
    tryThis: 'Put =PICurrVal("RB.T101.LEVEL",0,"\\\\PISRV01") in a cell.',
  },
];

/** Hub for the PI tool mockups. Tools appear once their routes exist. */
export function SandboxPage({ enabled }: { enabled: (path: string) => boolean }) {
  const m = plant();
  const elements = allElements().length;
  return (
    <div>
      <PageHeader
        title="PI Sandbox"
        description="Hands-on look-alikes of the PI System tools. Everything runs on Riverbend Plant, a fictional site with live, simulated data, so you can click anything without breaking a real system."
      />
      <div className="mb-6 flex flex-wrap gap-2 text-sm">
        <Badge>{m.points.length} PI points</Badge>
        <Badge>{elements} AF elements</Badge>
        <Badge>{m.templates.length} element templates</Badge>
        <Badge tone="warning">Simulations, not the real AVEVA software</Badge>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {TOOLS.filter((t) => enabled(t.to)).map((t) => (
          <li key={t.to}>
            <Link
              to={t.to}
              className="flex h-full flex-col gap-2 rounded-lg border border-border bg-surface p-5 hover:border-primary focus-visible:outline-2 focus-visible:outline-ring"
            >
              <span className="flex items-center gap-2 font-semibold">
                <t.icon className="size-5 text-primary" aria-hidden /> {t.title}
              </span>
              <span className="text-sm text-fg-muted">{t.blurb}</span>
              <span className="mt-auto text-xs">
                <span className="font-medium">Try this:</span> {t.tryThis}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
