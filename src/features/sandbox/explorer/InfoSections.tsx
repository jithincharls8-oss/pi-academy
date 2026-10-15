import { Badge } from '@/components/ui/badge';
import { CONTACTS, NOTIFICATION_RULES, UOM_CLASSES } from './catalog';
import { Note, Panel, Prop, Td, Th } from './ui';

export function UomView() {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">Unit of Measure</h2>
      <Note>
        Read-only view of the UOM classes the Riverbend database uses. AF converts a value only
        between units of the same class (bar to kPa, not kW to kWh), and treats UOM names and
        abbreviations case-insensitively. The display UOM group (for example Metric or US Customary)
        is chosen under Tools &gt; Options.
      </Note>
      <div className="overflow-x-auto rounded border border-border bg-surface">
        <table className="w-full text-sm" aria-label="UOM classes">
          <thead>
            <tr>
              <Th>UOM class</Th>
              <Th>Unit</Th>
              <Th>Abbreviation</Th>
              <Th>Used by</Th>
            </tr>
          </thead>
          <tbody>
            {UOM_CLASSES.flatMap((c) =>
              c.units.map((u, i) => (
                <tr key={`${c.name}-${u.abbreviation}`} className="border-b border-tool-grid">
                  <Td className="font-medium">{i === 0 ? c.name : ''}</Td>
                  <Td>{u.name}</Td>
                  <Td className="font-mono">{u.abbreviation}</Td>
                  <Td className="text-fg-muted">{u.usedBy}</Td>
                </tr>
              )),
            )}
          </tbody>
        </table>
      </div>
      <Note>
        Always give attributes a default UOM; without one AF cannot convert the value for clients.
      </Note>
    </div>
  );
}

export function ContactsView() {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">Contacts</h2>
      <Note>
        Read-only. Contacts own delivery endpoints; a notification rule subscription links a rule to
        one endpoint. Current notification rules deliver by Email or Web Service.
      </Note>
      {CONTACTS.map((c) => (
        <Panel key={c.name} title={c.name}>
          <dl>
            <Prop label="Description">{c.description}</Prop>
            <Prop label="Delivery endpoints">
              <ul className="flex flex-col gap-1">
                {c.endpoints.map((e) => (
                  <li key={e.address} className="flex flex-wrap items-center gap-2">
                    <Badge tone="info">{e.channel}</Badge>
                    <code className="font-mono text-xs break-all">{e.address}</code>
                  </li>
                ))}
              </ul>
            </Prop>
          </dl>
        </Panel>
      ))}
    </div>
  );
}

export function NotificationRulesView() {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">Notification Rules</h2>
      <Note>
        Read-only. Notification rules fire when event frames that match their criteria start or end,
        then send a message to each subscribed endpoint using a delivery format such as &quot;Global
        Default Email&quot;. In PSE you would use View/Edit Subscriptions, Manage Formats and Test
        Send, then Check In.
      </Note>
      {NOTIFICATION_RULES.map((r) => (
        <Panel
          key={r.name}
          title={r.name}
          actions={<Badge tone={r.status === 'Enabled' ? 'success' : 'neutral'}>{r.status}</Badge>}
        >
          <dl>
            <Prop label="Applies to">{r.target}</Prop>
            <Prop label="Trigger">{r.criteria}</Prop>
            <Prop label="Notify on">{r.notifyOn}</Prop>
          </dl>
          <table className="mt-2 w-full text-sm" aria-label={`Subscriptions of ${r.name}`}>
            <thead>
              <tr>
                <Th>Contact</Th>
                <Th>Delivery channel</Th>
                <Th>Format</Th>
              </tr>
            </thead>
            <tbody>
              {r.subscriptions.map((s) => (
                <tr key={s.contact} className="border-b border-tool-grid">
                  <Td>{s.contact}</Td>
                  <Td>{s.channel}</Td>
                  <Td>{s.format}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      ))}
    </div>
  );
}
