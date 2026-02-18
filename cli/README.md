# @nussknacker/cli

CLI tool for Nussknacker Cloud - produce and consume messages with ease.

## Installation

### Global (recommended)
```bash
npm install -g @nussknacker/cli
```

### Local (per-project)
```bash
npm install @nussknacker/cli
npx nu-cli --help
```

### Development
```bash
cd cli
npm install
npm run build
npm link
```

## Quick Start

1. **Initialize configuration:**
   ```bash
   nu-cli init
   ```

2. **Start consuming messages:**
   ```bash
   nu-cli consume
   ```
   Copy the webhook URL to Nu Cloud subscription.

3. **Start producing messages:**
   ```bash
   nu-cli produce
   ```

## Commands

### `nu-cli init`
Initialize configuration file interactively.

```bash
nu-cli init                    # Interactive mode
nu-cli init --no-interactive   # Use template
nu-cli init -o myconfig.yaml   # Custom output path
```

**Creates:**
- `nu-config.yaml` - Configuration file
- `message-template.yaml` - Default message template

**Interactive prompts:**
- Nu Cloud API URL
- Username
- Password
- Delay between messages
- Multiple profiles support

### `nu-cli send`
Send a single message to Nu Cloud (manual mode).

```bash
# Using inline JSON/YAML data
nu-cli send --data '{"name": "John", "age": 30}'

# Using a file
nu-cli send --file message.json

# Using a custom template
nu-cli send --template custom-template.yaml

# Dry run
nu-cli send --dry-run

# With specific profile
nu-cli send --profile production --data '{"event": "user_login"}'
```

**Priority:** `--data` > `--file` > `--template` > config template > default template

**Options:**
- `-C, --config <path>` - Config file path (default: `nu-config.yaml`)
- `-p, --profile <name>` - Config profile to use
- `-d, --data <json>` - Message data as JSON/YAML string
- `-f, --file <path>` - Message data from file (JSON/YAML)
- `-t, --template <path>` - Template file to use (overrides config)
- `--dry-run` - Show what would be sent without sending

### `nu-cli produce`
Send messages to Nu Cloud continuously.

```bash
nu-cli produce                         # Start continuous production
nu-cli produce -c 10                   # Send 10 messages and exit
nu-cli produce -c 1                    # Send single message
nu-cli produce --dry-run               # Preview without sending
nu-cli produce -C custom.yaml          # Use custom config
nu-cli produce --profile production    # Use named profile
nu-cli produce --delay 5               # Override delay (seconds)
nu-cli produce --template custom.yaml  # Use custom template
```

**Options:**
- `-C, --config <path>` - Config file path (default: `nu-config.yaml`)
- `-p, --profile <name>` - Config profile to use
- `-d, --delay <seconds>` - Delay between messages (overrides config)
- `-t, --template <path>` - Template file to use (overrides config)
- `-c, --count <number>` - Send specified number of messages and exit
- `--dry-run` - Show what would be sent without sending

### `nu-cli consume`
Start webhook consumer with tunnel support.

```bash
# With auto-detected tunnel (cloudflared or tailscale)
nu-cli consume

# With specific tunnel provider
nu-cli consume --tunnel cloudflared
nu-cli consume --tunnel tailscale

# With custom webhook path (tailscale)
nu-cli consume --tunnel tailscale --tunnel-path /my-webhook

# Without tunnel (local only)
nu-cli consume --no-tunnel

# Custom port
nu-cli consume --port 8080

# Debug mode
nu-cli consume --debug

# JSON output mode (for piping)
nu-cli consume --json
nu-cli consume --json | jq '.email'
nu-cli consume --json --no-tunnel > messages.jsonl
```

**Options:**
- `-p, --port <number>` - Server port (default: `6555`)
- `--tunnel <provider>` - Tunnel provider: `cloudflared`, `tailscale`, `none` (default: `auto`)
- `--tunnel-path <path>` - Webhook path for tunnel (tailscale only, default: `/webhook`)
- `--no-tunnel` - Skip tunnel setup
- `--exact-path` - Accept webhooks only on root path `/` (default: wildcard `/*`)
- `--debug` - Enable debug logging
- `--json` - Output raw JSON only (suitable for piping to other tools)

**Tunnel Providers:**
- **cloudflared**: Automatic, requires `cloudflared` installed
- **tailscale**: Requires `tailscale` installed and authenticated
- **auto**: Detects which tool is available (cloudflared first, then tailscale)
- **none**: Local server only (no public URL)

**Webhook Path:**
By default, the consumer accepts webhooks on **any path** (wildcard `/*`). Each message includes the request path in output:
- Normal mode: Shows path with 📍 emoji before each message
- JSON mode: Includes `path` field in output object `{"path": "/webhook", "data": {...}}`

Use `--exact-path` to accept webhooks only on root path `/`:
```bash
nu-cli consume --exact-path
```
With `--exact-path`:
- Only `/` is accepted (other paths return 404)
- Path is not shown in output
- JSON mode outputs just the message data

**JSON Mode:**
The `--json` flag outputs only raw JSON messages (one per line) to stdout, suppressing all other logs.
- Default (wildcard): `{"path": "/webhook", "data": {...}}`
- With `--exact-path`: `{"email": "...", ...}` (just message data)

Perfect for piping to other tools:

```bash
# Filter emails with jq
nu-cli consume --json | jq '.email'

# Save to JSONL file
nu-cli consume --json --no-tunnel > messages.jsonl

# Process with custom script
nu-cli consume --json | while read -r msg; do
  echo "$msg" | jq '.userId' >> user_ids.txt
done
```

Errors are still sent to stderr in JSON format: `{"error": "message"}`

**Install tunnel tools:**
```bash
# Cloudflared
brew install cloudflare/cloudflare/cloudflared

# Tailscale
# Visit https://tailscale.com/download
```

### `nu-cli schema`
Generate Avro schema from message template.

```bash
nu-cli schema                  # Print to stdout
nu-cli schema -o schema.avsc   # Save to file
```

**Options:**
- `-o, --output <path>` - Output file (stdout if not specified)

## Configuration

### Basic config (`nu-config.yaml`)

```yaml
api:
  url: "https://your-api.cloud.nussknacker.io/topics/your-topic"
  username: "publisher"
  password: ""  # Leave empty for endpoints without authentication

producer:
  delay_seconds: 1
  template_path: "./message-template.yaml"  # Path to message template (created by init)
```

**Optional Authentication:**  
If your endpoint doesn't require authentication, leave the password empty. If the endpoint requires auth but you provide no password, you'll get a `401` error.

### Multiple profiles

Use profiles to manage different environments (dev/staging/prod):

```yaml
# Default configuration
api:
  url: "https://dev.cloud.nussknacker.io/topics/dev"
  username: "publisher"
  password: "dev_pass"

producer:
  delay_seconds: 1

# Named profiles
profiles:
  production:
    api:
      url: "https://prod.cloud.nussknacker.io/topics/prod"
      password: "prod_pass"
  
  staging:
    api:
      url: "https://staging.cloud.nussknacker.io/topics/staging"
      password: "staging_pass"
```

**Usage:**
```bash
nu-cli produce --profile production
nu-cli produce --profile staging
```

Profiles are merged with the default configuration, so you only need to specify the values that differ.

## Message Templates

Templates define the structure of generated messages using faker.js for realistic test data.

### Default Template

The CLI includes a default template with faker.js support:

```yaml
name: "::person.fullName"
email: "::internet.email"
age: "::number.int({min:18, max:65})"
timestamp: "current_timestamp"
```

### Custom Templates

Create your own template file:

```yaml
# my-template.yaml
userId: "::string.uuid"
username: "::internet.userName"
company: "::company.name"
location: "::location.city"
price: "::commerce.price({min:10, max:1000})"
status: '::helpers.arrayElement(["active","pending","suspended"])'
```

**Use it:**

```bash
# In nu-config.yaml
producer:
  template_path: "./my-template.yaml"

# Or via CLI flag
nu-cli produce --template ./my-template.yaml
nu-cli send --template ./my-template.yaml
```

### Faker.js Syntax

Full [faker.js API](https://fakerjs.dev/api/) support using `::` prefix. Parameters are parsed as JSON and spread as `...args` to faker functions.

**Simple calls (no parameters):**
```yaml
name: "::person.fullName"
email: "::internet.email"
company: "::company.name"
address: "::location.streetAddress"
uuid: "::string.uuid"
```

**With parameters (use JSON syntax, wrap in single quotes in YAML):**
```yaml
# Object parameters
age: "::number.int({min:18, max:65})"
price: "::commerce.price({min:10, max:1000})"

# Single argument (array)
event: '::helpers.arrayElement(["login","logout","purchase"])'

# Multiple arguments (array, options object)
tags: '::helpers.arrayElements(["tech","sports","music"], {min:2, max:4})'

# Multiple arguments (coordinates, distance, isMetric)
location: '::location.nearbyGPSCoordinate([52.52, 13.40], 10, true)'
```

**How it works:**
- `::category.method` maps to `faker.category.method()`
- Parameters are parsed as JSON: `({min:18,max:65})` → `fn({min:18, max:65})`
- Supports any faker.js function signature exactly as documented

**Special values:**
- `current_timestamp` → ISO 8601 timestamp

### Advanced Examples

**Complete event template:**
```yaml
# events.yaml
userId: "::string.uuid"
eventType: '::helpers.arrayElement(["login","logout","purchase","click"])'
timestamp: "current_timestamp"
user:
  name: "::person.fullName"
  email: "::internet.email"
  age: "::number.int({min:18, max:65})"
metadata:
  ip: "::internet.ip"
  device: '::helpers.arrayElement(["mobile","desktop","tablet"])'
  browser: '::helpers.arrayElement(["Chrome","Firefox","Safari","Edge"])'
  location: "::location.city"
  coordinates: '::location.nearbyGPSCoordinate([52.52, 13.40], 10, true)'
```

**E-commerce order:**
```yaml
orderId: "::string.uuid"
products: '::helpers.arrayElements(["laptop","phone","tablet","watch","headphones"], {min:1, max:3})'
totalPrice: "::commerce.price({min:50, max:5000})"
status: '::helpers.arrayElement(["pending","processing","shipped","delivered"])'
customer:
  id: "::string.uuid"
  name: "::person.fullName"
  email: "::internet.email"
shippingAddress:
  street: "::location.streetAddress"
  city: "::location.city"
  country: "::location.country"
  zipCode: "::location.zipCode"
createdAt: "current_timestamp"
```



## Examples

### Continuous production with custom delay
```bash
nu-cli produce --delay 3
```

### Single message to production environment
```bash
nu-cli produce --profile production --once
```

### Dry run to test message structure
```bash
nu-cli produce --dry-run --once
{
  "name": "Alice"
}
```

### Generate and save Avro schema
```bash
nu-cli schema -o schema.avsc
```

### Start consumer on custom port without tunnel
```bash
nu-cli consume --port 9000 --no-tunnel
```

## Development

### Project Structure

```
cli/
├── src/
│   ├── commands/          # CLI commands (produce, consume, schema, init)
│   ├── lib/
│   │   ├── producer/      # Producer logic
│   │   ├── consumer/      # Consumer logic (Fastify server + tunnel)
│   │   ├── template/      # Template engine & schema generation
│   │   └── config/        # Config loading & validation
│   ├── utils/             # Utilities (logger, errors, process)
│   └── templates/         # Config templates
├── dist/                  # Build output
├── package.json
├── tsconfig.json
└── tsup.config.ts
```

### Build & Test

```bash
# Development mode (watches for changes)
npm run dev -- produce --dry-run --once

# Type checking
npm run typecheck

# Build for production
npm run build

# Link globally for local testing
npm link

# Test all commands
nu-cli --help
nu-cli init --no-interactive
nu-cli schema
nu-cli produce --dry-run --once
nu-cli consume --no-tunnel
```

### Making Changes

1. Edit source files in `src/`
2. Run `npm run build` to compile
3. Test with `nu-cli` command

## Troubleshooting

### "Config file not found"
Run `nu-cli init` to create a config file, or specify a custom path with `--config`.

### "Invalid or placeholder password"
Edit your `nu-config.yaml` and set a real password (not `your_password`).

### "cloudflared not found"
Install cloudflared or use `--no-tunnel` flag:
```bash
nu-cli consume --no-tunnel
```

### Schema validation errors
Generate the correct Avro schema for your message template:
```bash
nu-cli schema
```
Then create a topic in Nu Cloud with this schema.

## Release & Publishing

This package uses **semantic-release** for automated versioning and publishing to npm.

### Two-Track Release Strategy

#### Stable Releases (`master` branch)
- Merge to `master` → stable version (e.g., `0.2.0`)
- Published with `latest` tag
- Install: `npm install @nussknacker/cli`

#### Beta Releases (`dev` branch)
- Merge to `dev` → beta version (e.g., `0.2.0-beta.1`)
- Published with `beta` tag
- Install: `npm install @nussknacker/cli@beta`

### How It Works

**Beta workflow:**
1. Create PR to `dev` branch with [Conventional Commits](https://www.conventionalcommits.org/)
2. Merge → GitHub Actions publishes beta (`0.2.0-beta.1`)
3. Test beta version

**Stable workflow:**
1. Merge `dev` → `master` (after testing)
2. GitHub Actions publishes stable (`0.2.0`)

### Commit Format

- `feat: add new feature` → **MINOR** version bump (0.1.0 → 0.2.0)
- `fix: resolve bug` → **PATCH** version bump (0.1.0 → 0.1.1)
- `feat!: breaking change` → **MAJOR** version bump (0.1.0 → 1.0.0)
- `docs: update readme` → No release
- `chore: update deps` → No release

### Version Examples

```
dev:    0.2.0-beta.1 → 0.2.0-beta.2 → 0.2.0-beta.3
                                        ↓ merge to master
master:                              0.2.0 → 0.2.1
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for full workflow details.

### Manual Testing

```bash
# Dry run (no publish)
npm run build
npm publish --dry-run

# Test semantic-release locally
npx semantic-release --dry-run --no-ci

# Test beta from dev branch
git checkout dev
npx semantic-release --dry-run --no-ci
```

## License

Apache-2.0

## Related

- [Nu Cloud Documentation](https://nussknacker.io/documentation)
- [Nussknacker GitHub](https://github.com/nussknacker/nussknacker)
