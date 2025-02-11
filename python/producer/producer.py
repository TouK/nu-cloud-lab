import requests
import json
import time
import random
from datetime import datetime
from typing import Dict, Any
import argparse
from requests.exceptions import RequestException
import sys

# API details
URL = "https://mpk-8-gateway.staging-cloud.nussknacker.io/topics/http.tests"
USERNAME = "publisher"
PASSWORD = "QTbp6MQL1bvn9unVrg0XzsXEfff"

SAMPLE_DATA = {
    "names": ["Alice", "Bob", "Charlie", "David", "Eve", "Frank", "Grace", "Hannah"],
    "cities": ["New York", "London", "Tokyo", "Paris", "Berlin", "Sydney"],
    "products": ["Laptop", "Phone", "Tablet", "Watch", "Headphones"],
    "statuses": ["pending", "completed", "failed", "in_progress"]
}

# Template for the message structure
# Modify this dictionary to change the structure of your messages
# MESSAGE_TEMPLATE = {
#     "name": "random_name",
#     "city": "random_city",
# }

MESSAGE_TEMPLATE = {
    "user": {
        "name": "random_name",  # Will be replaced with random name
        "city": "random_city"   # Will be replaced with random city
    },
    "order": {
        "product": "random_product",
        "quantity": "random_int(1,5)",
        "status": "random_status",
        "timestamp": "current_timestamp"
    }
}

class ValidationError(Exception):
    pass

def get_random_value(field_type):
    """Generate random values based on the field type"""
    if field_type == "random_name":
        return random.choice(SAMPLE_DATA["names"])
    elif field_type == "random_city":
        return random.choice(SAMPLE_DATA["cities"])
    elif field_type == "random_product":
        return random.choice(SAMPLE_DATA["products"])
    elif field_type == "random_status":
        return random.choice(SAMPLE_DATA["statuses"])
    elif field_type == "current_timestamp":
        return datetime.now().isoformat()
    elif field_type.startswith("random_int"):
        # Parse the range from the string "random_int(min,max)"
        min_val, max_val = map(int, field_type[11:-1].split(','))
        return random.randint(min_val, max_val)
    return field_type

def generate_data(template=MESSAGE_TEMPLATE):
    """Recursively generate data based on the template"""
    if isinstance(template, dict):
        return {k: generate_data(v) for k, v in template.items()}
    elif isinstance(template, list):
        return [generate_data(item) for item in template]
    elif isinstance(template, str):
        return get_random_value(template)
    return template

def send_data():
    data = generate_data()
    headers = {"Content-Type": "application/json"}
    
    try:
        response = requests.post(
            URL, 
            auth=(USERNAME, PASSWORD), 
            headers=headers, 
            data=json.dumps(data)
        )

        if response.status_code == 400 and "Invalid message" in response.text:
            raise ValidationError(
                f"\n\nSchema validation error detected!\n"
                f"Your message structure might not match the expected Avro schema.\n\n"
                f"Current message structure:\n{json.dumps(data, indent=2)}\n\n"
                f"Suggested Avro schema for your current message structure:\n"
                f"{generate_avro_schema()}\n\n"
                f"Please update the schema in Nu Cloud to match your message structure.\n"
                f"You can copy the schema above and use it in the Nu Cloud interface.\n"
            )
        response.raise_for_status()
        print(f"✅ Sent message: {data}")
    except ValidationError as e:
        print(str(e))
        sys.exit(1)
    except RequestException as e:
        print(f"❌ Failed to send: {data}, Response: {e}")

def infer_avro_type(value: str) -> Dict[str, Any]:
    """Infer Avro type from template value"""
    if value == "random_name" or value == "random_city" or value == "random_product" or value == "random_status":
        return {"type": "string"}
    elif value == "current_timestamp":
        return {"type": "string", "logicalType": "iso-datetime"}
    elif value.startswith("random_int"):
        return {"type": "int"}
    return {"type": "string"}  # default fallback

def generate_avro_schema(template: Dict = MESSAGE_TEMPLATE, name: str = "Message") -> str:
    """Generate Avro schema from message template"""
    def _process_field(value: Any, field_name: str) -> Dict[str, Any]:
        if isinstance(value, dict):
            return {
                "name": field_name,
                "type": {
                    "type": "record",
                    "name": field_name.capitalize(),
                    "fields": [
                        _process_field(v, k) 
                        for k, v in value.items()
                    ]
                }
            }
        elif isinstance(value, str):
            field_schema = infer_avro_type(value)
            return {"name": field_name, **field_schema}
        else:
            return {"name": field_name, "type": "string"}  # fallback

    schema = {
        "type": "record",
        "name": name,
        "namespace": "com.example",
        "fields": [
            _process_field(value, key)
            for key, value in template.items()
        ]
    }
    
    return json.dumps(schema, indent=2)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Message producer with schema generation capability')
    parser.add_argument('--schema', action='store_true', 
                       help='Generate and print Avro schema instead of producing messages')
    args = parser.parse_args()

    if args.schema:
        print("Generated Avro Schema:")
        print(generate_avro_schema())
    else:
        try:
            while True:
                send_data()
                time.sleep(1)
        except KeyboardInterrupt:
            print("\nStopping message production.")
            sys.exit(0)