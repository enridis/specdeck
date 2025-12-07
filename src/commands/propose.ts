import { Command } from 'commander';
import chalk from 'chalk';
import { ConfigRepository } from '../repositories';
import { FeatureService } from '../services';

interface ProposeOptions {
  output?: string;
}

interface FeatureWithStories {
  id: string;
  title: string;
  releaseId: string;
  description?: string;
  stories: Array<{
    id: string;
    title: string;
    complexity: string;
  }>;
}

export function createProposeCommand(): Command {
  const propose = new Command('propose')
    .description('Propose feature decomposition into stories')
    .argument('<featureId>', 'Feature ID to decompose')
    .option('-o, --output <file>', 'Output file for proposal')
    .action(async (featureId: string, options: ProposeOptions) => {
      try {
        const config = await new ConfigRepository(process.cwd()).read();
        const openspecDir = config.openspecDir || './openspec';
        const featureService = new FeatureService(openspecDir, config.specdeckDir);

        const feature = await featureService.getFeatureWithStories(featureId);

        if (!feature) {
          console.error(chalk.red(`Error: Feature not found: ${featureId}`));
          process.exit(1);
        }

        console.log(chalk.bold.cyan(`\nFeature: ${feature.id} - ${feature.title}`));
        console.log(chalk.gray(`Release: ${feature.releaseId}`));

        if (feature.stories.length > 0) {
          console.log(chalk.yellow(`\nExisting Stories (${feature.stories.length}):`));
          for (const story of feature.stories) {
            console.log(`  • ${story.id}: ${story.title} [${story.complexity}]`);
          }
        }

        console.log(chalk.bold('\n📝 Decomposition Guidance:'));
        console.log(
          chalk.gray('1. Break down the feature into independent, testable user stories')
        );
        console.log(chalk.gray('2. Each story should deliver incremental value'));
        console.log(chalk.gray('3. Use story ID pattern: ' + chalk.cyan(`${featureId}-###`)));
        console.log(
          chalk.gray('4. Assign complexity: XS (1), S (2), M (3), L (5), XL (8) story points')
        );
        console.log(chalk.gray('5. Add stories to project-plan.md table'));

        console.log(chalk.bold('\n💡 Story Template:'));
        console.log(
          chalk.cyan(
            `| ${featureId}-001 | [Story Title] | planned | [XS/S/M/L/XL] | [points] | | | | |`
          )
        );

        if (options.output) {
          const proposal = generateProposalTemplate(feature);
          const fs = await import('fs');
          fs.writeFileSync(options.output, proposal, 'utf-8');
          console.log(chalk.green(`\n✓ Proposal template written to: ${options.output}`));
        }
      } catch (error) {
        console.error(
          chalk.red(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
        );
        process.exit(1);
      }
    });

  return propose;
}

function generateProposalTemplate(feature: FeatureWithStories): string {
  return `# Feature Decomposition Proposal: ${feature.id}

## Feature Overview

**ID**: ${feature.id}
**Title**: ${feature.title}
**Release**: ${feature.releaseId}
${feature.description ? `**Description**: ${feature.description}` : ''}

## Existing Stories

${
  feature.stories.length > 0
    ? feature.stories.map((s) => `- ${s.id}: ${s.title} [${s.complexity}]`).join('\n')
    : '_No existing stories_'
}

## Proposed Stories

### Story 1: [Title]

**ID**: ${feature.id}-XXX
**Complexity**: [XS/S/M/L/XL]
**Estimate**: [points]

**Description**: [What does this story deliver?]

**Acceptance Criteria**:
- [ ] Criterion 1
- [ ] Criterion 2

**Technical Notes**: [Implementation details, dependencies]

---

### Story 2: [Title]

**ID**: ${feature.id}-XXX
**Complexity**: [XS/S/M/L/XL]
**Estimate**: [points]

**Description**: [What does this story deliver?]

**Acceptance Criteria**:
- [ ] Criterion 1
- [ ] Criterion 2

**Technical Notes**: [Implementation details, dependencies]

---

## Story Summary

| ID | Title | Complexity | Estimate |
|----|-------|------------|----------|
| ${feature.id}-XXX | [Title] | [Size] | [Points] |
| ${feature.id}-XXX | [Title] | [Size] | [Points] |

**Total Estimate**: [X] story points

## Implementation Plan

1. [Sequencing and dependencies]
2. [Risk mitigation]
3. [Testing strategy]
`;
}
