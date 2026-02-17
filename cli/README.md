# @nu-cloud/cli

CLI tool for Nu Cloud messaging - produce and consume messages with ease.

## Installation

### Global (recommended)
```bash
npm install -g @nu-cloud/cli
```

### Local (per-project)
```bash
npm install @nu-cloud/cli
npx nu-cloud --help
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
   nu-cloud init
   ```

2. **Start consuming messages:**
   ```bash
   nu-cloud consume
   ```
   Copy the webhook URL to Nu Cloud subscription.

3. **Start producing messages:**
   ```bash
   nu-cloud produce
   ```

## Commands

### `nu-cloud init`
Initialize configuration file interactively.

```bash
nu-cloud init                    # Interactive mode
nu-cloud init --no-interactive   # Use template
nu-cloud init -o myconfig.yaml   # Custom output path
```

**Interactive prompts:**
- Nu Cloud API URL
- Username
- Password
- Delay between messages
- Multiple profiles support

### `nu-cloud send`
Send a single message to Nu Cloud (manual mode).

```bash
# Using inline JSON/YAML data
nu-cloud send --data '{"name": "John", "age": 30}'

# Using a file
nu-cloud send --file message.json

# Using a custom template
nu-cloud send --template custom-template.yaml

# Dry run
nu-cloud send --dry-run

# With specific profile
nu-cloud send --profile production --data '{"event": "user_login"}'
```

**Priority:** `--data` > `--file` > `--template` > config template > default template

**Options:**
- `-C, --config <path>` - Config file path (default: `.nu-cloud.yaml`)
- `-p, --profile <name>` - Config profile to use
- `-d, --data <json>` - Message data as JSON/YAML string
- `-f, --file <path>` - Message data from file (JSON/YAML)
- `-t, --template <path>` - Template file to use (overrides config)
- `--dry-run` - Show what would be sent without sending

### `nu-cloud produce`
Send messages to Nu Cloud continuously.

```bash
nu-cloud produce                         # Start continuous production
nu-cloud produce -c 10                   # Send 10 messages and exit
nu-cloud produce -c 1                    # Send single message
nu-cloud produce --dry-run               # Preview without sending
nu-cloud produce -C custom.yaml          # Use custom config
nu-cloud produce --profile production    # Use named profile
nu-cloud produce --delay 5               # Override delay (seconds)
nu-cloud produce --template custom.yaml  # Use custom template
```

**Options:**
- `-C, --config <path>` - Config file path (default: `.nu-cloud.yaml`)
- `-p, --profile <name>` - Config profile to use
- `-d, --delay <seconds>` - Delay between messages (overrides config)
- `-t, --template <path>` - Template file to use (overrides config)
- `-c, --count <number>` - Send specified number of messages and exit
- `--dry-run` - Show what would be sent without sending

### `nu-cloud consume`
Start webhook consumer with tunnel support.

```bash
# With auto-detected tunnel (cloudflared or tailscale)
nu-cloud consume

# With specific tunnel provider
nu-cloud consume --tunnel cloudflared
nu-cloud consume --tunnel tailscale

# With custom webhook path (tailscale)
nu-cloud consume --tunnel tailscale --tunnel-path /my-webhook

# Without tunnel (local only)
nu-cloud consume --no-tunnel

# Custom port
nu-cloud consume --port 8080

# Debug mode
nu-cloud consume --debug

# JSON output mode (for piping)
nu-cloud consume --json
nu-cloud consume --json | jq '.email'
nu-cloud consume --json --no-tunnel > messages.jsonl
```

**Options:**
- `-p, --port <number>` - Server port (default: `6555`)
- `--tunnel <provider>` - Tunnel provider: `cloudflared`, `tailscale`, `none` (default: `auto`)
- `--tunnel-path <path>` - Webhook path for tunnel (tailscale only, default: `/webhook`)
- `--no-tunnel` - Skip tunnel setup
- `--debug` - Enable debug logging
- `--json` - Output raw JSON only (suitable for piping to other tools)

**Tunnel Providers:**
- **cloudflared**: Automatic, requires `cloudflared` installed
- **tailscale**: Requires `tailscale` installed and authenticated
- **auto**: Detects which tool is available (cloudflared first, then tailscale)
- **none**: Local server only (no public URL)

**JSON Mode:**
The `--json` flag outputs only raw JSON messages (one per line) to stdout, suppressing all other logs. This is perfect for piping to other tools:

```bash
# Filter emails with jq
nu-cloud consume --json | jq '.email'

# Save to JSONL file
nu-cloud consume --json --no-tunnel > messages.jsonl

# Process with custom script
nu-cloud consume --json | while read -r msg; do
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

### `nu-cloud schema`
Generate Avro schema from message template.

```bash
nu-cloud schema                  # Print to stdout
nu-cloud schema -o schema.avsc   # Save to file
```

**Options:**
- `-o, --output <path>` - Output file (stdout if not specified)

## Configuration

### Basic config (`.nu-cloud.yaml`)

```yaml
api:
  url: "https://your-api.cloud.nussknacker.io/topics/your-topic"
  username: "publisher"
  password: ""  # Leave empty for endpoints without authentication

producer:
  delay_seconds: 1
  # template_path: "./custom-template.yaml"  # Optional: custom message template
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
nu-cloud produce --profile production
nu-cloud produce --profile staging
```

Profiles are merged with the default configuration, so you only need to specify the values that differ.

## Message Templates

Templates define the structure of generated messages using faker.js for realistic test data.

### Default Template

The CLI includes a default template with faker.js support:

```yaml
name: "faker:person.fullName"
email: "faker:internet.email"
age: "faker:number.int(18,65)"
timestamp: "current_timestamp"
```

### Custom Templates

Create your own template file:

```yaml
# my-template.yaml
userId: "faker:string.uuid"
username: "faker:internet.userName"
company: "faker:company.name"
location: "faker:location.city"
price: "faker:commerce.price(10,1000)"
```

**Use it:**

```bash
# In .nu-cloud.yaml
producer:
  template_path: "./my-template.yaml"

# Or via CLI flag
nu-cloud produce --template ./my-template.yaml
nu-cloud send --template ./my-template.yaml
```

### Faker.js Syntax

Supports full [faker.js API](https://fakerjs.dev/api/):

- `faker:person.fullName` → Random full name
- `faker:internet.email` → Random email
- `faker:number.int(18,65)` → Random integer between 18 and 65
- `faker:company.name` → Random company name
- `faker:location.streetAddress` → Random street address
- `faker:string.uuid` → Random UUID
- `faker:commerce.price(10,1000)` → Random price between 10 and 1000

### Legacy Syntax (still supported)

- `random_name` → Random name from built-in list
- `random_int(1,100)` → Random integer
- `current_timestamp` → ISO 8601 timestamp

## Message Templates

Messages are generated from templates defined in `src/lib/template/generator.ts`. To customize message structure, edit the `MESSAGE_TEMPLATE` constant:

```typescript
export const MESSAGE_TEMPLATE: TemplateObject = {
  "name": "random_name",
};
```

### Example: Complex template

```typescript
export const MESSAGE_TEMPLATE = {
  user: {
    name: "random_name",
    city: "random_city"
  },
  order: {
    product: "random_product",
    quantity: "random_int(1,5)",
    status: "random_status",
    timestamp: "current_timestamp"
  }
};
```

### Available placeholders

- `random_name` - Random person name from predefined list
- `random_city` - Random city name
- `random_product` - Random product name
- `random_status` - Random status (pending, completed, failed, in_progress)
- `random_int(min,max)` - Random integer in range (e.g., `random_int(1,10)`)
- `current_timestamp` - ISO 8601 timestamp (e.g., `2024-02-16T10:30:00.000Z`)

After modifying the template, rebuild the CLI:
```bash
npm run build
```

## Examples

### Continuous production with custom delay
```bash
nu-cloud produce --delay 3
```

### Single message to production environment
```bash
nu-cloud produce --profile production --once
```

### Dry run to test message structure
```bash
nu-cloud produce --dry-run --once
{
  "name": "Alice"
}
```

### Generate and save Avro schema
```bash
nu-cloud schema -o schema.avsc
```

### Start consumer on custom port without tunnel
```bash
nu-cloud consume --port 9000 --no-tunnel
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
nu-cloud --help
nu-cloud init --no-interactive
nu-cloud schema
nu-cloud produce --dry-run --once
nu-cloud consume --no-tunnel
```

### Making Changes

1. Edit source files in `src/`
2. Run `npm run build` to compile
3. Test with `nu-cloud` command

## Troubleshooting

### "Config file not found"
Run `nu-cloud init` to create a config file, or specify a custom path with `--config`.

### "Invalid or placeholder password"
Edit your `.nu-cloud.yaml` and set a real password (not `your_password`).

### "cloudflared not found"
Install cloudflared or use `--no-tunnel` flag:
```bash
nu-cloud consume --no-tunnel
```

### Schema validation errors
Generate the correct Avro schema for your message template:
```bash
nu-cloud schema
```
Then create a topic in Nu Cloud with this schema.

## License

Apache-2.0

## Related

- [Nu Cloud Documentation](https://nussknacker.io/documentation)
- [Nussknacker GitHub](https://github.com/nussknacker/nussknacker)
