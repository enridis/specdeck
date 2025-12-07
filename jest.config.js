module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  coverageDirectory: 'coverage',
  verbose: true,
  transformIgnorePatterns: [
    'node_modules/(?!(unified|remark-parse|remark-gfm|remark-frontmatter|mdast-util-.*|micromark.*|decode-named-character-reference|character-entities|unist-.*|vfile|bail|is-plain-obj|trough)/)',
  ],
};
