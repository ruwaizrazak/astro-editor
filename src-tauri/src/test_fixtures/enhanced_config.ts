import { defineCollection, z } from 'astro:content';

// Test complex schema parsing with constraints, literals, unions, and alternative syntax
const blog = defineCollection({
  schema: z.object({
    // String constraints
    title: z.string().min(1).max(100),
    slug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/),
    excerpt: z.string().max(200).optional(),
    authorEmail: z.string().email(),
    tags: z.array(z.string()).optional(),
    
    // Number constraints  
    wordCount: z.number().min(0).max(10000),
    readingTime: z.number().positive(),
    priority: z.number().min(1).max(5).default(3),
    
    // Boolean with default
    draft: z.boolean().default(false),
    featured: z.boolean().optional(),
    
    // Date fields
    pubDate: z.coerce.date(),
    updatedDate: z.date().optional(),
    
    // Literal types
    category: z.literal('blog'),
    format: z.literal('markdown'),
    
    // Union types
    status: z.union([
      z.literal('draft'), 
      z.literal('published'), 
      z.literal('archived')
    ]),
    visibility: z.union([z.string(), z.null()]).optional(),
    
    // Alternative optional syntax
    seoTitle: z.optional(z.string().min(10).max(60)),
    metaDescription: z.optional(z.string().max(160)),
    canonicalUrl: z.optional(z.string().url()),
    
    // Enum
    platform: z.enum(['web', 'newsletter', 'social']).default('web'),
    
    // Complex string validation
    socialImage: z.string().url().optional(),
    twitterHandle: z.string().startsWith('@').optional(),
    
    // Multi-line field definition (should be normalized)
    complexField: z.string()
      .min(5)
      .max(500)
      .trim(),
  }),
});

/* Block comment with nested 
   // line comment 
   should be properly removed */
const docs = defineCollection({
  schema: z.object({
    title: z.string(), // Line comment should be removed
    version: z.string().regex(/^\d+\.\d+\.\d+$/),
    stable: z.boolean().default(true),
  }),
});

export const collections = { blog, docs };