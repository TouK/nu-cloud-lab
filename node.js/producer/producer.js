const axios = require('axios');
const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

// Sample data for random generation
const SAMPLE_DATA = {
    names: ["Alice", "Bob", "Charlie", "David", "Eve", "Frank", "Grace", "Hannah"],
    cities: ["New York", "London", "Tokyo", "Paris", "Berlin", "Sydney"],
    products: ["Laptop", "Phone", "Tablet", "Watch", "Headphones"],
    statuses: ["pending", "completed", "failed", "in_progress"]
};

// Template for the message structure
const MESSAGE_TEMPLATE = {
    "name": "random_name",
};

const EXAMPLE_MESSAGE_TEMPLATE = {
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

class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
    }
}

function getRandomValue(fieldType) {
    if (fieldType === "random_name") {
        return SAMPLE_DATA.names[Math.floor(Math.random() * SAMPLE_DATA.names.length)];
    } else if (fieldType === "random_city") {
        return SAMPLE_DATA.cities[Math.floor(Math.random() * SAMPLE_DATA.cities.length)];
    } else if (fieldType === "random_product") {
        return SAMPLE_DATA.products[Math.floor(Math.random() * SAMPLE_DATA.products.length)];
    } else if (fieldType === "random_status") {
        return SAMPLE_DATA.statuses[Math.floor(Math.random() * SAMPLE_DATA.statuses.length)];
    } else if (fieldType === "current_timestamp") {
        return new Date().toISOString();
    } else if (fieldType.startsWith("random_int")) {
        const [min, max] = fieldType.slice(11, -1).split(',').map(Number);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    return fieldType;
}

function generateData(template = MESSAGE_TEMPLATE) {
    if (typeof template === 'object' && template !== null) {
        return Object.fromEntries(
            Object.entries(template).map(([k, v]) => [k, generateData(v)])
        );
    } else if (Array.isArray(template)) {
        return template.map(item => generateData(item));
    } else if (typeof template === 'string') {
        return getRandomValue(template);
    }
    return template;
}

function inferAvroType(value) {
    if (["random_name", "random_city", "random_product", "random_status"].includes(value)) {
        return { type: "string" };
    } else if (value === "current_timestamp") {
        return { type: "string", logicalType: "iso-datetime" };
    } else if (value.startsWith("random_int")) {
        return { type: "int" };
    }
    return { type: "string" };
}

function generateAvroSchema(template = MESSAGE_TEMPLATE, name = "Message") {
    function processField(value, fieldName) {
        if (typeof value === 'object' && value !== null) {
            return {
                name: fieldName,
                type: {
                    type: "record",
                    name: fieldName.charAt(0).toUpperCase() + fieldName.slice(1),
                    fields: Object.entries(value).map(([k, v]) => processField(v, k))
                }
            };
        } else if (typeof value === 'string') {
            const fieldSchema = inferAvroType(value);
            return { name: fieldName, ...fieldSchema };
        }
        return { name: fieldName, type: "string" };
    }

    const schema = {
        type: "record",
        name: name,
        namespace: "com.example",
        fields: Object.entries(template).map(([key, value]) => processField(value, key))
    };

    return JSON.stringify(schema, null, 2);
}

function loadConfig() {
    const configPath = path.join(__dirname, 'config.yaml');
    const templatePath = path.join(__dirname, 'config.yaml.template');

    if (!fs.existsSync(configPath)) {
        console.log("📝 Creating initial config.yaml from template...");
        fs.copyFileSync(templatePath, configPath);
        console.log("✅ Created config.yaml");
        console.log("⚠️  Please edit config.yaml with your actual configuration values");
        process.exit(1);
    }

    return yaml.load(fs.readFileSync(configPath, 'utf8'));
}

async function sendData(url, username, password, data = null) {
    if (!data) {
        data = generateData();
    }

    try {
        await axios.post(url, data, {
            auth: {
                username: username,
                password: password
            },
            headers: {
                'Content-Type': 'application/json'
            }
        });
        console.log(`✅ Sent message: ${JSON.stringify(data)}`);
    } catch (error) {
        if (error.response?.status === 400 && error.response?.data?.includes("Invalid message")) {
            throw new ValidationError(
                `\n\nSchema validation error detected!\n` +
                `Your message structure might not match the expected Avro schema.\n\n` +
                `Current message structure:\n${JSON.stringify(data, null, 2)}\n\n` +
                `Suggested Avro schema for your current message structure:\n` +
                `${generateAvroSchema()}\n\n` +
                `Please use the topic with the appropriate schema in Nu Cloud matching your message structure.\n` +
                `You can copy the schema above and use it in the Nu Cloud interface to create new topic.\n`
            );
        }
        console.error(`❌ Failed to send: ${JSON.stringify(data)}, Response: ${error.message}`);
    }
}

async function main() {
    const args = process.argv.slice(2);
    if (args.includes('--schema')) {
        console.log("Generated Avro Schema:");
        console.log(generateAvroSchema());
        return;
    }

    const config = loadConfig();
    const { url, username, password } = config.api;
    const { delay_seconds } = config.producer;

    try {
        while (true) {
            await sendData(url, username, password);
            await new Promise(resolve => setTimeout(resolve, delay_seconds * 1000));
        }
    } catch (error) {
        if (error instanceof ValidationError) {
            console.error(error.message);
            process.exit(1);
        }
        throw error;
    }
}

if (require.main === module) {
    process.on('SIGINT', () => {
        console.log("\nStopping message production.");
        process.exit(0);
    });

    main().catch(error => {
        console.error(error);
        process.exit(1);
    });
}
