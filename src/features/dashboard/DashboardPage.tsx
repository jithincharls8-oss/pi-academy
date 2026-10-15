import { useApp } from '@/app/AppContext';
import { PageHeader, Progress, Stat } from '@/components/ui/misc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { summariseCoverage } from '@/core/coverage/parse';

export function DashboardPage() {
  const { library } = useApp();
  const cov = summariseCoverage(library.coverage);
  return (
    <div className="space-y-6">
      <PageHeader
        title="Welcome to PI Academy"
        description="Learn, practise and simulate the AVEVA PI System, fully offline."
      />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Lessons" value={library.lesson.length} />
        <Stat label="Questions" value={library.question.length} />
        <Stat label="Glossary terms" value={library.glossary.length} />
        <Stat label="Case studies" value={library.caseStudy.length} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Content coverage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Progress value={cov.withContentPct} label="Coverage items with content" />
          <p className="text-fg-muted">
            {cov.withContentPct}% of {cov.total} syllabus items have lessons, questions and glossary
            terms.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
