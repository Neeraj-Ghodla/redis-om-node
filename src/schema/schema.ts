import { ulid } from 'ulid'
import { SearchDataStructure } from '../client';

import Entity from "../entity/entity";

import { EntityConstructor } from '../entity/entity-types';
import SchemaBuilder from './schema-builder';
import { FieldDefinition, IdStrategy, SchemaDefinition } from './schema-definitions';
import { SchemaOptions } from './schema-options';

export default class Schema<TEntity extends Entity> {
  readonly entityCtor: EntityConstructor<TEntity>;
  readonly definition: SchemaDefinition;
  private options?: SchemaOptions;

  constructor(ctor: EntityConstructor<TEntity>, schemaDef: SchemaDefinition, options?: SchemaOptions ) {
    this.entityCtor = ctor;
    this.definition = schemaDef;
    this.options = options;

    this.validateOptions();
    this.defineProperties();
  }

  get prefix(): string { return this.options?.prefix ?? this.entityCtor.name; }
  get indexName(): string { return this.options?.indexName ?? `${this.prefix}:index`; }
  get dataStructure(): SearchDataStructure { return this.options?.dataStructure ?? 'HASH'; }
  get redisSchema(): string[] { return new SchemaBuilder(this).redisSchema; }

  generateId(): string {
    let ulidStrategy: IdStrategy = () => ulid();
    return (this.options?.idStrategy ?? ulidStrategy)();
  }

  private defineProperties() {
    let entityName = this.entityCtor.name;
    for (let field in this.definition) {
      this.validateFieldDef(field);

      let fieldDef: FieldDefinition = this.definition[field];
      let fieldAlias = fieldDef.alias ?? field;

      Object.defineProperty(this.entityCtor.prototype, field, {
        configurable: true,
        get: function (): any {
          return this.entityData[fieldAlias] ?? null;
        },
        set: function(value: any): void {
          if (value === undefined) {
            throw Error(`Property '${field}' on entity of type '${entityName}' cannot be set to undefined. Use null instead.`);
          } else if (value === null) {
            delete this.entityData[fieldAlias];
          } else {
            this.entityData[fieldAlias] = value;
          }
        }
      });
    }
  }

  private validateOptions() {
    if (!['HASH', 'JSON'].includes(this.dataStructure))
      throw Error(`'${this.dataStructure}' in an invalid data structure. Valid data structures are 'HASH' and 'JSON'.`);

    if (this.options?.idStrategy && !(this.options.idStrategy instanceof Function))
      throw Error("ID strategy must be a function that takes no arguments and returns a string.");
  
    if (this.prefix === '') throw Error(`Prefix must be a non-empty string.`);
    if (this.indexName === '') throw Error(`Index name must be a non-empty string.`);
  }

  private validateFieldDef(field: string) {
    let fieldDef: FieldDefinition = this.definition[field];
    if (!['array', 'boolean', 'number', 'string'].includes(fieldDef.type))
      throw Error(`The field '${field}' is configured with a type of '${fieldDef.type}'. Valid types include 'array', 'boolean', 'number', and 'string'.`);
  }
}