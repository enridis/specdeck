import { Command } from 'commander';
import chalk from 'chalk';
import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { ConfigRepository } from '../repositories';
import { parseMarkdown, extractFrontMatter } from '../parsers';

interface ValidateOptions {
  strict?: boolean;
}

export function createValidateCommand(): Command {
  const validate = new Command('validate').description('Validate OpenSpec structure and formats');

  // Validate all
  validate
    .command('all')
    .description('Validate all OpenSpec files')
    .option('--strict', 'Enable strict validation')
    .action(async (options: ValidateOptions) => {
      try {
        const config = await new ConfigRepository(process.cwd()).read();
        const specdeckDir = config.specdeckDir;
        const strict: boolean = Boolean(options.strict);

        console.log(chalk.bold.cyan('\n🔍 SpecDeck Validation\n'));

        let errors = 0;
        let warnings = 0;

        // Validate vision (in specdeck/)
        const visionPath = join(specdeckDir, 'vision.md');
        if (existsSync(visionPath)) {
          const result = validateVision(visionPath, strict);
          errors += result.errors;
          warnings += result.warnings;
        } else {
          console.log(chalk.yellow('⚠ No vision.md found in specdeck/'));
          warnings++;
        }

        // Validate project plan (in specdeck/)
        const projectPlanPath = join(specdeckDir, 'project-plan.md');
        if (existsSync(projectPlanPath)) {
          const result = validateProjectPlan(projectPlanPath, strict);
          errors += result.errors;
          warnings += result.warnings;
        } else {
          console.log(chalk.yellow('⚠ No project-plan.md found in specdeck/'));
          warnings++;
        }

        // Validate OpenSpec if available
        if (config.openspecDir && existsSync(config.openspecDir)) {
          console.log(chalk.gray('\n📦 Validating OpenSpec integration...\n'));

          // Validate releases
          const releasesDir = join(config.openspecDir, 'releases');
          if (existsSync(releasesDir)) {
            const releaseFiles = readdirSync(releasesDir).filter((f) => f.endsWith('.md'));
            console.log(chalk.gray(`Validating ${releaseFiles.length} release(s)...`));

            for (const file of releaseFiles) {
              const result = validateRelease(join(releasesDir, file), strict);
              if (result.errors > 0 || result.warnings > 0) {
                console.log(
                  chalk.gray(`  ${file}: ${result.errors} error(s), ${result.warnings} warning(s)`)
                );
              }
              errors += result.errors;
              warnings += result.warnings;
            }
          }
        }

        // Summary
        console.log(chalk.bold('\n📊 Validation Summary:'));
        console.log(`  Errors: ${errors > 0 ? chalk.red(errors) : chalk.green(errors)}`);
        console.log(`  Warnings: ${warnings > 0 ? chalk.yellow(warnings) : chalk.green(warnings)}`);

        if (errors === 0) {
          console.log(chalk.green('\n✓ Validation passed'));
        } else {
          console.log(chalk.red('\n✗ Validation failed'));
          process.exit(1);
        }
      } catch (error) {
        console.error(
          chalk.red(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
        );
        process.exit(1);
      }
    });

  return validate;
}

function validateVision(path: string, _strict: boolean): { errors: number; warnings: number } {
  let errors = 0;
  let warnings = 0;

  try {
    const content = readFileSync(path, 'utf-8');

    console.log(chalk.gray('\nValidating vision.md...'));

    // Vision.md is a freeform document, just check it has some content
    if (content.trim().length < 100) {
      console.log(chalk.yellow('  ⚠ Vision document is very short'));
      warnings++;
    }

    if (content.includes('[TODO]') || content.includes('[PLACEHOLDER]')) {
      console.log(chalk.yellow('  ⚠ Contains placeholders'));
      warnings++;
    }

    if (errors === 0 && warnings === 0) {
      console.log(chalk.green('  ✓ vision.md is valid'));
    }
  } catch (error) {
    console.log(
      chalk.red(
        `  ✗ Failed to validate: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    );
    errors++;
  }

  return { errors, warnings };
}

function validateRelease(path: string, _strict: boolean): { errors: number; warnings: number } {
  let errors = 0;
  let warnings = 0;

  try {
    const content = readFileSync(path, 'utf-8');
    const ast = parseMarkdown(content);
    const frontMatter = extractFrontMatter(ast);

    if (!frontMatter) {
      console.log(chalk.red(`  ✗ ${path}: Missing YAML front matter`));
      errors++;
      return { errors, warnings };
    }

    if (!frontMatter.id || !frontMatter.title) {
      console.log(chalk.red(`  ✗ ${path}: Missing required fields (id, title)`));
      errors++;
    }

    if (!content.includes('## Objectives')) {
      console.log(chalk.yellow(`  ⚠ ${path}: Missing Objectives section`));
      warnings++;
    }

    if (!content.includes('## Features')) {
      console.log(chalk.yellow(`  ⚠ ${path}: Missing Features section`));
      warnings++;
    }
  } catch (error) {
    console.log(chalk.red(`  ✗ ${path}: Failed to validate`));
    errors++;
  }

  return { errors, warnings };
}

function validateProjectPlan(path: string, _strict: boolean): { errors: number; warnings: number } {
  let errors = 0;
  let warnings = 0;

  try {
    const content = readFileSync(path, 'utf-8');

    console.log(chalk.gray('\nValidating project-plan.md...'));

    // project-plan.md is now a roadmap, check for release sections
    if (!content.includes('## R')) {
      console.log(chalk.yellow('  ⚠ No release sections found (expected ## R1, ## R2, etc.)'));
      warnings++;
    }

    if (!content.includes('Status:')) {
      console.log(chalk.yellow('  ⚠ No release status information found'));
      warnings++;
    }

    if (errors === 0 && warnings === 0) {
      console.log(chalk.green('  ✓ project-plan.md is valid'));
    }
  } catch (error) {
    console.log(
      chalk.red(
        `  ✗ Failed to validate: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    );
    errors++;
  }

  return { errors, warnings };
}
