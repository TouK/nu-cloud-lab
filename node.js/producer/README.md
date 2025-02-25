## Configuration

1. Copy the configuration template file:
   ```bash
   cp config.yaml.template config.yaml
   ```

2. Edit `config.yaml` with your actual configuration values:
   ```yaml
   api:
     url: "your_actual_api_url"
     username: "publisher"
     password: "your_actual_password"
   ```

3. The `config.yaml` file is ignored by git to prevent accidental commits of sensitive data.
