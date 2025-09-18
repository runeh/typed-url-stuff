import {
  defineQuerySpec,
  ExtractParamNames,
  ExtractParamValue,
  ExtractParamValues,
} from "./typed-query.ts";

// Learn more at https://docs.deno.com/runtime/manual/examples/module_metadata#concepts
if (import.meta.main) {
  // Usage - everything is inferred!
  const myQuery = defineQuerySpec({
    term: String,
    direction: ["in", "out", "transfer"],
    account: ["savings", "operational", "tax"],
    amount: Number,
  } as const);

  // Extract types from the returned object using utility types
  type MyQueryParamNames = ExtractParamNames<typeof myQuery>;
  // Result: "term" | "direction" | "account" | "amount"

  type MyQueryParamValues = ExtractParamValues<typeof myQuery>;
  // Result: { term: string; direction: "in" | "out" | "transfer"; account: "savings" | "operational" | "tax"; amount: number; }

  type MyDirectionValue = ExtractParamValue<typeof myQuery, "direction">;
  // Result: "in" | "out" | "transfer"

  type MyAccountValue = ExtractParamValue<typeof myQuery, "account">;
  // Result: "savings" | "operational" | "tax"

  // Usage examples:
  const urlParams = new URLSearchParams();

  // Type-safe parameter name access
  const directionParam = myQuery.getName("direction"); // "direction"
  myQuery.urlHelpers.set(urlParams, directionParam, "in");

  // Check if a string is a valid parameter name
  const userInput = "direction";
  if (myQuery.isValidName(userInput)) {
    // userInput is now typed as "term" | "direction" | "account" | "amount"
    myQuery.urlHelpers.set(urlParams, userInput, "out");
  }

  // Validate parameter values
  const someValue: unknown = "transfer";
  if (myQuery.isValidValue("direction", someValue)) {
    // someValue is now typed as "in" | "out" | "transfer"
    console.log(`Valid direction: ${someValue}`);
  }

  // Loop through all parameter names
  myQuery.namesList.forEach((name) => {
    console.log(`Parameter: ${name}`);
    // name is typed as "term" | "direction" | "account" | "amount"
  });

  // Both approaches work:
  const name1 = myQuery.getName("account"); // "account"
  const name2 = myQuery.names.account; // "account"

  // Use either approach for URLSearchParams
  myQuery.urlHelpers.set(urlParams, myQuery.names.direction, "in");
  myQuery.urlHelpers.set(urlParams, myQuery.getName("account"), "savings");

  // Type-safe URLSearchParams operations
  const params = new URLSearchParams();
  myQuery.urlHelpers.set(params, "direction", "in"); // ✅ Type-safe
  myQuery.urlHelpers.set(params, "account", "operational"); // ✅ Type-safe
  myQuery.urlHelpers.set(params, "amount", 100); // ✅ Type-safe

  // Type-safe get with validation
  const direction = myQuery.urlHelpers.get(params, "direction"); // "in" | "out" | "transfer" | null
  const account = myQuery.urlHelpers.get(params, "account"); // "savings" | "operational" | "tax" | null
  const amount = myQuery.urlHelpers.get(params, "amount"); // number | null
  const term = myQuery.urlHelpers.get(params, "term"); // string | null
}
