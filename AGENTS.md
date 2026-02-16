# Agent Guidelines for Nu Cloud Lab

This document provides coding agents with essential information about this codebase's structure, conventions, and workflows.

## Project Overview

This is a **multi-language toolkit** for producing and consuming messages with Nu Cloud. The project contains:
- **CLI Tool (Recommended)**: `cli/` - Modern TypeScript CLI with unified interface
- **Python implementation (Legacy)**: `python/producer/` and `python/consumer/`
- **Node.js implementation (Legacy)**: `node.js/producer/` and `node.js/consumer/`

### Architecture
- **Producer**: Sends messages to Nu Cloud API with configurable templates and random data generation
- **Consumer**: Receives webhooks from Nu Cloud via Cloudflare tunnels (Flask/Gunicorn for Python, Fastify for Node.js, or standalone Fastify server in CLI)

## Running Components

### CLI Tool (Recommended)

The modern CLI provides a unified interface for both producing and consuming messages:

```bash
cd cli
npm install
npm run build
npm link

# Initialize configuration
nu-cloud init

# Send single message (manual)
nu-cloud send --data '{"name": "John", "age": 30}'
nu-cloud send --file message.json
nu-cloud send --template custom.yaml

# Produce messages (continuous)
nu-cloud produce                       # Continuous production
nu-cloud produce -c 10                 # Send 10 messages
nu-cloud produce -c 1                  # Send single message
nu-cloud produce --dry-run             # Preview without sending
nu-cloud produce --template custom.yaml  # Custom template
nu-cloud produce --profile production  # Use named profile

# Consume messages
nu-cloud consume                       # Auto-detect tunnel (cloudflared/tailscale)
nu-cloud consume --tunnel cloudflared  # Force cloudflared
nu-cloud consume --tunnel tailscale    # Force tailscale
nu-cloud consume --no-tunnel           # No tunnel
nu-cloud consume --tunnel-path /webhook # Custom path (tailscale)
nu-cloud consume --json                # Raw JSON output (for piping)

# Generate Avro schema
nu-cloud schema
nu-cloud schema -o schema.avsc
```

**CLI Features:**
- **Manual sending**: `send` command for one-off messages
- **Template system**: Faker.js integration for realistic test data
- **Custom templates**: YAML/JSON templates with `template_path` in config
- **Optional auth**: Empty password = no authentication
- **Multiple tunnels**: Auto-detect cloudflared or tailscale
- **Interactive config**: `nu-cloud init` wizard
- **Multiple profiles**: dev/staging/prod in single config file
- **Dry-run mode**: Test without sending
- **JSON output mode**: `--json` flag for piping to other tools (jq, files, etc.)

**See `cli/README.md` for complete documentation.**

### Python Producer
```bash
cd python/producer
./run_producer.sh              # Direct execution (creates venv, installs deps)
./run_producer_in_docker.sh    # Docker execution
python producer.py --schema    # Generate Avro schema from template
```

### Python Consumer
```bash
cd python/consumer
./run_consumer.sh              # Starts gunicorn + cloudflared tunnel
./run_consumer_in_docker.sh    # Docker execution
./run_consumer.sh --debug      # Enable debug logging
```

### Node.js Producer
```bash
cd node.js/producer
./run_producer.sh              # Installs via pnpm, runs node producer.js
./run_producer_in_docker.sh    # Docker execution
node producer.js --schema      # Generate Avro schema from template
```

### Node.js Consumer
```bash
cd node.js/consumer
./run_consumer.sh              # Installs via pnpm, runs node consumer.js
./run_consumer_in_docker.sh    # Docker execution
./run_consumer.sh --debug      # Enable debug logging
```

## Dependency Management

### CLI (TypeScript)
- Uses **npm** (standard Node.js package manager)
- Dependencies in `package.json` with `package-lock.json`
- Install: `npm install`
- Build: `npm run build` (uses tsup)
- Dev mode: `npm run dev` (uses tsx)
- Global link: `npm link` (for local testing)

### Python (Legacy)
- Uses **pip** with **venv** (virtual environments)
- Dependencies in `requirements.txt`
- Virtual environments: `producer_env/` or `consumer_env/` (gitignored)
- Install: `pip install -r requirements.txt` (handled automatically by run scripts)

### Node.js (Legacy)
- Uses **pnpm** (preferred over npm/yarn)
- Dependencies in `package.json` with `pnpm-lock.yaml`
- Install: `pnpm install` (handled automatically by run scripts)
- Scripts auto-install pnpm via corepack if missing

## Testing & Linting

**No test framework or linters are currently configured.** If adding tests:
- Python: Consider `pytest` with `pytest.ini` configuration
- Node.js: Consider `vitest` or `jest`

## Code Style Guidelines

### Python Style

#### Naming Conventions
- **Functions/variables**: `snake_case` (e.g., `send_data`, `delay_seconds`)
- **Classes**: `PascalCase` (e.g., `ValidationError`)
- **Constants**: `UPPER_CASE` (e.g., `SAMPLE_DATA`, `MESSAGE_TEMPLATE`)
- **Private members**: Prefix with `_` (e.g., `_process_field`)

#### Type Hints
- Use type hints from `typing` module: `Dict`, `Any`, `List`
- Example: `def send_data(url: str, username: str, password: str, data: dict = None):`
- Example: `def infer_avro_type(value: str) -> Dict[str, Any]:`

#### Imports
- **Standard library first**, then **third-party**, separated by blank line
- Example:
```python
import sys
import os
from typing import Dict, Any

import requests
import yaml
```

#### Functions
- Add docstrings for non-trivial functions
- Example: `"""Generate random values based on the field type"""`

### Node.js Style

#### Naming Conventions
- **Functions/variables**: `camelCase` (e.g., `sendData`, `delaySeconds`)
- **Classes**: `PascalCase` (e.g., `ValidationError`)
- **Constants**: `UPPER_CASE` (e.g., `SAMPLE_DATA`, `MESSAGE_TEMPLATE`)

#### Module System
- **Producer uses CommonJS**: `const axios = require('axios')`
- **Consumer uses ESM**: `import Fastify from 'fastify'`
- Check `package.json` `"type"` field to determine which to use

#### Async/Await
- Prefer `async/await` over callbacks
- Example: `async function sendData(url, username, password, data = null) { ... }`
- Always handle errors in async functions

#### JSDoc (Optional)
- Not currently used, but acceptable to add for complex functions

### Cross-Language Conventions

#### Console Output
- Use **emoji** for user-facing messages: `✅`, `❌`, `📝`, `⚠️`
- Example: `console.log('✅ Sent message: ...')` or `print("✅ Sent message: ...")`

#### Error Handling
- Define **custom exception classes** for specific errors
- Python: `class ValidationError(Exception): pass`
- Node.js: `class ValidationError extends Error { ... }`
- Catch specific error types and provide helpful messages
- Exit with code `1` on errors, `0` on success

#### Configuration
- Load from **config.yaml** (gitignored, contains credentials)
- Auto-create from **config.yaml.template** if missing
- Template should have placeholder values like `"your_password"`
- Never hardcode credentials in source files

## File Structure Patterns

### Python Files
```python
# Imports (stdlib, then third-party)
import sys
from typing import Dict, Any

import requests
import yaml

# Constants
SAMPLE_DATA = { ... }
MESSAGE_TEMPLATE = { ... }

# Classes
class ValidationError(Exception):
    pass

# Functions
def helper_function():
    """Docstring explaining what this does"""
    pass

# Main execution
if __name__ == "__main__":
    # Argument parsing, main loop
    pass
```

### Node.js Files
```javascript
// Imports
const axios = require('axios');  // or: import axios from 'axios'

// Constants
const SAMPLE_DATA = { ... };
const MESSAGE_TEMPLATE = { ... };

// Classes
class ValidationError extends Error { ... }

// Functions
function helperFunction() { ... }
async function asyncFunction() { ... }

// Main execution
if (require.main === module) {
    // Main logic
}
```

## Shell Scripts

All shell scripts follow these patterns:
- Start with `#!/bin/bash`
- Check for required dependencies (Python, Node.js, cloudflared, Docker)
- Auto-install missing tools when possible (pnpm, cloudflared)
- Create virtual environments or node_modules as needed
- Forward arguments with `"$@"`
- Clean exit on Ctrl+C with trap handlers

## Security & Secrets

- **NEVER commit `config.yaml`** - it contains API credentials
- Always gitignore: `config.yaml`, `*_env/`, `node_modules/`, `.DS_Store`
- Only commit `config.yaml.template` with placeholder values
- Scripts auto-create `config.yaml` from template on first run

## Common Patterns

### Random Data Generation
Both implementations use template-based random data generation:
- `"random_name"` → Random name from SAMPLE_DATA
- `"random_int(1,5)"` → Random integer in range
- `"current_timestamp"` → ISO 8601 timestamp

### Avro Schema Generation
**CLI (Recommended):**
```bash
nu-cloud schema                # Print to stdout
nu-cloud schema -o schema.avsc # Save to file
```

**Legacy scripts:**
```bash
python producer.py --schema
node producer.js --schema
```

### Error Messages
Provide actionable error messages:
- Include context about what failed
- Suggest next steps or fixes
- Show example configurations when relevant

## Git Workflow

### Commit Messages
Existing commits use lowercase, brief descriptions:
- `"fixes"`, `"improvements"`, `"Added basic readme"`
- No strict convention enforced
- Keep commits focused on single changes

### Branches
- Main branch: `main` or `master`
- No specific branching strategy enforced

## Docker

All components have Dockerfiles and `run_*_in_docker.sh` scripts:
- **Python**: Uses `ubuntu:latest` base with Python 3
- **Node.js**: Uses `node:22-slim` base
- Mounts `config.yaml` as volume for producers
- Exposes port 6555 for consumers

## Key Files by Component

```
cli/                                    # Modern CLI (TypeScript)
  ├── src/
  │   ├── index.ts                     # Entry point
  │   ├── cli.ts                       # Commander setup
  │   ├── commands/                    # CLI commands (produce, consume, schema, init)
  │   ├── lib/
  │   │   ├── producer/                # Producer logic
  │   │   ├── consumer/                # Consumer logic (Fastify + tunnel)
  │   │   ├── template/                # Template engine & schema generation
  │   │   └── config/                  # Config loading & validation
  │   ├── utils/                       # Logger, errors, process helpers
  │   └── templates/
  │       └── config.yaml.template     # Config template
  ├── package.json                     # Dependencies & scripts
  ├── tsconfig.json                    # TypeScript config
  ├── tsup.config.ts                   # Build config
  └── README.md                        # CLI documentation

python/producer/                       # Legacy Python
  ├── producer.py          # Main script
  ├── requirements.txt     # Dependencies
  ├── config.yaml.template # Config template
  └── run_producer.sh      # Run script

node.js/consumer/                      # Legacy Node.js
  ├── consumer.js          # Main script
  ├── package.json         # Dependencies & scripts
  └── run_consumer.sh      # Run script
```

## When Making Changes

### For CLI Development
1. **TypeScript-first**: All new features should be in CLI
2. **Edit source, rebuild**: Modify `src/`, then `npm run build`
3. **Test locally**: Use `npm link` for global testing
4. **Type safety**: Use strict TypeScript, avoid `any`
5. **Update docs**: Keep `cli/README.md` in sync

### For Legacy Scripts (Python/Node.js)
1. **Maintenance only**: CLI is the recommended implementation
2. **Maintain parity**: If changing logic, update both Python and Node.js versions
3. **Update templates**: Keep `config.yaml.template` in sync if config structure changes
4. **Test both paths**: Run scripts directly AND via Docker
5. **Preserve emoji**: User-facing output uses emoji consistently
6. **No breaking changes**: Scripts should remain backwards compatible
