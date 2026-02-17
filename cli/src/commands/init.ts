import { Command } from 'commander';
import inquirer from 'inquirer';
import fs from 'fs/promises';
import path from 'path';
import yaml from 'yaml';
import { logger } from '../utils/logger.js';
import type { NuCloudConfig } from '../lib/config/types.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const initCommand = new Command('init')
  .description('Initialize configuration file')
  .option('-i, --interactive', 'Interactive mode (default)', true)
  .option('--no-interactive', 'Non-interactive mode (use template)')
  .option('-o, --output <path>', 'Output file path', '.nu-cloud.yaml')
  .action(async (options) => {
    try {
      let config: NuCloudConfig;

      if (options.interactive) {
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'url',
            message: 'Nu Cloud API URL:',
            default: 'https://your-api-url.cloud.nussknacker.io/topics/your-topic',
            validate: (input) => input.length > 0 || 'URL is required'
          },
          {
            type: 'input',
            name: 'username',
            message: 'Username:',
            default: 'publisher'
          },
          {
            type: 'password',
            name: 'password',
            message: 'Password (leave empty for no auth):',
            default: ''
          },
          {
            type: 'number',
            name: 'delay',
            message: 'Delay between messages (seconds):',
            default: 1
          },
          {
            type: 'confirm',
            name: 'profiles',
            message: 'Do you want to add multiple profiles (dev/staging/prod)?',
            default: false
          }
        ]);

        config = {
          api: {
            url: answers.url,
            username: answers.username,
            password: answers.password
          },
          producer: {
            delay_seconds: answers.delay
          }
        };

        if (answers.profiles) {
          config.profiles = {};
          logger.info('You can manually edit the config file to add more profiles');
        }
      } else {
        // Non-interactive: use template
        const templatePath = path.join(__dirname, 'config.yaml.template');
        const template = await fs.readFile(templatePath, 'utf-8');
        config = yaml.parse(template);
      }

      // Write config
      const outputPath = path.resolve(options.output);
      await fs.writeFile(outputPath, yaml.stringify(config), 'utf-8');

      logger.success(`Configuration file created: ${outputPath}`);

      if (!options.interactive) {
        logger.warn('Please edit the config file with your actual credentials');
      }
    } catch (error) {
      if (error instanceof Error) {
        logger.error(error.message);
      }
      process.exit(1);
    }
  });
