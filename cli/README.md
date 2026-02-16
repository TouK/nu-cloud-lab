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

### `nu-cloud produce`
Send messages to Nu Cloud.

```bash
nu-cloud produce                         # Start continuous production
nu-cloud produce --once                  # Send single message
nu-cloud produce --dry-run               # Preview without sending
nu-cloud produce --config custom.yaml    # Use custom config
nu-cloud produce --profile production    # Use named profile
nu-cloud produce --delay 5               # Override delay (seconds)
```

**Options:**
- `-c, --config <path>` - Config file path (default: `config.yaml`)
- `-p, --profile <name>` - Config profile to use
- `-d, --delay <seconds>` - Delay between messages (overrides config)
- `--once` - Send single message and exit
- `--dry-run` - Show what would be sent without sending

### `nu-cloud consume`
Start webhook consumer.

```bash
nu-cloud consume                 # Start consumer with tunnel
nu-cloud consume --port 8080     # Custom port
nu-cloud consume --debug         # Enable debug logging
nu-cloud consume --no-tunnel     # Skip cloudflared tunnel
```

**Options:**
- `--port <number>` - Server port (default: `6555`)
- `--debug` - Enable debug logging
- `--no-tunnel` - Skip cloudflared tunnel

**Note:** Consumer automatically starts a Cloudflare tunnel if `cloudflared` is installed. Install it with:
- macOS: `brew install cloudflare/cloudflare/cloudflared`
- Linux: https://pkg.cloudflare.com/

### `nu-cloud schema`
Generate Avro schema from message template.

```bash
nu-cloud schema                  # Print to stdout
nu-cloud schema -o schema.avsc   # Save to file
```

**Options:**
- `-o, --output <path>` - Output file (stdout if not specified)

## Configuration

### Basic config (`config.yaml`)

```yaml
api:
  url: "https://your-api.nussknacker.io/topics/your-topic"
  username: "publisher"
  password: "your_password"

producer:
  delay_seconds: 1
```

### Multiple profiles

Use profiles to manage different environments (dev/staging/prod):

```yaml
# Default configuration
api:
  url: "https://dev.nussknacker.io/topics/dev"
  username: "publisher"
  password: "dev_pass"

producer:
  delay_seconds: 1

# Named profiles
profiles:
  production:
    api:
      url: "https://prod.nussknacker.io/topics/prod"
      password: "prod_pass"
  
  staging:
    api:
      url: "https://staging.nussknacker.io/topics/staging"
      password: "staging_pass"
```

**Usage:**
```bash
nu-cloud produce --profile production
nu-cloud produce --profile staging
```

Profiles are merged with the default configuration, so you only need to specify the values that differ.

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
Edit your `config.yaml` and set a real password (not `your_password`).

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
