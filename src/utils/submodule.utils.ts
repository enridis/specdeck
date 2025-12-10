import { execSync } from 'child_process';
import { SubmoduleConfig } from '../schemas/config.schema';

export interface SubmoduleStatus {
  name: string;
  isStale: boolean;
  currentCommit: string;
  remoteCommit: string;
  message: string;
}

/**
 * Check if a submodule is behind its remote
 * Returns true if submodule is stale (commits ahead on remote)
 */
export function checkSubmoduleStatus(
  submodule: SubmoduleConfig,
  baseDir: string = process.cwd()
): SubmoduleStatus {
  try {
    // Get current submodule commit
    const currentCommit = execSync(`cd "${submodule.path}" && git rev-parse HEAD`, {
      encoding: 'utf-8',
      cwd: baseDir,
    }).trim();

    // Fetch to ensure we have latest remote refs
    try {
      execSync(`cd "${submodule.path}" && git fetch origin`, {
        encoding: 'utf-8',
        cwd: baseDir,
        stdio: 'pipe',
      });
    } catch {
      // Fetch might fail for on-premises repos without access, continue anyway
    }

    // Get remote tracking branch commit (assume origin/HEAD or origin/main)
    let remoteCommit = '';
    try {
      remoteCommit = execSync(
        `cd "${submodule.path}" && git rev-parse origin/HEAD 2>/dev/null || git rev-parse origin/main 2>/dev/null || git rev-parse origin/master`,
        {
          encoding: 'utf-8',
          cwd: baseDir,
          stdio: 'pipe',
        }
      ).trim();
    } catch {
      // If we can't get remote commit, assume not stale
      return {
        name: submodule.name,
        isStale: false,
        currentCommit,
        remoteCommit: 'unknown',
        message: 'Could not determine remote status',
      };
    }

    const isStale = currentCommit !== remoteCommit;

    return {
      name: submodule.name,
      isStale,
      currentCommit,
      remoteCommit,
      message: isStale
        ? `Behind remote. Run 'git submodule update --remote' to pull latest.`
        : 'Up to date',
    };
  } catch (error) {
    return {
      name: submodule.name,
      isStale: false,
      currentCommit: 'unknown',
      remoteCommit: 'unknown',
      message: `Error checking status: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Check status of all submodules
 */
export function checkAllSubmodulesStatus(
  submodules: SubmoduleConfig[],
  baseDir: string = process.cwd()
): SubmoduleStatus[] {
  const results: SubmoduleStatus[] = [];

  for (const submodule of submodules) {
    const status = checkSubmoduleStatus(submodule, baseDir);
    results.push(status);
  }

  return results;
}

/**
 * Check if any submodule is stale
 */
export function isAnySubmoduleStale(
  submodules: SubmoduleConfig[],
  baseDir: string = process.cwd()
): boolean {
  const statuses = checkAllSubmodulesStatus(submodules, baseDir);
  return statuses.some((s) => s.isStale);
}
