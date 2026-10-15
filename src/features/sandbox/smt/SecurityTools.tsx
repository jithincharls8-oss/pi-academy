import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { IDENTITIES, LICENSE, MAPPINGS, PI_GROUPS, PI_USERS, TRUSTS } from './server';
import { Grid, Note, Td, Th, ToolHeader } from './ui';
import { cn } from '@/lib/cn';

function LeastPrivilege() {
  return (
    <Note>
      <p className="font-medium">Least privilege</p>
      <p>
        Give every person and service only the access its job needs. Map AD groups to role
        identities instead of individual users, keep interface and buffer service accounts on their
        own identities, never map anything to piadmin, and disable PIWorld once mappings cover
        everyone who needs access.
      </p>
      <p>
        Authentication preference, strongest first: OpenID Connect (PI Server 2023 and later),
        Windows Integrated Security (Kerberos, then NTLM), PI Trusts, explicit logins.
      </p>
    </Note>
  );
}

export function IdentitiesView() {
  return (
    <div className="space-y-3">
      <ToolHeader title="Identities, Users, & Groups">
        Read-only in the sandbox. PI Identities are the roles that permissions are granted to. They
        have no password and cannot be used to log in.
      </ToolHeader>
      <Tabs defaultValue="identities">
        <TabsList aria-label="Security principal types">
          <TabsTrigger value="identities" className="text-xs">
            PI Identities
          </TabsTrigger>
          <TabsTrigger value="users" className="text-xs">
            PI Users
          </TabsTrigger>
          <TabsTrigger value="groups" className="text-xs">
            PI Groups
          </TabsTrigger>
        </TabsList>
        <TabsContent value="identities" className="mt-3">
          <Grid caption="PI Identities">
            <thead>
              <tr>
                <Th>Identity</Th>
                <Th>Description</Th>
                <Th>Enabled</Th>
                <Th>Built in</Th>
                <Th>Mappings</Th>
              </tr>
            </thead>
            <tbody>
              {IDENTITIES.map((i) => (
                <tr key={i.name}>
                  <Td mono>{i.name}</Td>
                  <Td>{i.description}</Td>
                  <Td className={i.enabled ? 'text-tool-ok' : 'text-fg-muted'}>
                    {i.enabled ? 'Yes' : 'Disabled'}
                  </Td>
                  <Td>{i.builtIn ? 'Yes' : 'No'}</Td>
                  <Td>{MAPPINGS.filter((m) => m.identity === i.name).length}</Td>
                </tr>
              ))}
            </tbody>
          </Grid>
        </TabsContent>
        <TabsContent value="users" className="mt-3 space-y-2">
          <Grid caption="PI Users">
            <thead>
              <tr>
                <Th>User</Th>
                <Th>Description</Th>
                <Th>Password set</Th>
                <Th>Disabled</Th>
              </tr>
            </thead>
            <tbody>
              {PI_USERS.map((u) => (
                <tr key={u.name}>
                  <Td mono>{u.name}</Td>
                  <Td>{u.description}</Td>
                  <Td>{u.passwordSet ? 'Yes' : 'No'}</Td>
                  <Td>{u.disabled ? 'Yes' : 'No'}</Td>
                </tr>
              ))}
            </tbody>
          </Grid>
          <Note>
            PI Users and PI Groups are legacy and kept for backward compatibility. Explicit logins
            are disabled on PISRV01, which is the default and the recommendation.
          </Note>
        </TabsContent>
        <TabsContent value="groups" className="mt-3">
          <Grid caption="PI Groups">
            <thead>
              <tr>
                <Th>Group</Th>
                <Th>Description</Th>
              </tr>
            </thead>
            <tbody>
              {PI_GROUPS.map((g) => (
                <tr key={g.name}>
                  <Td mono>{g.name}</Td>
                  <Td>{g.description}</Td>
                </tr>
              ))}
            </tbody>
          </Grid>
        </TabsContent>
      </Tabs>
      <LeastPrivilege />
    </div>
  );
}

export function MappingsView() {
  return (
    <div className="space-y-3">
      <ToolHeader title="Mappings & Trusts">
        Read-only in the sandbox. Mappings link Windows accounts and AD groups to PI Identities;
        they are cumulative, so a user in two mapped groups gets both identities. A trust grants one
        best-fit identity by application name and network address.
      </ToolHeader>
      <Tabs defaultValue="mappings">
        <TabsList aria-label="Mappings and trusts">
          <TabsTrigger value="mappings" className="text-xs">
            Mappings
          </TabsTrigger>
          <TabsTrigger value="trusts" className="text-xs">
            Trusts
          </TabsTrigger>
        </TabsList>
        <TabsContent value="mappings" className="mt-3">
          <Grid caption="PI Mappings">
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Windows account</Th>
                <Th>Type</Th>
                <Th>PI Identity</Th>
              </tr>
            </thead>
            <tbody>
              {MAPPINGS.map((m) => (
                <tr key={m.name}>
                  <Td>{m.name}</Td>
                  <Td mono>{m.principal}</Td>
                  <Td>{m.type}</Td>
                  <Td mono>{m.identity}</Td>
                </tr>
              ))}
            </tbody>
          </Grid>
          <p className="mt-1 text-[11px] text-fg-muted">
            Service accounts are group managed service accounts (gMSA), the preferred type.
          </p>
        </TabsContent>
        <TabsContent value="trusts" className="mt-3">
          <Grid caption="PI Trusts">
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Application</Th>
                <Th>IP address</Th>
                <Th>Net mask</Th>
                <Th>Host</Th>
                <Th>PI Identity</Th>
                <Th>Review</Th>
              </tr>
            </thead>
            <tbody>
              {TRUSTS.map((t) => (
                <tr key={t.name}>
                  <Td>{t.name}</Td>
                  <Td mono>{t.application || '-'}</Td>
                  <Td mono>{t.ip || '-'}</Td>
                  <Td mono>{t.netmask || '-'}</Td>
                  <Td mono>{t.host || '-'}</Td>
                  <Td mono>{t.identity}</Td>
                  <Td className={cn(t.ok ? 'text-tool-ok' : 'text-tool-alarm-hi')}>{t.finding}</Td>
                </tr>
              ))}
            </tbody>
          </Grid>
          <p className="mt-1 text-[11px] text-fg-muted">
            Older PI API connections identify themselves by the first four letters of the interface
            name plus E, such as OPCpE.
          </p>
        </TabsContent>
      </Tabs>
      <LeastPrivilege />
      <Note tone="warn">
        Before upgrading interfaces to PI API for WIS, create mappings for their service accounts:
        trust authentication is disabled by default after the upgrade.
      </Note>
    </div>
  );
}

export function LicensingView({ pointCount }: { pointCount: number }) {
  return (
    <div className="space-y-3">
      <ToolHeader title="Licensing">
        The PI License Manager (pilicmgr) maintains licence information for the Data Archive and
        connected applications. Sandbox values.
      </ToolHeader>
      <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs text-fg-muted">Licensed point count</dt>
          <dd className="font-mono">{LICENSE.pointLimit.toLocaleString('en-US')}</dd>
        </div>
        <div>
          <dt className="text-xs text-fg-muted">Points in use (whole server)</dt>
          <dd className="font-mono">
            {LICENSE.pointsInUse.toLocaleString('en-US')}{' '}
            <span className="text-xs text-fg-muted">
              ({pointCount} Riverbend points are modelled in this sandbox)
            </span>
          </dd>
        </div>
        <div>
          <dt className="text-xs text-fg-muted">Licence file location</dt>
          <dd className="font-mono text-xs">{LICENSE.file}</dd>
        </div>
      </dl>
      <Grid caption="Licensed applications">
        <thead>
          <tr>
            <Th>Application</Th>
            <Th>Note</Th>
          </tr>
        </thead>
        <tbody>
          {LICENSE.applications.map((a) => (
            <tr key={a.name}>
              <Td>{a.name}</Td>
              <Td>{a.note}</Td>
            </tr>
          ))}
        </tbody>
      </Grid>
      <section className="rounded border border-tool-grid bg-surface p-3 text-xs">
        <h3 className="mb-1 font-semibold">How a Data Archive licence is obtained</h3>
        <ol className="list-decimal space-y-0.5 pl-5">
          <li>
            Run the install kit&apos;s machine signature generator on the target server (not on
            another machine).
          </li>
          <li>Upload the Machine Signature File to the customer portal.</li>
          <li>Download the licence file.</li>
          <li>Install; setup copies the licence file to %PISERVER%\dat.</li>
        </ol>
        <p className="mt-2">
          From the command line, <code className="font-mono">piartool -lic usage</code> (run in
          %PISERVER%\adm) checks licence use and that pilicmgr is answering. Try it in the Command
          prompt tab.
        </p>
      </section>
    </div>
  );
}
