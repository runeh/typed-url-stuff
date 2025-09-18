// Type utilities to extract types from the spec
/**
 * Infers the TypeScript type from a query parameter specification value
 * @template T - The specification value (StringConstructor, NumberConstructor, or readonly string array)
 */
type InferParamType<T> = T extends StringConstructor
  ? string
  : T extends NumberConstructor
  ? number
  : T extends readonly string[]
  ? T[number]
  : never;

/**
 * Converts a query specification object into a typed parameter object
 * @template T - The query specification object
 */
type QueryParams<T extends Record<string, any>> = {
  [K in keyof T]: InferParamType<T[K]>;
};

/**
 * Extracts the original spec from a defineQuerySpec return type
 * @template T - The return type of defineQuerySpec
 */
export type ExtractSpec<T> = T extends {
  spec: infer S extends Record<string, any>;
}
  ? S
  : never;

/**
 * Extracts all parameter names as a union type from a defineQuerySpec return type
 * @template T - The return type of defineQuerySpec
 * @example
 * ```typescript
 * const myQuery = defineQuerySpec({ name: String, age: Number });
 * type Names = ExtractParamNames<typeof myQuery>; // "name" | "age"
 * ```
 */
export type ExtractParamNames<T> = keyof ExtractSpec<T>;

/**
 * Extracts the complete parameter values object type from a defineQuerySpec return type
 * @template T - The return type of defineQuerySpec
 * @example
 * ```typescript
 * const myQuery = defineQuerySpec({ name: String, status: ['active', 'inactive'] });
 * type Values = ExtractParamValues<typeof myQuery>;
 * // { name: string; status: "active" | "inactive" }
 * ```
 */
export type ExtractParamValues<T> = ExtractSpec<T> extends Record<string, any>
  ? QueryParams<ExtractSpec<T>>
  : never;

/**
 * Extracts the value type for a specific parameter from a defineQuerySpec return type
 * @template T - The return type of defineQuerySpec
 * @template K - The parameter name to extract
 * @example
 * ```typescript
 * const myQuery = defineQuerySpec({ status: ['active', 'inactive'] });
 * type StatusType = ExtractParamValue<typeof myQuery, 'status'>;
 * // "active" | "inactive"
 * ```
 */
export type ExtractParamValue<
  T,
  K extends ExtractParamNames<T>
> = ExtractParamValues<T>[K];

/**
 * Enhanced defineQuerySpec that returns everything you need
 * @param spec - Query specification object with parameter definitions
 * @returns Object with type-safe utilities for working with query parameters
 */
export function defineQuerySpec<
  const T extends Record<
    string,
    StringConstructor | NumberConstructor | readonly string[]
  >
>(spec: T) {
  type Names = keyof T;
  type Params = QueryParams<T>;

  return {
    /** The original specification object */
    spec,

    /** Parameter names as an array for iteration */
    namesList: Object.keys(spec) as Names[],

    /** Parameter names as object properties for easy access */
    names: Object.fromEntries(Object.keys(spec).map((key) => [key, key])) as {
      [K in Names]: K;
    },

    /**
     * Type predicate to check if a string is a valid parameter name
     * @param name - String to check
     * @returns True if name is a valid parameter name
     */
    isValidName(name: string): name is Names & string {
      return (name as keyof T) in spec;
    },

    /**
     * Get a parameter name with type safety (prevents typos)
     * @param name - Parameter name
     * @returns The same parameter name, but with type checking
     */
    getName<K extends Names>(name: K): K {
      return name;
    },

    /**
     * Type predicate to validate parameter values against the spec
     * @param key - Parameter name
     * @param value - Value to validate
     * @returns True if value is valid for the given parameter
     */
    isValidValue<K extends Names>(key: K, value: unknown): value is Params[K] {
      const validator = spec[key];

      if (validator === String) {
        return typeof value === "string";
      } else if (validator === Number) {
        return typeof value === "number" && !isNaN(value);
      } else if (Array.isArray(validator)) {
        return validator.includes(value as any);
      }

      return false;
    },

    /** Type-safe URLSearchParams utilities */
    urlHelpers: {
      /**
       * Set a query parameter with type safety and validation
       * @param params - URLSearchParams instance
       * @param name - Parameter name
       * @param value - Parameter value (typed based on spec)
       */
      set<K extends Names>(params: URLSearchParams, name: K, value: Params[K]) {
        params.set(name as string, String(value));
      },

      /**
       * Get a query parameter with type safety and validation
       * @param params - URLSearchParams instance
       * @param name - Parameter name
       * @returns Parsed and validated value, or null if invalid/missing
       */
      get<K extends Names>(params: URLSearchParams, name: K): Params[K] | null {
        const rawValue = params.get(name as string);
        if (rawValue === null) return null;

        const validator = spec[name];

        if (validator === String) {
          return rawValue as Params[K];
        } else if (validator === Number) {
          const num = Number(rawValue);
          return !isNaN(num) ? (num as Params[K]) : null;
        } else if (Array.isArray(validator)) {
          return validator.includes(rawValue as any)
            ? (rawValue as Params[K])
            : null;
        }

        return null;
      },

      /**
       * Get all values for a parameter with type safety and validation
       * @param params - URLSearchParams instance
       * @param name - Parameter name
       * @returns Array of parsed and validated values
       */
      getAll<K extends Names>(params: URLSearchParams, name: K): Params[K][] {
        const rawValues = params.getAll(name as string);
        const validator = spec[name];

        if (validator === String) {
          return rawValues as Params[K][];
        } else if (validator === Number) {
          return rawValues
            .map((val) => Number(val))
            .filter((num) => !isNaN(num)) as Params[K][];
        } else if (Array.isArray(validator)) {
          return rawValues.filter((val) =>
            validator.includes(val as any)
          ) as Params[K][];
        }

        return [] as Params[K][];
      },

      /**
       * Append a query parameter with type safety
       * @param params - URLSearchParams instance
       * @param name - Parameter name
       * @param value - Parameter value (typed based on spec)
       */
      append<K extends Names>(
        params: URLSearchParams,
        name: K,
        value: Params[K]
      ) {
        params.append(name as string, String(value));
      },

      /**
       * Check if a parameter exists
       * @param params - URLSearchParams instance
       * @param name - Parameter name
       * @returns True if parameter exists
       */
      has(params: URLSearchParams, name: Names): boolean {
        return params.has(name as string);
      },

      /**
       * Delete a parameter or specific parameter value
       * @param params - URLSearchParams instance
       * @param name - Parameter name
       * @param value - Optional specific value to delete
       */
      delete<K extends Names>(
        params: URLSearchParams,
        name: K,
        value?: Params[K]
      ) {
        if (value !== undefined) {
          params.delete(name as string, String(value));
        } else {
          params.delete(name as string);
        }
      },

      /**
       * Clear all parameters defined in the spec while leaving other parameters untouched
       * @param params - URLSearchParams instance
       */
      clearAll(params: URLSearchParams) {
        Object.keys(spec).forEach((key) => {
          params.delete(key);
        });
      },
    },
  };
}
