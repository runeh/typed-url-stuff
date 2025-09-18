import { assertEquals } from "@std/assert";
import { defineQuerySpec, ExtractParamNames } from "./typed-query.ts";

/**
 * Utility to enforce that a type extends true.
 * Use this to ensure your type tests evaluate to true.
 */
type Expect<T extends true> = T;

/**
 * Tests if two types are exactly equal.
 * More robust than simple extends checks.
 */
type Equal<ACTUAL, EXPECTED> = (<T>() => T extends ACTUAL ? 1 : 2) extends <
  T
>() => T extends EXPECTED ? 1 : 2
  ? true
  : false;

/**
 * Tests if type T is assignable to type U.
 * Returns true if T can be used wherever U is expected.
 */
type IsAssignable<T, U> = T extends U ? true : false;

/**
 * Tests if type T is NOT assignable to type U.
 * Useful for testing that certain assignments should fail.
 */
type IsNotAssignable<T, U> = T extends U ? false : true;

/**
 * Tests if a type is exactly 'never'.
 */
type IsNever<T> = [T] extends [never] ? true : false;

/**
 * Tests if a type is 'any'.
 */
type IsAny<T> = 0 extends 1 & T ? true : false;

/**
 * Tests if a type is 'unknown'.
 */
type IsUnknown<T> = IsAny<T> extends true
  ? false
  : unknown extends T
  ? true
  : false;

/**
 * Tests if a type is a union type.
 */
type IsUnion<T> = [T] extends [UnionToIntersection<T>] ? false : true;

/**
 * Helper utility to convert union to intersection.
 */
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I
) => void
  ? I
  : never;

/**
 * Tests if a type has exactly the specified keys (no more, no less).
 */
type HasExactKeys<T, K extends PropertyKey> = Equal<keyof T, K>;

/**
 * Tests if a type has at least the specified keys.
 */
type HasKeys<T, K extends PropertyKey> = K extends keyof T ? true : false;

/**
 * Tests if a type is an array.
 */
type IsArray<T> = T extends readonly unknown[] ? true : false;

/**
 * Tests if a type is a function.
 */
type IsFunction<T> = T extends (...args: any[]) => any ? true : false;

/**
 * Tests if a type is a Promise.
 */
type IsPromise<T> = T extends Promise<any> ? true : false;

/**
 * Tests if a function can be called with the given argument types.
 * Usage: CanCallWith<typeof myFunc, [string, number]>
 */
type CanCallWith<
  TFunc extends (...args: any[]) => any,
  TArgs extends readonly unknown[]
> = TArgs extends Parameters<TFunc> ? true : false;

/**
 * Tests if a function CANNOT be called with the given argument types.
 * Usage: CannotCallWith<typeof myFunc, [string, number]>
 */
type CannotCallWith<
  TFunc extends (...args: any[]) => any,
  TArgs extends readonly unknown[]
> = TArgs extends Parameters<TFunc> ? false : true;

// Deno.test("Type Equality Tests", () => {
//   const q = defineQuerySpec({
//     name: String,
//     age: Number,
//     role: ["admin", "user", "intern"],
//   });

//   type TestParamNameEquality = Expect<
//     Equal<ExtractParamNames<typeof q>, "role" | "age" | "name">
//   >;

//   //   // Test exact type equality
//   // type TestStringEquality = Expect<Equal<string, string>>;
//   // type TestNumberEquality = Expect<Equal<number, number>>;
//   // type TestNotEqual = Expect<Equal<Equal<string, number>, false>>;

//   assertEquals(1, 1);
// });

const testSpec = {
  name: String,
  age: Number,
  role: ["admin", "user", "intern"],
};

const q = defineQuerySpec(testSpec);

Deno.test("urlHelpers.get (value level)", () => {
  const p = new URLSearchParams();

  assertEquals(q.urlHelpers.get(p, "age"), null);
  assertEquals(q.urlHelpers.get(p, "name"), null);
  assertEquals(q.urlHelpers.get(p, "role"), null);

  p.set("age", "42");
  p.set("name", "Pelle Parafin");
  p.set("role", "intern");

  assertEquals(q.urlHelpers.get(p, "age"), 42);
  assertEquals(q.urlHelpers.get(p, "name"), "Pelle Parafin");
  assertEquals(q.urlHelpers.get(p, "role"), "intern");

  p.set("age", "fourtytwo");
  p.set("name", "321");
  p.set("role", "bossman");

  assertEquals(q.urlHelpers.get(p, "age"), null);
  // Valid string, so it's allowed.
  assertEquals(q.urlHelpers.get(p, "name"), "321");
  assertEquals(q.urlHelpers.get(p, "role"), null);
});

Deno.test("urlHelpers.get (type level)", () => {
  const p = new URLSearchParams();

  // Make sure we couldn't have called it with a query param that does not
  // exist in the spec.
  type TT1 = Expect<
    CannotCallWith<typeof q.urlHelpers.get, [typeof p, "bad-query-param"]>
  >;

  assertEquals(1, 1);
});

// Deno.test("searchParams: get", async (t) => {

//   await t.step("gets", async (t) => {
//     assertEquals(1, 1);

//     await t.step("nerstert", () => {
//       assertEquals(2, 2);
//     });
//   });

//   await t.step("asdfasdf 2", () => {
//     assertEquals(1, 1);
//   });
// });
