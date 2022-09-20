import { fromRedisHash } from "$lib/transformer";
import { Schema } from "$lib/schema";
import { Entity } from "$lib/entity/entity";
import { A_DATE, A_DATE_EPOCH_STRING, A_NUMBER, A_NUMBER_STRING, A_POINT, A_POINT_STRING, A_STRING, SOME_STRINGS, SOME_STRINGS_JOINED, SOME_TEXT } from "../../helpers/example-data";
import { RedisHashData } from "$lib/client";

describe("#fromRedisHash", () => {

  class TestEntity extends Entity {}
  let schema: Schema<TestEntity>;
  let actual: object;

  beforeEach(() => {
    schema = new Schema(TestEntity, {
      aBoolean: { type: 'boolean' },
      anotherBoolean: { type: 'boolean', alias: 'anAliasedBoolean' },
      aNumber: { type: 'number' },
      anotherNumber: { type: 'number', alias: 'anAliasedNumber' },
      aDate: { type: 'date' },
      anotherDate: { type: 'date', alias: 'anAliasedDate' },
      aPoint: { type: 'point' },
      anotherPoint: { type: 'point', alias: 'anAliasedPoint' },
      aString: { type: 'string' },
      anotherString: { type: 'string', alias: 'anAliasedString' },
      aStringArray: { type: 'string[]' },
      aSeparatedStringArray: { type: 'string[]', separator: ',' },
      anotherStringArray: { type: 'string[]', alias: 'anAliasedStringArray' },
      someText: { type: 'text' },
      someOtherText: { type: 'text', alias: 'someAliasedText' }
    })
  })

  describe("when converting an empty hash", () => {
    beforeEach(() => {
      actual = fromRedisHash(schema, {})
    })

    it("returns an empty object", () => {
      expect(actual).toEqual({})
    })
  })

  describe("when converting data not described in the schema", () => {
    beforeEach(() => {
      actual = fromRedisHash(schema, {
        aTrueBoolean: '1', aFalseBoolean: '0',
        aMissingNumber: A_NUMBER_STRING, aMissingDate: A_DATE_EPOCH_STRING,
        aMissingPoint: A_POINT_STRING, aMissingString: A_STRING
      })
    })

    it.each([
      ["leaves a converted true boolean as a string", { aTrueBoolean: '1' }],
      ["leaves a converted false boolean as a string", { aFalseBoolean: '0' }],
      ["leaves a converted number as a string", { aMissingNumber: A_NUMBER_STRING }],
      ["leaves a converted date as an epoch string", { aMissingDate: A_DATE_EPOCH_STRING }],
      ["leaves a converted point as a string", { aMissingPoint: A_POINT_STRING }],
      ["leaves a string as a string", { aMissingString: A_STRING }]
    ])('%s', (_, expected) => {
      expect(actual).toEqual(expect.objectContaining(expected))
    })
  })

  describe("when converting data that *is* described in the schema", () => {

    it.each([

      // boolean
      ["converts a true boolean from a string", { aBoolean: '1' }, { aBoolean: true }],
      ["converts a false boolean from a string", { aBoolean: '0' }, { aBoolean: false }],
      ["converts an aliased boolean from a string", { anAliasedBoolean: '1' }, { anotherBoolean: true }],

      // number
      ["converts a number from a string", { aNumber: A_NUMBER_STRING }, { aNumber: A_NUMBER }],
      ["converts an aliased number from a string", { anAliasedNumber: A_NUMBER_STRING }, { anotherNumber: A_NUMBER }],

      // date
      ["converts a date from an epoch string", { aDate: A_DATE_EPOCH_STRING }, { aDate: A_DATE }],
      ["converts an aliased date from an epoch string", { anAliasedDate: A_DATE_EPOCH_STRING }, { anotherDate: A_DATE }],

      // point
      ["converts a point from a point string", { aPoint: A_POINT_STRING }, { aPoint: A_POINT }],
      ["converts an aliased point from a point string", { anAliasedPoint: A_POINT_STRING }, { anotherPoint: A_POINT }],

      // string
      ["leaves a string as a string", { aString: A_STRING }, { aString: A_STRING }],
      ["leaves an aliased string as a string", { anAliasedString: A_STRING }, { anotherString: A_STRING }],

      // text
      ["converts a string in a text from a string", { someText: SOME_TEXT }, { someText: SOME_TEXT }],
      ["converts an aliased string in a text from a string", { someAliasedText: SOME_TEXT }, { someOtherText: SOME_TEXT }],

      // string[]
      ["converts a string[] from a delimited string", { aStringArray: SOME_STRINGS_JOINED }, { aStringArray: SOME_STRINGS }],
      ["converts an aliased string[] from a delimited string", { anAliasedStringArray: SOME_STRINGS_JOINED }, { anotherStringArray: SOME_STRINGS }],
      ["converts a string[] from a delimited string with a custom delimiter", { aSeparatedStringArray: SOME_STRINGS.join(',') }, { aSeparatedStringArray: SOME_STRINGS }]

    ])('%s', (_, hashData: RedisHashData, expected) => {
      const actual = fromRedisHash(schema, hashData)
      expect(actual).not.toBe(hashData)
      expect(actual).toEqual(expected)
    })

    it.each([
      ["complains when a boolean is invalid", { aBoolean: 'NOT_A_BOOLEAN' }, `Expected a value of '1' or '0' from Redis for a boolean but received: "NOT_A_BOOLEAN"`],
      ["complains when a number is not numeric", { aNumber: 'NOT_A_NUMBER' }, `Expected a string containing a number from Redis but received: "NOT_A_NUMBER"`],
      ["complains when a date is not an epoch string", { aDate: 'NOT_A_NUMBER' }, `Expected an string containing a epoch date from Redis but received: "NOT_A_NUMBER"`],
      ["complains when a point is not a point string", { aPoint: 'NOT_A_POINT' }, `Expected a point string from Redis but received: "NOT_A_POINT"`],
    ])('%s', (_, hashData: RedisHashData, expectedException) => {
      expect(() => fromRedisHash(schema, hashData)).toThrow(expectedException)
    })
  })
})
