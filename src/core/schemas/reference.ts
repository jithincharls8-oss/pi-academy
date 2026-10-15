import { z } from 'zod';
import { IdSchema, ProvenanceShape, requireVerifyNote } from './common';

export const FunctionRefSchema = z
  .object({
    id: IdSchema,
    name: z.string().min(1),
    /** pe = Performance Equations, af = AF Asset Analytics expression */
    kind: z.enum(['pe', 'af']),
    category: z.string().min(2),
    signature: z.string().min(3),
    description: z.string().min(10),
    params: z.array(z.object({ name: z.string(), description: z.string() })).default([]),
    returns: z.string().min(2),
    example: z.string().min(3),
    notes: z.string().optional(),
    ...ProvenanceShape,
  })
  .superRefine(requireVerifyNote);
export type FunctionRef = z.infer<typeof FunctionRefSchema>;

export const WebApiEndpointSchema = z
  .object({
    id: IdSchema,
    controller: z.string().min(2),
    method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
    path: z.string().startsWith('/'),
    summary: z.string().min(5),
    params: z
      .array(
        z.object({
          name: z.string(),
          in: z.enum(['path', 'query', 'body']),
          description: z.string(),
          required: z.boolean().default(false),
        }),
      )
      .default([]),
    example: z.string().optional(),
    ...ProvenanceShape,
  })
  .superRefine(requireVerifyNote);
export type WebApiEndpoint = z.infer<typeof WebApiEndpointSchema>;

export const CommandRefSchema = z
  .object({
    id: IdSchema,
    tool: z.enum([
      'piconfig',
      'piartool',
      'pidiag',
      'pisetupinfo',
      'pilistupd',
      'pigetmsg',
      'pibackup',
      'other',
    ]),
    command: z.string().min(2),
    description: z.string().min(10),
    example: z.string().min(2),
    notes: z.string().optional(),
    ...ProvenanceShape,
  })
  .superRefine(requireVerifyNote);
export type CommandRef = z.infer<typeof CommandRefSchema>;

export const ErrorCodeSchema = z
  .object({
    id: IdSchema,
    code: z.string().min(1),
    product: z.string().min(2),
    message: z.string().min(3),
    meaning: z.string().min(10),
    resolution: z.string().min(10),
    ...ProvenanceShape,
  })
  .superRefine(requireVerifyNote);
export type ErrorCode = z.infer<typeof ErrorCodeSchema>;

const DecisionNodeSchema = z.union([
  z.object({
    question: z.string().min(5),
    options: z.array(z.object({ label: z.string(), next: z.string() })).min(2),
  }),
  z.object({ result: z.string().min(5), details: z.string().min(5) }),
]);

export const DecisionTreeSchema = z
  .object({
    id: IdSchema,
    title: z.string().min(5),
    description: z.string().min(10),
    root: z.string(),
    nodes: z.record(z.string(), DecisionNodeSchema),
    ...ProvenanceShape,
  })
  .superRefine((tree, ctx) => {
    requireVerifyNote(tree, ctx);
    if (!tree.nodes[tree.root]) {
      ctx.addIssue({ code: 'custom', path: ['root'], message: 'root node missing' });
    }
    for (const [key, node] of Object.entries(tree.nodes)) {
      if ('options' in node) {
        for (const opt of node.options) {
          if (!tree.nodes[opt.next]) {
            ctx.addIssue({
              code: 'custom',
              path: ['nodes', key],
              message: `option "${opt.label}" points to missing node ${opt.next}`,
            });
          }
        }
      }
    }
  });
export type DecisionTree = z.infer<typeof DecisionTreeSchema>;

export const ReferenceSchema = z.object({
  peFunctions: z.array(FunctionRefSchema),
  afFunctions: z.array(FunctionRefSchema),
  webApi: z.array(WebApiEndpointSchema),
  commands: z.array(CommandRefSchema),
  errorCodes: z.array(ErrorCodeSchema),
  decisionTrees: z.array(DecisionTreeSchema),
});
export type Reference = z.infer<typeof ReferenceSchema>;
