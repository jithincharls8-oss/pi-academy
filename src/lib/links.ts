import type { SearchKind } from '@/content/search';

/** Canonical in-app route for any content item. */
export function hrefFor(kind: SearchKind, id: string): string {
  const e = encodeURIComponent(id);
  switch (kind) {
    case 'lesson':
      return `/learn/${e}`;
    case 'glossary':
      return `/reference/glossary/${e}`;
    case 'question':
      return `/practice/question/${e}`;
    case 'caseStudy':
      return `/cases/${e}`;
    case 'industry':
      return `/industries/${e}`;
    case 'peFunction':
      return `/reference/functions/pe/${e}`;
    case 'afFunction':
      return `/reference/functions/af/${e}`;
    case 'webApi':
      return `/reference/web-api/${e}`;
    case 'command':
      return `/reference/commands/${e}`;
    case 'errorCode':
      return `/reference/errors/${e}`;
  }
}

export const KIND_LABELS: Record<SearchKind, string> = {
  lesson: 'Lesson',
  glossary: 'Glossary',
  question: 'Question',
  caseStudy: 'Case study',
  industry: 'Industry',
  peFunction: 'PE function',
  afFunction: 'AF function',
  webApi: 'Web API',
  command: 'Command',
  errorCode: 'Error code',
};
