import {
  StorySchema,
  StoryStatusSchema,
  StoryComplexitySchema,
  StoryIdSchema,
} from '../../src/schemas/story.schema';

describe('Story Schema', () => {
  describe('StoryIdSchema', () => {
    it('should validate correct story IDs', () => {
      expect(() => StoryIdSchema.parse('CLI-CORE-001')).not.toThrow();
      expect(() => StoryIdSchema.parse('AUTH-API-123')).not.toThrow();
      expect(() => StoryIdSchema.parse('A-B-1')).not.toThrow();
    });

    it('should reject invalid story IDs', () => {
      expect(() => StoryIdSchema.parse('cli-core-001')).toThrow();
      expect(() => StoryIdSchema.parse('CLI_CORE_001')).toThrow();
      expect(() => StoryIdSchema.parse('CLI-CORE')).toThrow();
      expect(() => StoryIdSchema.parse('CORE-001')).toThrow();
    });
  });

  describe('StoryStatusSchema', () => {
    it('should validate correct statuses', () => {
      expect(() => StoryStatusSchema.parse('planned')).not.toThrow();
      expect(() => StoryStatusSchema.parse('in_progress')).not.toThrow();
      expect(() => StoryStatusSchema.parse('in_review')).not.toThrow();
      expect(() => StoryStatusSchema.parse('blocked')).not.toThrow();
      expect(() => StoryStatusSchema.parse('done')).not.toThrow();
    });

    it('should reject invalid statuses', () => {
      expect(() => StoryStatusSchema.parse('pending')).toThrow();
      expect(() => StoryStatusSchema.parse('completed')).toThrow();
    });
  });

  describe('StoryComplexitySchema', () => {
    it('should validate correct complexity values', () => {
      expect(() => StoryComplexitySchema.parse('XS')).not.toThrow();
      expect(() => StoryComplexitySchema.parse('S')).not.toThrow();
      expect(() => StoryComplexitySchema.parse('M')).not.toThrow();
      expect(() => StoryComplexitySchema.parse('L')).not.toThrow();
      expect(() => StoryComplexitySchema.parse('XL')).not.toThrow();
    });

    it('should reject invalid complexity values', () => {
      expect(() => StoryComplexitySchema.parse('XXL')).toThrow();
      expect(() => StoryComplexitySchema.parse('small')).toThrow();
    });
  });

  describe('StorySchema', () => {
    const validStory = {
      id: 'CLI-CORE-001',
      title: 'Implement CLI framework',
      status: 'planned' as const,
      complexity: 'M' as const,
    };

    it('should validate a complete valid story', () => {
      const result = StorySchema.parse(validStory);
      expect(result.id).toBe('CLI-CORE-001');
      expect(result.title).toBe('Implement CLI framework');
      expect(result.status).toBe('planned');
      expect(result.complexity).toBe('M');
    });

    it('should validate story with optional fields', () => {
      const storyWithOptionals = {
        ...validStory,
        estimate: 3,
        owner: 'john.doe',
        jira: 'PROJ-123',
        openspec: 'add-cli-framework',
        tags: ['backend', 'infrastructure'],
        notes: 'Some implementation notes',
        milestone: 'v1.0',
      };

      const result = StorySchema.parse(storyWithOptionals);
      expect(result.estimate).toBe(3);
      expect(result.owner).toBe('john.doe');
      expect(result.tags).toEqual(['backend', 'infrastructure']);
    });

    it('should reject story without required fields', () => {
      expect(() => StorySchema.parse({ id: 'CLI-CORE-001' })).toThrow();
      expect(() => StorySchema.parse({ title: 'Test' })).toThrow();
    });

    it('should reject story with empty title', () => {
      expect(() => StorySchema.parse({ ...validStory, title: '' })).toThrow();
    });

    it('should default tags to empty array', () => {
      const result = StorySchema.parse(validStory);
      expect(result.tags).toEqual([]);
    });
  });
});
