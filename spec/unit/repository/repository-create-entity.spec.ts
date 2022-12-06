import '../helpers/mock-client'

import { Client } from '$lib/client'
import { Entity } from '$lib/entity'
import { Repository } from '$lib/repository'
import { Schema, SchemaDefinition } from '$lib/schema'

import { A_NUMBER, A_STRING } from '../../helpers/example-data'

const aSimpleSchemaDef: SchemaDefinition = {
  aString: { type: 'string' },
  aNumber: { type: 'number' },
  aBoolean: { type: 'boolean' }
}

const simpleSchema = new Schema("SimpleEntity", aSimpleSchemaDef, { dataStructure: 'HASH' })

const EMPTY_ENTITY_DATA_WITH_ID = { entityId: 'foo', keyName: 'key:bar' }
const ENTITY_DATA = { aString: A_STRING, aNumber: A_NUMBER, aBoolean: true }

const ULID_REGEX = /^[0-9ABCDEFGHJKMNPQRSTVWXYZ]{26}$/
const KEYNAME_REGEX = /^SimpleEntity:[0-9ABCDEFGHJKMNPQRSTVWXYZ]{26}$/

describe("Repository", () => {

  let client: Client
  let repository: Repository
  let entity: Entity

  describe('#createEntity', () => {

    beforeAll(() => { client = new Client() })
    beforeEach(() => { repository = new Repository(simpleSchema, client) })

    describe("when creating an entity", () => {
      beforeEach(() => { entity = repository.createEntity() })

      it("has a generated entity id", () => expect(entity.entityId).toMatch(ULID_REGEX))
      it("has a keyname based on the entity id", () => expect(entity.keyName).toMatch(KEYNAME_REGEX))
      it("is otherwise empty", () => {
        expect(Object.keys(entity)).toHaveLength(2)
        expect(Object.keys(entity)).toEqual(expect.arrayContaining(['entityId', 'keyName']))
      })
    })

    describe("when creating an entity with a provided id", () => {
      beforeEach(() => { entity = repository.createEntity('foo') })

      it("has the provided entity id", () => expect(entity.entityId).toBe('foo'))
      it("has a keyname based on the entity id", () => expect(entity.keyName).toBe(`SimpleEntity:foo`))
      it("is otherwise empty", () => {
        expect(Object.keys(entity)).toHaveLength(2)
        expect(Object.keys(entity)).toEqual(expect.arrayContaining(['entityId', 'keyName']))
      })
    })

    describe("when mistakenly creating an entity with an explicitly defined entityId and keyName", () => {
      beforeEach(() => {
        entity = repository.createEntity(EMPTY_ENTITY_DATA_WITH_ID)
      })

      it("has a generated entity id", () => expect(entity.entityId).toMatch(ULID_REGEX))
      it("has a keyname based on the entity id", () => expect(entity.keyName).toMatch(KEYNAME_REGEX))
      it("is otherwise empty", () => {
        expect(Object.keys(entity)).toHaveLength(2)
        expect(Object.keys(entity)).toEqual(expect.arrayContaining(['entityId', 'keyName']))
      })
    })

    describe("when mistakenly creating an entity with an explicitly defined entityId and keyName and a provided id", () => {
      beforeEach(() => {
        entity = repository.createEntity('foo', EMPTY_ENTITY_DATA_WITH_ID)
      })

      it("has the provided entity id", () => expect(entity.entityId).toBe('foo'))
      it("has a keyname based on the entity id", () => expect(entity.keyName).toBe(`SimpleEntity:foo`))
      it("is otherwise empty", () => {
        expect(Object.keys(entity)).toHaveLength(2)
        expect(Object.keys(entity)).toEqual(expect.arrayContaining(['entityId', 'keyName']))
      })
    })

    describe("when creating an entity with data", () => {
      beforeEach(() => {
        entity = repository.createEntity(ENTITY_DATA)
      })

      it("has a generated entity id", () => expect(entity.entityId).toMatch(ULID_REGEX))
      it("has a keyname based on the entity id", () => expect(entity.keyName).toMatch(KEYNAME_REGEX))
      it("has populated properties", () => {
        expect(entity.aString).toBe(A_STRING)
        expect(entity.aNumber).toBe(A_NUMBER)
        expect(entity.aBoolean).toBe(true)
      })
    })

    describe("when creating an entity with data and a provided id", () => {
      beforeEach(() => {
        entity = repository.createEntity('foo', ENTITY_DATA)
      })

      it("has a generated entity id", () => expect(entity.entityId).toBe('foo'))
      it("has a keyname based on the entity id", () => expect(entity.keyName).toBe(`SimpleEntity:foo`))
      it("has populated properties", () => {
        expect(entity.aString).toBe(A_STRING)
        expect(entity.aNumber).toBe(A_NUMBER)
        expect(entity.aBoolean).toBe(true)
      })
    })
  })
})
