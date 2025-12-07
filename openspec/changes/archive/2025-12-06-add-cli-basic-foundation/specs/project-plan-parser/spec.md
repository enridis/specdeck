# Spec: Project Plan Parser

## ADDED Requirements

### Requirement: Parse GFM Table Structure
The CLI MUST parse GitHub Flavored Markdown tables from `project-plan.md` and extract structured data.

#### Scenario: Parse standard GFM table
**Given** a markdown table:
```markdown
| ID        | Title        | Status   | Complexity |
|-----------|--------------|----------|------------|
| FND-01-01 | Task impl    | planned  | M          |
| FND-01-02 | Task filter  | planned  | S          |
```
**When** the parser processes this table
**Then** it identifies 2 data rows
**And** extracts headers: ["ID", "Title", "Status", "Complexity"]
**And** extracts values for each row as key-value pairs
**And** returns array of 2 objects with properties matching headers

#### Scenario: Parse table with varying column widths
**Given** a table with inconsistent spacing and alignment
**When** the parser processes the table
**Then** it correctly extracts data regardless of visual alignment
**And** trims whitespace from all cell values

#### Scenario: Parse table with empty cells
**Given** a table with some cells containing only whitespace or "TBA"
**When** the parser processes the table
**Then** it treats empty cells as `null` or empty string
**And** treats "TBA" as a special marker for "to be assigned"

#### Scenario: Parse table with multiline cells (not supported)
**Given** a table with cells containing newlines via `<br>` tags
**When** the parser processes the table
**Then** it treats the entire cell content as a single value
**And** preserves or strips HTML based on configuration

### Requirement: Extract Milestone Sections
The CLI MUST identify milestone sections in project-plan.md and group stories accordingly.

#### Scenario: Parse milestone with H2 heading
**Given** project-plan.md contains:
```markdown
## Milestone: Q1 – Foundation

### Stories

| ID | Title | ... |
|----|-------|-----|
| ... | ... | ... |
```
**When** the parser processes the document
**Then** it identifies milestone section starting at H2 heading
**And** extracts milestone name: "Q1 – Foundation"
**And** associates all stories in following table with this milestone

#### Scenario: Parse multiple sequential milestones
**Given** project-plan.md contains:
```markdown
## Milestone: Q1 – Foundation
[table]

## Milestone: Q2 – Analytics
[table]
```
**When** the parser processes the document
**Then** it identifies 2 separate milestone sections
**And** associates each table with its preceding milestone heading
**And** does not mix stories between milestones

#### Scenario: Parse milestone with no stories
**Given** a milestone section with heading but no table
**When** the parser processes this section
**Then** it creates a milestone entry with empty stories array
**And** does not fail or throw error

#### Scenario: Stories table without milestone heading
**Given** a stories table appears before any milestone heading
**When** the parser processes the document
**Then** it assigns those stories to a default milestone "Unassigned"
**Or** reports a validation warning about missing milestone

### Requirement: Handle Markdown AST Navigation
The CLI MUST use unified/remark AST to navigate Markdown structure reliably.

#### Scenario: Build AST from markdown
**Given** markdown content with headings, tables, and text
**When** the parser invokes unified with remark-parse and remark-gfm
**Then** it produces an Abstract Syntax Tree (AST)
**And** the AST contains nodes for headings, tables, paragraphs, etc.

#### Scenario: Find heading nodes
**Given** an AST from project-plan.md
**When** the parser searches for heading nodes with depth 2
**Then** it finds all `## Milestone:` headings
**And** extracts heading text content

#### Scenario: Find table nodes
**Given** an AST with table nodes
**When** the parser searches for table nodes
**Then** it identifies table structure with tableRow children
**And** extracts headers from first row
**And** extracts data from subsequent rows

#### Scenario: Navigate parent-child relationships
**Given** an AST with milestone heading followed by subheading and table
**When** the parser walks the tree
**Then** it determines which table belongs to which milestone
**And** handles nested sections correctly

### Requirement: Validate Table Schema
The CLI MUST validate that story tables have required columns in the correct format.

#### Scenario: Valid table schema
**Given** a table with headers: ID, Title, Status, Complexity, Estimate, Owner, Jira, OpenSpec, Tags, Notes
**When** validation runs
**Then** all required columns are present
**And** validation passes

#### Scenario: Missing required columns
**Given** a table without "Status" column
**When** validation runs
**Then** validation fails with "Missing required column: Status"
**And** shows line number where table starts

#### Scenario: Extra columns allowed
**Given** a table with additional custom columns beyond the standard set
**When** validation runs
**Then** validation passes
**And** extra columns are preserved but not processed

#### Scenario: Column order independence
**Given** a table with columns in non-standard order (e.g., Status before Title)
**When** the parser processes the table
**Then** it correctly maps data by column name, not position
**And** produces correct story objects

### Requirement: Error Recovery and Line Tracking
The CLI MUST provide accurate error messages with file paths and line numbers.

#### Scenario: Track line numbers during parsing
**Given** project-plan.md with 100 lines
**And** an invalid story at line 42
**When** validation error occurs
**Then** the error message includes "at line 42"
**And** shows the problematic content or context

#### Scenario: Recover from partial parse failures
**Given** project-plan.md with 3 milestone sections
**And** second milestone has malformed table
**When** the parser processes the file
**Then** it parses first milestone successfully
**And** reports error for second milestone with line number
**And** attempts to parse third milestone
**And** returns partial results with error list

#### Scenario: Invalid markdown structure
**Given** project-plan.md with malformed table (missing separator row)
**When** the parser processes the file
**Then** it detects the malformed table
**And** reports "Invalid table structure at line X"
**And** suggests checking table separator row format

### Requirement: YAML Front Matter Handling
The CLI MUST extract YAML front matter from markdown files for metadata.

#### Scenario: Parse front matter from release file
**Given** a release file with YAML front matter:
```yaml
---
id: R1-foundation
title: Foundation Release
timeframe: Q1 2025
---
[markdown content]
```
**When** the parser processes the file
**Then** it extracts front matter as an object: `{id, title, timeframe}`
**And** separates front matter from markdown content

#### Scenario: File without front matter
**Given** a markdown file with no YAML front matter section
**When** the parser processes the file
**Then** it treats entire content as markdown body
**And** returns `null` or empty object for front matter

#### Scenario: Invalid YAML syntax in front matter
**Given** a file with malformed YAML front matter
**When** the parser processes the file
**Then** it throws a specific error "Invalid YAML front matter"
**And** shows the YAML parsing error details

### Requirement: Performance Optimization
The parser MUST handle reasonably large project-plan.md files efficiently.

#### Scenario: Parse large project-plan file
**Given** project-plan.md with 500 stories across 20 milestones
**When** the parser processes the file
**Then** parsing completes in under 200ms
**And** returns all stories correctly

#### Scenario: Incremental parsing (future optimization)
**Given** a command only needs stories from one milestone
**When** the parser is invoked
**Then** it can optionally stop parsing after finding the target milestone
**And** avoids processing entire file unnecessarily

#### Scenario: Caching parsed AST (within command execution)
**Given** multiple operations need to read project-plan.md in one command
**When** the file is parsed the first time
**Then** subsequent reads use cached AST
**And** file is only read from disk once per command execution
