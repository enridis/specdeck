# config-management Specification Delta

## MODIFIED Requirements

### Requirement: SpecDeck Directory Configuration
The CLI MUST support `specdeckDir` configuration option to specify where SpecDeck-specific files are stored.

#### Scenario: Use default specdeck directory
**Given** no `.specdeck.config.json` exists
**When** any SpecDeck command needs to read `project-plan.md`
**Then** the CLI uses `./specdeck/project-plan.md` as default path
**And** command executes normally

#### Scenario: Custom specdeck directory via config
**Given** `.specdeck.config.json` contains:
```json
{
  "openspecDir": "./openspec",
  "specdeckDir": "./custom-specdeck"
}
```
**When** any SpecDeck command needs to read `project-plan.md`
**Then** the CLI uses `./custom-specdeck/project-plan.md`
**And** command executes normally

#### Scenario: Config validation
**Given** `.specdeck.config.json` specifies `specdeckDir`
**When** the config is validated
**Then** `specdeckDir` must be a string path
**And** can be relative or absolute
**And** defaults to `./specdeck` if not specified
