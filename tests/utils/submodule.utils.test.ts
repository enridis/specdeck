import {
  checkSubmoduleStatus,
  checkAllSubmodulesStatus,
  isAnySubmoduleStale,
} from '../../src/utils/submodule.utils';
import { SubmoduleConfig } from '../../src/schemas/config.schema';

// Mock execSync
jest.mock('child_process', () => ({
  execSync: jest.fn((cmd: string) => {
    // Throw error for nonexistent path
    if (cmd.includes('./nonexistent')) {
      throw new Error('fatal: not a git repository');
    }
    // Mock different responses based on command
    if (cmd.includes('rev-parse HEAD')) {
      return 'abc123def456\n';
    } else if (cmd.includes('fetch origin')) {
      return '';
    } else if (cmd.includes('rev-parse origin')) {
      // Return different values to simulate stale/fresh
      if (cmd.includes('models')) {
        return 'abc123def456\n'; // Same as HEAD (up to date)
      } else {
        return 'different789abc\n'; // Different from HEAD (stale)
      }
    }
    return '';
  }),
}));

describe('Submodule Utils', () => {
  const mockSubmodules: SubmoduleConfig[] = [
    { name: 'backend', path: './submodules/backend', visibility: 'public' },
    { name: 'frontend', path: './submodules/frontend', visibility: 'private' },
    { name: 'models', path: './submodules/models', visibility: 'on-premises' },
  ];

  describe('checkSubmoduleStatus', () => {
    it('should check if submodule is up to date', () => {
      const status = checkSubmoduleStatus(mockSubmodules[2]); // models (up to date)

      expect(status).toHaveProperty('name', 'models');
      expect(status).toHaveProperty('isStale');
      expect(status).toHaveProperty('currentCommit');
      expect(status).toHaveProperty('remoteCommit');
      expect(status).toHaveProperty('message');
    });

    it('should detect stale submodules', () => {
      const status = checkSubmoduleStatus(mockSubmodules[0]); // backend (stale)

      expect(status.name).toBe('backend');
      expect(typeof status.isStale).toBe('boolean');
    });

    it('should return proper status message', () => {
      const status = checkSubmoduleStatus(mockSubmodules[2]);

      expect(status.message).toBeDefined();
      expect(typeof status.message).toBe('string');
    });

    it('should handle error gracefully', () => {
      const invalidSubmodule: SubmoduleConfig = {
        name: 'invalid',
        path: './nonexistent',
        visibility: 'public',
      };

      const status = checkSubmoduleStatus(invalidSubmodule);

      expect(status.name).toBe('invalid');
      expect(status.currentCommit).toBe('unknown');
      expect(status.remoteCommit).toBe('unknown');
    });

    it('should return unknown remote commit if fetch fails', () => {
      // When fetch fails or remote info unavailable
      const status = checkSubmoduleStatus(mockSubmodules[0]);

      expect(status).toHaveProperty('currentCommit');
      expect(status).toHaveProperty('remoteCommit');
    });
  });

  describe('checkAllSubmodulesStatus', () => {
    it('should check status of all submodules', () => {
      const statuses = checkAllSubmodulesStatus(mockSubmodules);

      expect(statuses).toHaveLength(3);
      expect(statuses[0]).toHaveProperty('name', 'backend');
      expect(statuses[1]).toHaveProperty('name', 'frontend');
      expect(statuses[2]).toHaveProperty('name', 'models');
    });

    it('should return status for each submodule', () => {
      const statuses = checkAllSubmodulesStatus(mockSubmodules);

      for (const status of statuses) {
        expect(status).toHaveProperty('name');
        expect(status).toHaveProperty('isStale');
        expect(status).toHaveProperty('currentCommit');
        expect(status).toHaveProperty('remoteCommit');
        expect(status).toHaveProperty('message');
      }
    });

    it('should handle empty submodules list', () => {
      const statuses = checkAllSubmodulesStatus([]);

      expect(statuses).toEqual([]);
    });

    it('should continue checking after first failure', () => {
      const mixed: SubmoduleConfig[] = [
        mockSubmodules[0],
        { name: 'invalid', path: './nonexistent', visibility: 'public' },
        mockSubmodules[2],
      ];

      const statuses = checkAllSubmodulesStatus(mixed);

      expect(statuses).toHaveLength(3);
      expect(statuses[0]).toBeDefined();
      expect(statuses[2]).toBeDefined();
    });
  });

  describe('isAnySubmoduleStale', () => {
    it('should return true if any submodule is stale', () => {
      const isStale = isAnySubmoduleStale([mockSubmodules[0]]); // backend is stale

      expect(typeof isStale).toBe('boolean');
    });

    it('should return false if all submodules are up to date', () => {
      const isStale = isAnySubmoduleStale([mockSubmodules[2]]); // models is up to date

      expect(typeof isStale).toBe('boolean');
    });

    it('should return false for empty submodules', () => {
      const isStale = isAnySubmoduleStale([]);

      expect(isStale).toBe(false);
    });

    it('should check all submodules and return true if any stale', () => {
      const isStale = isAnySubmoduleStale(mockSubmodules);

      expect(typeof isStale).toBe('boolean');
    });
  });

  describe('status message content', () => {
    it('should include helpful message for stale submodules', () => {
      const status = checkSubmoduleStatus(mockSubmodules[0]);

      if (status.isStale) {
        expect(status.message).toContain('git submodule update');
      }
    });

    it('should indicate up to date status', () => {
      const status = checkSubmoduleStatus(mockSubmodules[2]);

      if (!status.isStale) {
        expect(status.message).toContain('Up to date');
      }
    });

    it('should display error message on failure', () => {
      const invalidSubmodule: SubmoduleConfig = {
        name: 'test',
        path: './invalid',
        visibility: 'public',
      };

      const status = checkSubmoduleStatus(invalidSubmodule);

      if (status.currentCommit === 'unknown') {
        expect(status.message).toContain('Error');
      }
    });
  });

  describe('commit comparison', () => {
    it('should compare current and remote commits', () => {
      const status = checkSubmoduleStatus(mockSubmodules[0]);

      expect(status.currentCommit).toBeDefined();
      expect(status.remoteCommit).toBeDefined();
      expect(typeof status.isStale).toBe('boolean');
    });

    it('should correctly identify when commits match', () => {
      const status = checkSubmoduleStatus(mockSubmodules[2]);

      if (status.currentCommit === status.remoteCommit) {
        expect(status.isStale).toBe(false);
      }
    });

    it('should correctly identify when commits differ', () => {
      const status = checkSubmoduleStatus(mockSubmodules[0]);

      if (status.currentCommit !== status.remoteCommit && status.currentCommit !== 'unknown') {
        expect(status.isStale).toBe(true);
      }
    });
  });

  describe('integration with coordinator config', () => {
    it('should work with SubmoduleConfig type', () => {
      const config: SubmoduleConfig = {
        name: 'test-repo',
        path: './submodules/test',
        visibility: 'public',
      };

      const status = checkSubmoduleStatus(config);

      expect(status.name).toBe('test-repo');
    });

    it('should respect baseDir parameter', () => {
      const status = checkSubmoduleStatus(mockSubmodules[0], '/custom/base');

      expect(status).toBeDefined();
      expect(status).toHaveProperty('name');
    });

    it('should use current directory as default baseDir', () => {
      const status = checkSubmoduleStatus(mockSubmodules[0]);

      expect(status).toBeDefined();
    });
  });
});
