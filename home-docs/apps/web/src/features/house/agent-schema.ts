/** Small JSON Schema subset shared by discovery and runtime validation. */
export type Schema = {
  type: 'object' | 'array' | 'string' | 'number' | 'boolean';
  properties?: Record<string, Schema>;
  required?: string[];
  additionalProperties?: false;
  items?: Schema;
  enum?: readonly (string | number | boolean)[];
  minimum?: number;
  maximum?: number;
  maxLength?: number;
  maxItems?: number;
};

export class AgentError extends Error {
  constructor(
    public code: 'INVALID_ARGUMENT' | 'NOT_FOUND' | 'UNAVAILABLE',
    message: string,
  ) {
    super(message);
    this.name = 'SmartHomeError';
  }
}

export function validate(value: unknown, schema: Schema, path = 'input'): void {
  const fail = (reason: string): never => {
    throw new AgentError('INVALID_ARGUMENT', `${path}: ${reason}`);
  };
  if (schema.type === 'object') {
    if (value === null || typeof value !== 'object' || Array.isArray(value))
      fail('expected object');
    const object = value as Record<string, unknown>;
    for (const key of schema.required ?? [])
      if (!Object.prototype.hasOwnProperty.call(object, key))
        fail(`missing ${key}`);
    for (const key of Object.keys(object)) {
      if (!Object.prototype.hasOwnProperty.call(schema.properties, key))
        fail(`unknown field ${key}`);
      validate(object[key], schema.properties![key], `${path}.${key}`);
    }
  } else if (schema.type === 'array') {
    if (!Array.isArray(value)) fail('expected array');
    const array = value as unknown[];
    if (schema.maxItems !== undefined && array.length > schema.maxItems)
      fail('too many items');
    array.forEach((item, i) => validate(item, schema.items!, `${path}[${i}]`));
  } else {
    if (typeof value !== schema.type) fail(`expected ${schema.type}`);
    if (typeof value === 'number') {
      if (!Number.isFinite(value)) fail('expected finite number');
      if (schema.minimum !== undefined && value < schema.minimum)
        fail(`minimum ${schema.minimum}`);
      if (schema.maximum !== undefined && value > schema.maximum)
        fail(`maximum ${schema.maximum}`);
    }
    if (
      typeof value === 'string' &&
      schema.maxLength !== undefined &&
      value.length > schema.maxLength
    )
      fail('text too long');
  }
  if (schema.enum && !schema.enum.includes(value as string))
    fail(`expected one of ${schema.enum.join(', ')}`);
}

export const objectSchema = (
  properties: Record<string, Schema>,
  required: string[] = [],
): Schema => ({
  type: 'object',
  properties,
  required,
  additionalProperties: false,
});
export const choice = (values: readonly string[]): Schema => ({
  type: 'string',
  enum: values,
});
