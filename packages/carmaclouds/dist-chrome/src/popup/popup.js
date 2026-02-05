(() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __glob = (map) => (path) => {
    var fn = map[path];
    if (fn)
      return fn();
    throw new Error("Module not found in bundle: " + path);
  };
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  // ../../node_modules/tslib/tslib.es6.mjs
  function __rest(s, e) {
    var t = {};
    for (var p in s)
      if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
      for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
        if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
          t[p[i]] = s[p[i]];
      }
    return t;
  }
  function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P ? value : new P(function(resolve) {
        resolve(value);
      });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  }
  var init_tslib_es6 = __esm({
    "../../node_modules/tslib/tslib.es6.mjs"() {
    }
  });

  // ../../node_modules/@supabase/functions-js/dist/module/helper.js
  var resolveFetch;
  var init_helper = __esm({
    "../../node_modules/@supabase/functions-js/dist/module/helper.js"() {
      resolveFetch = (customFetch) => {
        if (customFetch) {
          return (...args) => customFetch(...args);
        }
        return (...args) => fetch(...args);
      };
    }
  });

  // ../../node_modules/@supabase/functions-js/dist/module/types.js
  var FunctionsError, FunctionsFetchError, FunctionsRelayError, FunctionsHttpError, FunctionRegion;
  var init_types = __esm({
    "../../node_modules/@supabase/functions-js/dist/module/types.js"() {
      FunctionsError = class extends Error {
        constructor(message, name = "FunctionsError", context) {
          super(message);
          this.name = name;
          this.context = context;
        }
      };
      FunctionsFetchError = class extends FunctionsError {
        constructor(context) {
          super("Failed to send a request to the Edge Function", "FunctionsFetchError", context);
        }
      };
      FunctionsRelayError = class extends FunctionsError {
        constructor(context) {
          super("Relay Error invoking the Edge Function", "FunctionsRelayError", context);
        }
      };
      FunctionsHttpError = class extends FunctionsError {
        constructor(context) {
          super("Edge Function returned a non-2xx status code", "FunctionsHttpError", context);
        }
      };
      (function(FunctionRegion2) {
        FunctionRegion2["Any"] = "any";
        FunctionRegion2["ApNortheast1"] = "ap-northeast-1";
        FunctionRegion2["ApNortheast2"] = "ap-northeast-2";
        FunctionRegion2["ApSouth1"] = "ap-south-1";
        FunctionRegion2["ApSoutheast1"] = "ap-southeast-1";
        FunctionRegion2["ApSoutheast2"] = "ap-southeast-2";
        FunctionRegion2["CaCentral1"] = "ca-central-1";
        FunctionRegion2["EuCentral1"] = "eu-central-1";
        FunctionRegion2["EuWest1"] = "eu-west-1";
        FunctionRegion2["EuWest2"] = "eu-west-2";
        FunctionRegion2["EuWest3"] = "eu-west-3";
        FunctionRegion2["SaEast1"] = "sa-east-1";
        FunctionRegion2["UsEast1"] = "us-east-1";
        FunctionRegion2["UsWest1"] = "us-west-1";
        FunctionRegion2["UsWest2"] = "us-west-2";
      })(FunctionRegion || (FunctionRegion = {}));
    }
  });

  // ../../node_modules/@supabase/functions-js/dist/module/FunctionsClient.js
  var FunctionsClient;
  var init_FunctionsClient = __esm({
    "../../node_modules/@supabase/functions-js/dist/module/FunctionsClient.js"() {
      init_tslib_es6();
      init_helper();
      init_types();
      FunctionsClient = class {
        /**
         * Creates a new Functions client bound to an Edge Functions URL.
         *
         * @example
         * ```ts
         * import { FunctionsClient, FunctionRegion } from '@supabase/functions-js'
         *
         * const functions = new FunctionsClient('https://xyzcompany.supabase.co/functions/v1', {
         *   headers: { apikey: 'public-anon-key' },
         *   region: FunctionRegion.UsEast1,
         * })
         * ```
         */
        constructor(url, { headers = {}, customFetch, region = FunctionRegion.Any } = {}) {
          this.url = url;
          this.headers = headers;
          this.region = region;
          this.fetch = resolveFetch(customFetch);
        }
        /**
         * Updates the authorization header
         * @param token - the new jwt token sent in the authorisation header
         * @example
         * ```ts
         * functions.setAuth(session.access_token)
         * ```
         */
        setAuth(token) {
          this.headers.Authorization = `Bearer ${token}`;
        }
        /**
         * Invokes a function
         * @param functionName - The name of the Function to invoke.
         * @param options - Options for invoking the Function.
         * @example
         * ```ts
         * const { data, error } = await functions.invoke('hello-world', {
         *   body: { name: 'Ada' },
         * })
         * ```
         */
        invoke(functionName_1) {
          return __awaiter(this, arguments, void 0, function* (functionName, options = {}) {
            var _a;
            let timeoutId;
            let timeoutController;
            try {
              const { headers, method, body: functionArgs, signal, timeout } = options;
              let _headers = {};
              let { region } = options;
              if (!region) {
                region = this.region;
              }
              const url = new URL(`${this.url}/${functionName}`);
              if (region && region !== "any") {
                _headers["x-region"] = region;
                url.searchParams.set("forceFunctionRegion", region);
              }
              let body;
              if (functionArgs && (headers && !Object.prototype.hasOwnProperty.call(headers, "Content-Type") || !headers)) {
                if (typeof Blob !== "undefined" && functionArgs instanceof Blob || functionArgs instanceof ArrayBuffer) {
                  _headers["Content-Type"] = "application/octet-stream";
                  body = functionArgs;
                } else if (typeof functionArgs === "string") {
                  _headers["Content-Type"] = "text/plain";
                  body = functionArgs;
                } else if (typeof FormData !== "undefined" && functionArgs instanceof FormData) {
                  body = functionArgs;
                } else {
                  _headers["Content-Type"] = "application/json";
                  body = JSON.stringify(functionArgs);
                }
              } else {
                if (functionArgs && typeof functionArgs !== "string" && !(typeof Blob !== "undefined" && functionArgs instanceof Blob) && !(functionArgs instanceof ArrayBuffer) && !(typeof FormData !== "undefined" && functionArgs instanceof FormData)) {
                  body = JSON.stringify(functionArgs);
                } else {
                  body = functionArgs;
                }
              }
              let effectiveSignal = signal;
              if (timeout) {
                timeoutController = new AbortController();
                timeoutId = setTimeout(() => timeoutController.abort(), timeout);
                if (signal) {
                  effectiveSignal = timeoutController.signal;
                  signal.addEventListener("abort", () => timeoutController.abort());
                } else {
                  effectiveSignal = timeoutController.signal;
                }
              }
              const response = yield this.fetch(url.toString(), {
                method: method || "POST",
                // headers priority is (high to low):
                // 1. invoke-level headers
                // 2. client-level headers
                // 3. default Content-Type header
                headers: Object.assign(Object.assign(Object.assign({}, _headers), this.headers), headers),
                body,
                signal: effectiveSignal
              }).catch((fetchError) => {
                throw new FunctionsFetchError(fetchError);
              });
              const isRelayError = response.headers.get("x-relay-error");
              if (isRelayError && isRelayError === "true") {
                throw new FunctionsRelayError(response);
              }
              if (!response.ok) {
                throw new FunctionsHttpError(response);
              }
              let responseType = ((_a = response.headers.get("Content-Type")) !== null && _a !== void 0 ? _a : "text/plain").split(";")[0].trim();
              let data;
              if (responseType === "application/json") {
                data = yield response.json();
              } else if (responseType === "application/octet-stream" || responseType === "application/pdf") {
                data = yield response.blob();
              } else if (responseType === "text/event-stream") {
                data = response;
              } else if (responseType === "multipart/form-data") {
                data = yield response.formData();
              } else {
                data = yield response.text();
              }
              return { data, error: null, response };
            } catch (error) {
              return {
                data: null,
                error,
                response: error instanceof FunctionsHttpError || error instanceof FunctionsRelayError ? error.context : void 0
              };
            } finally {
              if (timeoutId) {
                clearTimeout(timeoutId);
              }
            }
          });
        }
      };
    }
  });

  // ../../node_modules/@supabase/functions-js/dist/module/index.js
  var init_module = __esm({
    "../../node_modules/@supabase/functions-js/dist/module/index.js"() {
      init_FunctionsClient();
    }
  });

  // ../../node_modules/@supabase/postgrest-js/dist/index.mjs
  var PostgrestError, PostgrestBuilder, PostgrestTransformBuilder, PostgrestReservedCharsRegexp, PostgrestFilterBuilder, PostgrestQueryBuilder, PostgrestClient;
  var init_dist = __esm({
    "../../node_modules/@supabase/postgrest-js/dist/index.mjs"() {
      PostgrestError = class extends Error {
        /**
        * @example
        * ```ts
        * import PostgrestError from '@supabase/postgrest-js'
        *
        * throw new PostgrestError({
        *   message: 'Row level security prevented the request',
        *   details: 'RLS denied the insert',
        *   hint: 'Check your policies',
        *   code: 'PGRST301',
        * })
        * ```
        */
        constructor(context) {
          super(context.message);
          this.name = "PostgrestError";
          this.details = context.details;
          this.hint = context.hint;
          this.code = context.code;
        }
      };
      PostgrestBuilder = class {
        /**
        * Creates a builder configured for a specific PostgREST request.
        *
        * @example
        * ```ts
        * import PostgrestQueryBuilder from '@supabase/postgrest-js'
        *
        * const builder = new PostgrestQueryBuilder(
        *   new URL('https://xyzcompany.supabase.co/rest/v1/users'),
        *   { headers: new Headers({ apikey: 'public-anon-key' }) }
        * )
        * ```
        */
        constructor(builder) {
          var _builder$shouldThrowO, _builder$isMaybeSingl;
          this.shouldThrowOnError = false;
          this.method = builder.method;
          this.url = builder.url;
          this.headers = new Headers(builder.headers);
          this.schema = builder.schema;
          this.body = builder.body;
          this.shouldThrowOnError = (_builder$shouldThrowO = builder.shouldThrowOnError) !== null && _builder$shouldThrowO !== void 0 ? _builder$shouldThrowO : false;
          this.signal = builder.signal;
          this.isMaybeSingle = (_builder$isMaybeSingl = builder.isMaybeSingle) !== null && _builder$isMaybeSingl !== void 0 ? _builder$isMaybeSingl : false;
          if (builder.fetch)
            this.fetch = builder.fetch;
          else
            this.fetch = fetch;
        }
        /**
        * If there's an error with the query, throwOnError will reject the promise by
        * throwing the error instead of returning it as part of a successful response.
        *
        * {@link https://github.com/supabase/supabase-js/issues/92}
        */
        throwOnError() {
          this.shouldThrowOnError = true;
          return this;
        }
        /**
        * Set an HTTP header for the request.
        */
        setHeader(name, value) {
          this.headers = new Headers(this.headers);
          this.headers.set(name, value);
          return this;
        }
        then(onfulfilled, onrejected) {
          var _this = this;
          if (this.schema === void 0) {
          } else if (["GET", "HEAD"].includes(this.method))
            this.headers.set("Accept-Profile", this.schema);
          else
            this.headers.set("Content-Profile", this.schema);
          if (this.method !== "GET" && this.method !== "HEAD")
            this.headers.set("Content-Type", "application/json");
          const _fetch = this.fetch;
          let res = _fetch(this.url.toString(), {
            method: this.method,
            headers: this.headers,
            body: JSON.stringify(this.body),
            signal: this.signal
          }).then(async (res$1) => {
            let error = null;
            let data = null;
            let count = null;
            let status = res$1.status;
            let statusText = res$1.statusText;
            if (res$1.ok) {
              var _this$headers$get2, _res$headers$get;
              if (_this.method !== "HEAD") {
                var _this$headers$get;
                const body = await res$1.text();
                if (body === "") {
                } else if (_this.headers.get("Accept") === "text/csv")
                  data = body;
                else if (_this.headers.get("Accept") && ((_this$headers$get = _this.headers.get("Accept")) === null || _this$headers$get === void 0 ? void 0 : _this$headers$get.includes("application/vnd.pgrst.plan+text")))
                  data = body;
                else
                  data = JSON.parse(body);
              }
              const countHeader = (_this$headers$get2 = _this.headers.get("Prefer")) === null || _this$headers$get2 === void 0 ? void 0 : _this$headers$get2.match(/count=(exact|planned|estimated)/);
              const contentRange = (_res$headers$get = res$1.headers.get("content-range")) === null || _res$headers$get === void 0 ? void 0 : _res$headers$get.split("/");
              if (countHeader && contentRange && contentRange.length > 1)
                count = parseInt(contentRange[1]);
              if (_this.isMaybeSingle && _this.method === "GET" && Array.isArray(data))
                if (data.length > 1) {
                  error = {
                    code: "PGRST116",
                    details: `Results contain ${data.length} rows, application/vnd.pgrst.object+json requires 1 row`,
                    hint: null,
                    message: "JSON object requested, multiple (or no) rows returned"
                  };
                  data = null;
                  count = null;
                  status = 406;
                  statusText = "Not Acceptable";
                } else if (data.length === 1)
                  data = data[0];
                else
                  data = null;
            } else {
              var _error$details;
              const body = await res$1.text();
              try {
                error = JSON.parse(body);
                if (Array.isArray(error) && res$1.status === 404) {
                  data = [];
                  error = null;
                  status = 200;
                  statusText = "OK";
                }
              } catch (_unused) {
                if (res$1.status === 404 && body === "") {
                  status = 204;
                  statusText = "No Content";
                } else
                  error = { message: body };
              }
              if (error && _this.isMaybeSingle && (error === null || error === void 0 || (_error$details = error.details) === null || _error$details === void 0 ? void 0 : _error$details.includes("0 rows"))) {
                error = null;
                status = 200;
                statusText = "OK";
              }
              if (error && _this.shouldThrowOnError)
                throw new PostgrestError(error);
            }
            return {
              error,
              data,
              count,
              status,
              statusText
            };
          });
          if (!this.shouldThrowOnError)
            res = res.catch((fetchError) => {
              var _fetchError$name2;
              let errorDetails = "";
              const cause = fetchError === null || fetchError === void 0 ? void 0 : fetchError.cause;
              if (cause) {
                var _cause$message, _cause$code, _fetchError$name, _cause$name;
                const causeMessage = (_cause$message = cause === null || cause === void 0 ? void 0 : cause.message) !== null && _cause$message !== void 0 ? _cause$message : "";
                const causeCode = (_cause$code = cause === null || cause === void 0 ? void 0 : cause.code) !== null && _cause$code !== void 0 ? _cause$code : "";
                errorDetails = `${(_fetchError$name = fetchError === null || fetchError === void 0 ? void 0 : fetchError.name) !== null && _fetchError$name !== void 0 ? _fetchError$name : "FetchError"}: ${fetchError === null || fetchError === void 0 ? void 0 : fetchError.message}`;
                errorDetails += `

Caused by: ${(_cause$name = cause === null || cause === void 0 ? void 0 : cause.name) !== null && _cause$name !== void 0 ? _cause$name : "Error"}: ${causeMessage}`;
                if (causeCode)
                  errorDetails += ` (${causeCode})`;
                if (cause === null || cause === void 0 ? void 0 : cause.stack)
                  errorDetails += `
${cause.stack}`;
              } else {
                var _fetchError$stack;
                errorDetails = (_fetchError$stack = fetchError === null || fetchError === void 0 ? void 0 : fetchError.stack) !== null && _fetchError$stack !== void 0 ? _fetchError$stack : "";
              }
              return {
                error: {
                  message: `${(_fetchError$name2 = fetchError === null || fetchError === void 0 ? void 0 : fetchError.name) !== null && _fetchError$name2 !== void 0 ? _fetchError$name2 : "FetchError"}: ${fetchError === null || fetchError === void 0 ? void 0 : fetchError.message}`,
                  details: errorDetails,
                  hint: "",
                  code: ""
                },
                data: null,
                count: null,
                status: 0,
                statusText: ""
              };
            });
          return res.then(onfulfilled, onrejected);
        }
        /**
        * Override the type of the returned `data`.
        *
        * @typeParam NewResult - The new result type to override with
        * @deprecated Use overrideTypes<yourType, { merge: false }>() method at the end of your call chain instead
        */
        returns() {
          return this;
        }
        /**
        * Override the type of the returned `data` field in the response.
        *
        * @typeParam NewResult - The new type to cast the response data to
        * @typeParam Options - Optional type configuration (defaults to { merge: true })
        * @typeParam Options.merge - When true, merges the new type with existing return type. When false, replaces the existing types entirely (defaults to true)
        * @example
        * ```typescript
        * // Merge with existing types (default behavior)
        * const query = supabase
        *   .from('users')
        *   .select()
        *   .overrideTypes<{ custom_field: string }>()
        *
        * // Replace existing types completely
        * const replaceQuery = supabase
        *   .from('users')
        *   .select()
        *   .overrideTypes<{ id: number; name: string }, { merge: false }>()
        * ```
        * @returns A PostgrestBuilder instance with the new type
        */
        overrideTypes() {
          return this;
        }
      };
      PostgrestTransformBuilder = class extends PostgrestBuilder {
        /**
        * Perform a SELECT on the query result.
        *
        * By default, `.insert()`, `.update()`, `.upsert()`, and `.delete()` do not
        * return modified rows. By calling this method, modified rows are returned in
        * `data`.
        *
        * @param columns - The columns to retrieve, separated by commas
        */
        select(columns) {
          let quoted = false;
          const cleanedColumns = (columns !== null && columns !== void 0 ? columns : "*").split("").map((c) => {
            if (/\s/.test(c) && !quoted)
              return "";
            if (c === '"')
              quoted = !quoted;
            return c;
          }).join("");
          this.url.searchParams.set("select", cleanedColumns);
          this.headers.append("Prefer", "return=representation");
          return this;
        }
        /**
        * Order the query result by `column`.
        *
        * You can call this method multiple times to order by multiple columns.
        *
        * You can order referenced tables, but it only affects the ordering of the
        * parent table if you use `!inner` in the query.
        *
        * @param column - The column to order by
        * @param options - Named parameters
        * @param options.ascending - If `true`, the result will be in ascending order
        * @param options.nullsFirst - If `true`, `null`s appear first. If `false`,
        * `null`s appear last.
        * @param options.referencedTable - Set this to order a referenced table by
        * its columns
        * @param options.foreignTable - Deprecated, use `options.referencedTable`
        * instead
        */
        order(column, { ascending = true, nullsFirst, foreignTable, referencedTable = foreignTable } = {}) {
          const key = referencedTable ? `${referencedTable}.order` : "order";
          const existingOrder = this.url.searchParams.get(key);
          this.url.searchParams.set(key, `${existingOrder ? `${existingOrder},` : ""}${column}.${ascending ? "asc" : "desc"}${nullsFirst === void 0 ? "" : nullsFirst ? ".nullsfirst" : ".nullslast"}`);
          return this;
        }
        /**
        * Limit the query result by `count`.
        *
        * @param count - The maximum number of rows to return
        * @param options - Named parameters
        * @param options.referencedTable - Set this to limit rows of referenced
        * tables instead of the parent table
        * @param options.foreignTable - Deprecated, use `options.referencedTable`
        * instead
        */
        limit(count, { foreignTable, referencedTable = foreignTable } = {}) {
          const key = typeof referencedTable === "undefined" ? "limit" : `${referencedTable}.limit`;
          this.url.searchParams.set(key, `${count}`);
          return this;
        }
        /**
        * Limit the query result by starting at an offset `from` and ending at the offset `to`.
        * Only records within this range are returned.
        * This respects the query order and if there is no order clause the range could behave unexpectedly.
        * The `from` and `to` values are 0-based and inclusive: `range(1, 3)` will include the second, third
        * and fourth rows of the query.
        *
        * @param from - The starting index from which to limit the result
        * @param to - The last index to which to limit the result
        * @param options - Named parameters
        * @param options.referencedTable - Set this to limit rows of referenced
        * tables instead of the parent table
        * @param options.foreignTable - Deprecated, use `options.referencedTable`
        * instead
        */
        range(from, to, { foreignTable, referencedTable = foreignTable } = {}) {
          const keyOffset = typeof referencedTable === "undefined" ? "offset" : `${referencedTable}.offset`;
          const keyLimit = typeof referencedTable === "undefined" ? "limit" : `${referencedTable}.limit`;
          this.url.searchParams.set(keyOffset, `${from}`);
          this.url.searchParams.set(keyLimit, `${to - from + 1}`);
          return this;
        }
        /**
        * Set the AbortSignal for the fetch request.
        *
        * @param signal - The AbortSignal to use for the fetch request
        */
        abortSignal(signal) {
          this.signal = signal;
          return this;
        }
        /**
        * Return `data` as a single object instead of an array of objects.
        *
        * Query result must be one row (e.g. using `.limit(1)`), otherwise this
        * returns an error.
        */
        single() {
          this.headers.set("Accept", "application/vnd.pgrst.object+json");
          return this;
        }
        /**
        * Return `data` as a single object instead of an array of objects.
        *
        * Query result must be zero or one row (e.g. using `.limit(1)`), otherwise
        * this returns an error.
        */
        maybeSingle() {
          if (this.method === "GET")
            this.headers.set("Accept", "application/json");
          else
            this.headers.set("Accept", "application/vnd.pgrst.object+json");
          this.isMaybeSingle = true;
          return this;
        }
        /**
        * Return `data` as a string in CSV format.
        */
        csv() {
          this.headers.set("Accept", "text/csv");
          return this;
        }
        /**
        * Return `data` as an object in [GeoJSON](https://geojson.org) format.
        */
        geojson() {
          this.headers.set("Accept", "application/geo+json");
          return this;
        }
        /**
        * Return `data` as the EXPLAIN plan for the query.
        *
        * You need to enable the
        * [db_plan_enabled](https://supabase.com/docs/guides/database/debugging-performance#enabling-explain)
        * setting before using this method.
        *
        * @param options - Named parameters
        *
        * @param options.analyze - If `true`, the query will be executed and the
        * actual run time will be returned
        *
        * @param options.verbose - If `true`, the query identifier will be returned
        * and `data` will include the output columns of the query
        *
        * @param options.settings - If `true`, include information on configuration
        * parameters that affect query planning
        *
        * @param options.buffers - If `true`, include information on buffer usage
        *
        * @param options.wal - If `true`, include information on WAL record generation
        *
        * @param options.format - The format of the output, can be `"text"` (default)
        * or `"json"`
        */
        explain({ analyze = false, verbose = false, settings = false, buffers = false, wal = false, format = "text" } = {}) {
          var _this$headers$get;
          const options = [
            analyze ? "analyze" : null,
            verbose ? "verbose" : null,
            settings ? "settings" : null,
            buffers ? "buffers" : null,
            wal ? "wal" : null
          ].filter(Boolean).join("|");
          const forMediatype = (_this$headers$get = this.headers.get("Accept")) !== null && _this$headers$get !== void 0 ? _this$headers$get : "application/json";
          this.headers.set("Accept", `application/vnd.pgrst.plan+${format}; for="${forMediatype}"; options=${options};`);
          if (format === "json")
            return this;
          else
            return this;
        }
        /**
        * Rollback the query.
        *
        * `data` will still be returned, but the query is not committed.
        */
        rollback() {
          this.headers.append("Prefer", "tx=rollback");
          return this;
        }
        /**
        * Override the type of the returned `data`.
        *
        * @typeParam NewResult - The new result type to override with
        * @deprecated Use overrideTypes<yourType, { merge: false }>() method at the end of your call chain instead
        */
        returns() {
          return this;
        }
        /**
        * Set the maximum number of rows that can be affected by the query.
        * Only available in PostgREST v13+ and only works with PATCH and DELETE methods.
        *
        * @param value - The maximum number of rows that can be affected
        */
        maxAffected(value) {
          this.headers.append("Prefer", "handling=strict");
          this.headers.append("Prefer", `max-affected=${value}`);
          return this;
        }
      };
      PostgrestReservedCharsRegexp = /* @__PURE__ */ new RegExp("[,()]");
      PostgrestFilterBuilder = class extends PostgrestTransformBuilder {
        /**
        * Match only rows where `column` is equal to `value`.
        *
        * To check if the value of `column` is NULL, you should use `.is()` instead.
        *
        * @param column - The column to filter on
        * @param value - The value to filter with
        */
        eq(column, value) {
          this.url.searchParams.append(column, `eq.${value}`);
          return this;
        }
        /**
        * Match only rows where `column` is not equal to `value`.
        *
        * @param column - The column to filter on
        * @param value - The value to filter with
        */
        neq(column, value) {
          this.url.searchParams.append(column, `neq.${value}`);
          return this;
        }
        /**
        * Match only rows where `column` is greater than `value`.
        *
        * @param column - The column to filter on
        * @param value - The value to filter with
        */
        gt(column, value) {
          this.url.searchParams.append(column, `gt.${value}`);
          return this;
        }
        /**
        * Match only rows where `column` is greater than or equal to `value`.
        *
        * @param column - The column to filter on
        * @param value - The value to filter with
        */
        gte(column, value) {
          this.url.searchParams.append(column, `gte.${value}`);
          return this;
        }
        /**
        * Match only rows where `column` is less than `value`.
        *
        * @param column - The column to filter on
        * @param value - The value to filter with
        */
        lt(column, value) {
          this.url.searchParams.append(column, `lt.${value}`);
          return this;
        }
        /**
        * Match only rows where `column` is less than or equal to `value`.
        *
        * @param column - The column to filter on
        * @param value - The value to filter with
        */
        lte(column, value) {
          this.url.searchParams.append(column, `lte.${value}`);
          return this;
        }
        /**
        * Match only rows where `column` matches `pattern` case-sensitively.
        *
        * @param column - The column to filter on
        * @param pattern - The pattern to match with
        */
        like(column, pattern) {
          this.url.searchParams.append(column, `like.${pattern}`);
          return this;
        }
        /**
        * Match only rows where `column` matches all of `patterns` case-sensitively.
        *
        * @param column - The column to filter on
        * @param patterns - The patterns to match with
        */
        likeAllOf(column, patterns) {
          this.url.searchParams.append(column, `like(all).{${patterns.join(",")}}`);
          return this;
        }
        /**
        * Match only rows where `column` matches any of `patterns` case-sensitively.
        *
        * @param column - The column to filter on
        * @param patterns - The patterns to match with
        */
        likeAnyOf(column, patterns) {
          this.url.searchParams.append(column, `like(any).{${patterns.join(",")}}`);
          return this;
        }
        /**
        * Match only rows where `column` matches `pattern` case-insensitively.
        *
        * @param column - The column to filter on
        * @param pattern - The pattern to match with
        */
        ilike(column, pattern) {
          this.url.searchParams.append(column, `ilike.${pattern}`);
          return this;
        }
        /**
        * Match only rows where `column` matches all of `patterns` case-insensitively.
        *
        * @param column - The column to filter on
        * @param patterns - The patterns to match with
        */
        ilikeAllOf(column, patterns) {
          this.url.searchParams.append(column, `ilike(all).{${patterns.join(",")}}`);
          return this;
        }
        /**
        * Match only rows where `column` matches any of `patterns` case-insensitively.
        *
        * @param column - The column to filter on
        * @param patterns - The patterns to match with
        */
        ilikeAnyOf(column, patterns) {
          this.url.searchParams.append(column, `ilike(any).{${patterns.join(",")}}`);
          return this;
        }
        /**
        * Match only rows where `column` matches the PostgreSQL regex `pattern`
        * case-sensitively (using the `~` operator).
        *
        * @param column - The column to filter on
        * @param pattern - The PostgreSQL regular expression pattern to match with
        */
        regexMatch(column, pattern) {
          this.url.searchParams.append(column, `match.${pattern}`);
          return this;
        }
        /**
        * Match only rows where `column` matches the PostgreSQL regex `pattern`
        * case-insensitively (using the `~*` operator).
        *
        * @param column - The column to filter on
        * @param pattern - The PostgreSQL regular expression pattern to match with
        */
        regexIMatch(column, pattern) {
          this.url.searchParams.append(column, `imatch.${pattern}`);
          return this;
        }
        /**
        * Match only rows where `column` IS `value`.
        *
        * For non-boolean columns, this is only relevant for checking if the value of
        * `column` is NULL by setting `value` to `null`.
        *
        * For boolean columns, you can also set `value` to `true` or `false` and it
        * will behave the same way as `.eq()`.
        *
        * @param column - The column to filter on
        * @param value - The value to filter with
        */
        is(column, value) {
          this.url.searchParams.append(column, `is.${value}`);
          return this;
        }
        /**
        * Match only rows where `column` IS DISTINCT FROM `value`.
        *
        * Unlike `.neq()`, this treats `NULL` as a comparable value. Two `NULL` values
        * are considered equal (not distinct), and comparing `NULL` with any non-NULL
        * value returns true (distinct).
        *
        * @param column - The column to filter on
        * @param value - The value to filter with
        */
        isDistinct(column, value) {
          this.url.searchParams.append(column, `isdistinct.${value}`);
          return this;
        }
        /**
        * Match only rows where `column` is included in the `values` array.
        *
        * @param column - The column to filter on
        * @param values - The values array to filter with
        */
        in(column, values) {
          const cleanedValues = Array.from(new Set(values)).map((s) => {
            if (typeof s === "string" && PostgrestReservedCharsRegexp.test(s))
              return `"${s}"`;
            else
              return `${s}`;
          }).join(",");
          this.url.searchParams.append(column, `in.(${cleanedValues})`);
          return this;
        }
        /**
        * Match only rows where `column` is NOT included in the `values` array.
        *
        * @param column - The column to filter on
        * @param values - The values array to filter with
        */
        notIn(column, values) {
          const cleanedValues = Array.from(new Set(values)).map((s) => {
            if (typeof s === "string" && PostgrestReservedCharsRegexp.test(s))
              return `"${s}"`;
            else
              return `${s}`;
          }).join(",");
          this.url.searchParams.append(column, `not.in.(${cleanedValues})`);
          return this;
        }
        /**
        * Only relevant for jsonb, array, and range columns. Match only rows where
        * `column` contains every element appearing in `value`.
        *
        * @param column - The jsonb, array, or range column to filter on
        * @param value - The jsonb, array, or range value to filter with
        */
        contains(column, value) {
          if (typeof value === "string")
            this.url.searchParams.append(column, `cs.${value}`);
          else if (Array.isArray(value))
            this.url.searchParams.append(column, `cs.{${value.join(",")}}`);
          else
            this.url.searchParams.append(column, `cs.${JSON.stringify(value)}`);
          return this;
        }
        /**
        * Only relevant for jsonb, array, and range columns. Match only rows where
        * every element appearing in `column` is contained by `value`.
        *
        * @param column - The jsonb, array, or range column to filter on
        * @param value - The jsonb, array, or range value to filter with
        */
        containedBy(column, value) {
          if (typeof value === "string")
            this.url.searchParams.append(column, `cd.${value}`);
          else if (Array.isArray(value))
            this.url.searchParams.append(column, `cd.{${value.join(",")}}`);
          else
            this.url.searchParams.append(column, `cd.${JSON.stringify(value)}`);
          return this;
        }
        /**
        * Only relevant for range columns. Match only rows where every element in
        * `column` is greater than any element in `range`.
        *
        * @param column - The range column to filter on
        * @param range - The range to filter with
        */
        rangeGt(column, range) {
          this.url.searchParams.append(column, `sr.${range}`);
          return this;
        }
        /**
        * Only relevant for range columns. Match only rows where every element in
        * `column` is either contained in `range` or greater than any element in
        * `range`.
        *
        * @param column - The range column to filter on
        * @param range - The range to filter with
        */
        rangeGte(column, range) {
          this.url.searchParams.append(column, `nxl.${range}`);
          return this;
        }
        /**
        * Only relevant for range columns. Match only rows where every element in
        * `column` is less than any element in `range`.
        *
        * @param column - The range column to filter on
        * @param range - The range to filter with
        */
        rangeLt(column, range) {
          this.url.searchParams.append(column, `sl.${range}`);
          return this;
        }
        /**
        * Only relevant for range columns. Match only rows where every element in
        * `column` is either contained in `range` or less than any element in
        * `range`.
        *
        * @param column - The range column to filter on
        * @param range - The range to filter with
        */
        rangeLte(column, range) {
          this.url.searchParams.append(column, `nxr.${range}`);
          return this;
        }
        /**
        * Only relevant for range columns. Match only rows where `column` is
        * mutually exclusive to `range` and there can be no element between the two
        * ranges.
        *
        * @param column - The range column to filter on
        * @param range - The range to filter with
        */
        rangeAdjacent(column, range) {
          this.url.searchParams.append(column, `adj.${range}`);
          return this;
        }
        /**
        * Only relevant for array and range columns. Match only rows where
        * `column` and `value` have an element in common.
        *
        * @param column - The array or range column to filter on
        * @param value - The array or range value to filter with
        */
        overlaps(column, value) {
          if (typeof value === "string")
            this.url.searchParams.append(column, `ov.${value}`);
          else
            this.url.searchParams.append(column, `ov.{${value.join(",")}}`);
          return this;
        }
        /**
        * Only relevant for text and tsvector columns. Match only rows where
        * `column` matches the query string in `query`.
        *
        * @param column - The text or tsvector column to filter on
        * @param query - The query text to match with
        * @param options - Named parameters
        * @param options.config - The text search configuration to use
        * @param options.type - Change how the `query` text is interpreted
        */
        textSearch(column, query, { config, type } = {}) {
          let typePart = "";
          if (type === "plain")
            typePart = "pl";
          else if (type === "phrase")
            typePart = "ph";
          else if (type === "websearch")
            typePart = "w";
          const configPart = config === void 0 ? "" : `(${config})`;
          this.url.searchParams.append(column, `${typePart}fts${configPart}.${query}`);
          return this;
        }
        /**
        * Match only rows where each column in `query` keys is equal to its
        * associated value. Shorthand for multiple `.eq()`s.
        *
        * @param query - The object to filter with, with column names as keys mapped
        * to their filter values
        */
        match(query) {
          Object.entries(query).forEach(([column, value]) => {
            this.url.searchParams.append(column, `eq.${value}`);
          });
          return this;
        }
        /**
        * Match only rows which doesn't satisfy the filter.
        *
        * Unlike most filters, `opearator` and `value` are used as-is and need to
        * follow [PostgREST
        * syntax](https://postgrest.org/en/stable/api.html#operators). You also need
        * to make sure they are properly sanitized.
        *
        * @param column - The column to filter on
        * @param operator - The operator to be negated to filter with, following
        * PostgREST syntax
        * @param value - The value to filter with, following PostgREST syntax
        */
        not(column, operator, value) {
          this.url.searchParams.append(column, `not.${operator}.${value}`);
          return this;
        }
        /**
        * Match only rows which satisfy at least one of the filters.
        *
        * Unlike most filters, `filters` is used as-is and needs to follow [PostgREST
        * syntax](https://postgrest.org/en/stable/api.html#operators). You also need
        * to make sure it's properly sanitized.
        *
        * It's currently not possible to do an `.or()` filter across multiple tables.
        *
        * @param filters - The filters to use, following PostgREST syntax
        * @param options - Named parameters
        * @param options.referencedTable - Set this to filter on referenced tables
        * instead of the parent table
        * @param options.foreignTable - Deprecated, use `referencedTable` instead
        */
        or(filters, { foreignTable, referencedTable = foreignTable } = {}) {
          const key = referencedTable ? `${referencedTable}.or` : "or";
          this.url.searchParams.append(key, `(${filters})`);
          return this;
        }
        /**
        * Match only rows which satisfy the filter. This is an escape hatch - you
        * should use the specific filter methods wherever possible.
        *
        * Unlike most filters, `opearator` and `value` are used as-is and need to
        * follow [PostgREST
        * syntax](https://postgrest.org/en/stable/api.html#operators). You also need
        * to make sure they are properly sanitized.
        *
        * @param column - The column to filter on
        * @param operator - The operator to filter with, following PostgREST syntax
        * @param value - The value to filter with, following PostgREST syntax
        */
        filter(column, operator, value) {
          this.url.searchParams.append(column, `${operator}.${value}`);
          return this;
        }
      };
      PostgrestQueryBuilder = class {
        /**
        * Creates a query builder scoped to a Postgres table or view.
        *
        * @example
        * ```ts
        * import PostgrestQueryBuilder from '@supabase/postgrest-js'
        *
        * const query = new PostgrestQueryBuilder(
        *   new URL('https://xyzcompany.supabase.co/rest/v1/users'),
        *   { headers: { apikey: 'public-anon-key' } }
        * )
        * ```
        */
        constructor(url, { headers = {}, schema, fetch: fetch$1 }) {
          this.url = url;
          this.headers = new Headers(headers);
          this.schema = schema;
          this.fetch = fetch$1;
        }
        /**
        * Clone URL and headers to prevent shared state between operations.
        */
        cloneRequestState() {
          return {
            url: new URL(this.url.toString()),
            headers: new Headers(this.headers)
          };
        }
        /**
        * Perform a SELECT query on the table or view.
        *
        * @param columns - The columns to retrieve, separated by commas. Columns can be renamed when returned with `customName:columnName`
        *
        * @param options - Named parameters
        *
        * @param options.head - When set to `true`, `data` will not be returned.
        * Useful if you only need the count.
        *
        * @param options.count - Count algorithm to use to count rows in the table or view.
        *
        * `"exact"`: Exact but slow count algorithm. Performs a `COUNT(*)` under the
        * hood.
        *
        * `"planned"`: Approximated but fast count algorithm. Uses the Postgres
        * statistics under the hood.
        *
        * `"estimated"`: Uses exact count for low numbers and planned count for high
        * numbers.
        *
        * @remarks
        * When using `count` with `.range()` or `.limit()`, the returned `count` is the total number of rows
        * that match your filters, not the number of rows in the current page. Use this to build pagination UI.
        */
        select(columns, options) {
          const { head: head2 = false, count } = options !== null && options !== void 0 ? options : {};
          const method = head2 ? "HEAD" : "GET";
          let quoted = false;
          const cleanedColumns = (columns !== null && columns !== void 0 ? columns : "*").split("").map((c) => {
            if (/\s/.test(c) && !quoted)
              return "";
            if (c === '"')
              quoted = !quoted;
            return c;
          }).join("");
          const { url, headers } = this.cloneRequestState();
          url.searchParams.set("select", cleanedColumns);
          if (count)
            headers.append("Prefer", `count=${count}`);
          return new PostgrestFilterBuilder({
            method,
            url,
            headers,
            schema: this.schema,
            fetch: this.fetch
          });
        }
        /**
        * Perform an INSERT into the table or view.
        *
        * By default, inserted rows are not returned. To return it, chain the call
        * with `.select()`.
        *
        * @param values - The values to insert. Pass an object to insert a single row
        * or an array to insert multiple rows.
        *
        * @param options - Named parameters
        *
        * @param options.count - Count algorithm to use to count inserted rows.
        *
        * `"exact"`: Exact but slow count algorithm. Performs a `COUNT(*)` under the
        * hood.
        *
        * `"planned"`: Approximated but fast count algorithm. Uses the Postgres
        * statistics under the hood.
        *
        * `"estimated"`: Uses exact count for low numbers and planned count for high
        * numbers.
        *
        * @param options.defaultToNull - Make missing fields default to `null`.
        * Otherwise, use the default value for the column. Only applies for bulk
        * inserts.
        */
        insert(values, { count, defaultToNull = true } = {}) {
          var _this$fetch;
          const method = "POST";
          const { url, headers } = this.cloneRequestState();
          if (count)
            headers.append("Prefer", `count=${count}`);
          if (!defaultToNull)
            headers.append("Prefer", `missing=default`);
          if (Array.isArray(values)) {
            const columns = values.reduce((acc, x) => acc.concat(Object.keys(x)), []);
            if (columns.length > 0) {
              const uniqueColumns = [...new Set(columns)].map((column) => `"${column}"`);
              url.searchParams.set("columns", uniqueColumns.join(","));
            }
          }
          return new PostgrestFilterBuilder({
            method,
            url,
            headers,
            schema: this.schema,
            body: values,
            fetch: (_this$fetch = this.fetch) !== null && _this$fetch !== void 0 ? _this$fetch : fetch
          });
        }
        /**
        * Perform an UPSERT on the table or view. Depending on the column(s) passed
        * to `onConflict`, `.upsert()` allows you to perform the equivalent of
        * `.insert()` if a row with the corresponding `onConflict` columns doesn't
        * exist, or if it does exist, perform an alternative action depending on
        * `ignoreDuplicates`.
        *
        * By default, upserted rows are not returned. To return it, chain the call
        * with `.select()`.
        *
        * @param values - The values to upsert with. Pass an object to upsert a
        * single row or an array to upsert multiple rows.
        *
        * @param options - Named parameters
        *
        * @param options.onConflict - Comma-separated UNIQUE column(s) to specify how
        * duplicate rows are determined. Two rows are duplicates if all the
        * `onConflict` columns are equal.
        *
        * @param options.ignoreDuplicates - If `true`, duplicate rows are ignored. If
        * `false`, duplicate rows are merged with existing rows.
        *
        * @param options.count - Count algorithm to use to count upserted rows.
        *
        * `"exact"`: Exact but slow count algorithm. Performs a `COUNT(*)` under the
        * hood.
        *
        * `"planned"`: Approximated but fast count algorithm. Uses the Postgres
        * statistics under the hood.
        *
        * `"estimated"`: Uses exact count for low numbers and planned count for high
        * numbers.
        *
        * @param options.defaultToNull - Make missing fields default to `null`.
        * Otherwise, use the default value for the column. This only applies when
        * inserting new rows, not when merging with existing rows under
        * `ignoreDuplicates: false`. This also only applies when doing bulk upserts.
        *
        * @example Upsert a single row using a unique key
        * ```ts
        * // Upserting a single row, overwriting based on the 'username' unique column
        * const { data, error } = await supabase
        *   .from('users')
        *   .upsert({ username: 'supabot' }, { onConflict: 'username' })
        *
        * // Example response:
        * // {
        * //   data: [
        * //     { id: 4, message: 'bar', username: 'supabot' }
        * //   ],
        * //   error: null
        * // }
        * ```
        *
        * @example Upsert with conflict resolution and exact row counting
        * ```ts
        * // Upserting and returning exact count
        * const { data, error, count } = await supabase
        *   .from('users')
        *   .upsert(
        *     {
        *       id: 3,
        *       message: 'foo',
        *       username: 'supabot'
        *     },
        *     {
        *       onConflict: 'username',
        *       count: 'exact'
        *     }
        *   )
        *
        * // Example response:
        * // {
        * //   data: [
        * //     {
        * //       id: 42,
        * //       handle: "saoirse",
        * //       display_name: "Saoirse"
        * //     }
        * //   ],
        * //   count: 1,
        * //   error: null
        * // }
        * ```
        */
        upsert(values, { onConflict, ignoreDuplicates = false, count, defaultToNull = true } = {}) {
          var _this$fetch2;
          const method = "POST";
          const { url, headers } = this.cloneRequestState();
          headers.append("Prefer", `resolution=${ignoreDuplicates ? "ignore" : "merge"}-duplicates`);
          if (onConflict !== void 0)
            url.searchParams.set("on_conflict", onConflict);
          if (count)
            headers.append("Prefer", `count=${count}`);
          if (!defaultToNull)
            headers.append("Prefer", "missing=default");
          if (Array.isArray(values)) {
            const columns = values.reduce((acc, x) => acc.concat(Object.keys(x)), []);
            if (columns.length > 0) {
              const uniqueColumns = [...new Set(columns)].map((column) => `"${column}"`);
              url.searchParams.set("columns", uniqueColumns.join(","));
            }
          }
          return new PostgrestFilterBuilder({
            method,
            url,
            headers,
            schema: this.schema,
            body: values,
            fetch: (_this$fetch2 = this.fetch) !== null && _this$fetch2 !== void 0 ? _this$fetch2 : fetch
          });
        }
        /**
        * Perform an UPDATE on the table or view.
        *
        * By default, updated rows are not returned. To return it, chain the call
        * with `.select()` after filters.
        *
        * @param values - The values to update with
        *
        * @param options - Named parameters
        *
        * @param options.count - Count algorithm to use to count updated rows.
        *
        * `"exact"`: Exact but slow count algorithm. Performs a `COUNT(*)` under the
        * hood.
        *
        * `"planned"`: Approximated but fast count algorithm. Uses the Postgres
        * statistics under the hood.
        *
        * `"estimated"`: Uses exact count for low numbers and planned count for high
        * numbers.
        */
        update(values, { count } = {}) {
          var _this$fetch3;
          const method = "PATCH";
          const { url, headers } = this.cloneRequestState();
          if (count)
            headers.append("Prefer", `count=${count}`);
          return new PostgrestFilterBuilder({
            method,
            url,
            headers,
            schema: this.schema,
            body: values,
            fetch: (_this$fetch3 = this.fetch) !== null && _this$fetch3 !== void 0 ? _this$fetch3 : fetch
          });
        }
        /**
        * Perform a DELETE on the table or view.
        *
        * By default, deleted rows are not returned. To return it, chain the call
        * with `.select()` after filters.
        *
        * @param options - Named parameters
        *
        * @param options.count - Count algorithm to use to count deleted rows.
        *
        * `"exact"`: Exact but slow count algorithm. Performs a `COUNT(*)` under the
        * hood.
        *
        * `"planned"`: Approximated but fast count algorithm. Uses the Postgres
        * statistics under the hood.
        *
        * `"estimated"`: Uses exact count for low numbers and planned count for high
        * numbers.
        */
        delete({ count } = {}) {
          var _this$fetch4;
          const method = "DELETE";
          const { url, headers } = this.cloneRequestState();
          if (count)
            headers.append("Prefer", `count=${count}`);
          return new PostgrestFilterBuilder({
            method,
            url,
            headers,
            schema: this.schema,
            fetch: (_this$fetch4 = this.fetch) !== null && _this$fetch4 !== void 0 ? _this$fetch4 : fetch
          });
        }
      };
      PostgrestClient = class PostgrestClient2 {
        /**
        * Creates a PostgREST client.
        *
        * @param url - URL of the PostgREST endpoint
        * @param options - Named parameters
        * @param options.headers - Custom headers
        * @param options.schema - Postgres schema to switch to
        * @param options.fetch - Custom fetch
        * @example
        * ```ts
        * import PostgrestClient from '@supabase/postgrest-js'
        *
        * const postgrest = new PostgrestClient('https://xyzcompany.supabase.co/rest/v1', {
        *   headers: { apikey: 'public-anon-key' },
        *   schema: 'public',
        * })
        * ```
        */
        constructor(url, { headers = {}, schema, fetch: fetch$1 } = {}) {
          this.url = url;
          this.headers = new Headers(headers);
          this.schemaName = schema;
          this.fetch = fetch$1;
        }
        /**
        * Perform a query on a table or a view.
        *
        * @param relation - The table or view name to query
        */
        from(relation) {
          if (!relation || typeof relation !== "string" || relation.trim() === "")
            throw new Error("Invalid relation name: relation must be a non-empty string.");
          return new PostgrestQueryBuilder(new URL(`${this.url}/${relation}`), {
            headers: new Headers(this.headers),
            schema: this.schemaName,
            fetch: this.fetch
          });
        }
        /**
        * Select a schema to query or perform an function (rpc) call.
        *
        * The schema needs to be on the list of exposed schemas inside Supabase.
        *
        * @param schema - The schema to query
        */
        schema(schema) {
          return new PostgrestClient2(this.url, {
            headers: this.headers,
            schema,
            fetch: this.fetch
          });
        }
        /**
        * Perform a function call.
        *
        * @param fn - The function name to call
        * @param args - The arguments to pass to the function call
        * @param options - Named parameters
        * @param options.head - When set to `true`, `data` will not be returned.
        * Useful if you only need the count.
        * @param options.get - When set to `true`, the function will be called with
        * read-only access mode.
        * @param options.count - Count algorithm to use to count rows returned by the
        * function. Only applicable for [set-returning
        * functions](https://www.postgresql.org/docs/current/functions-srf.html).
        *
        * `"exact"`: Exact but slow count algorithm. Performs a `COUNT(*)` under the
        * hood.
        *
        * `"planned"`: Approximated but fast count algorithm. Uses the Postgres
        * statistics under the hood.
        *
        * `"estimated"`: Uses exact count for low numbers and planned count for high
        * numbers.
        *
        * @example
        * ```ts
        * // For cross-schema functions where type inference fails, use overrideTypes:
        * const { data } = await supabase
        *   .schema('schema_b')
        *   .rpc('function_a', {})
        *   .overrideTypes<{ id: string; user_id: string }[]>()
        * ```
        */
        rpc(fn, args = {}, { head: head2 = false, get: get2 = false, count } = {}) {
          var _this$fetch;
          let method;
          const url = new URL(`${this.url}/rpc/${fn}`);
          let body;
          const _isObject = (v) => v !== null && typeof v === "object" && (!Array.isArray(v) || v.some(_isObject));
          const _hasObjectArg = head2 && Object.values(args).some(_isObject);
          if (_hasObjectArg) {
            method = "POST";
            body = args;
          } else if (head2 || get2) {
            method = head2 ? "HEAD" : "GET";
            Object.entries(args).filter(([_, value]) => value !== void 0).map(([name, value]) => [name, Array.isArray(value) ? `{${value.join(",")}}` : `${value}`]).forEach(([name, value]) => {
              url.searchParams.append(name, value);
            });
          } else {
            method = "POST";
            body = args;
          }
          const headers = new Headers(this.headers);
          if (_hasObjectArg)
            headers.set("Prefer", count ? `count=${count},return=minimal` : "return=minimal");
          else if (count)
            headers.set("Prefer", `count=${count}`);
          return new PostgrestFilterBuilder({
            method,
            url,
            headers,
            schema: this.schemaName,
            body,
            fetch: (_this$fetch = this.fetch) !== null && _this$fetch !== void 0 ? _this$fetch : fetch
          });
        }
      };
    }
  });

  // ../../node_modules/@supabase/realtime-js/dist/module/lib/websocket-factory.js
  var WebSocketFactory, websocket_factory_default;
  var init_websocket_factory = __esm({
    "../../node_modules/@supabase/realtime-js/dist/module/lib/websocket-factory.js"() {
      WebSocketFactory = class {
        /**
         * Static-only utility – prevent instantiation.
         */
        constructor() {
        }
        static detectEnvironment() {
          var _a;
          if (typeof WebSocket !== "undefined") {
            return { type: "native", constructor: WebSocket };
          }
          if (typeof globalThis !== "undefined" && typeof globalThis.WebSocket !== "undefined") {
            return { type: "native", constructor: globalThis.WebSocket };
          }
          if (typeof global !== "undefined" && typeof global.WebSocket !== "undefined") {
            return { type: "native", constructor: global.WebSocket };
          }
          if (typeof globalThis !== "undefined" && typeof globalThis.WebSocketPair !== "undefined" && typeof globalThis.WebSocket === "undefined") {
            return {
              type: "cloudflare",
              error: "Cloudflare Workers detected. WebSocket clients are not supported in Cloudflare Workers.",
              workaround: "Use Cloudflare Workers WebSocket API for server-side WebSocket handling, or deploy to a different runtime."
            };
          }
          if (typeof globalThis !== "undefined" && globalThis.EdgeRuntime || typeof navigator !== "undefined" && ((_a = navigator.userAgent) === null || _a === void 0 ? void 0 : _a.includes("Vercel-Edge"))) {
            return {
              type: "unsupported",
              error: "Edge runtime detected (Vercel Edge/Netlify Edge). WebSockets are not supported in edge functions.",
              workaround: "Use serverless functions or a different deployment target for WebSocket functionality."
            };
          }
          const _process = globalThis["process"];
          if (_process) {
            const processVersions = _process["versions"];
            if (processVersions && processVersions["node"]) {
              const versionString = processVersions["node"];
              const nodeVersion = parseInt(versionString.replace(/^v/, "").split(".")[0]);
              if (nodeVersion >= 22) {
                if (typeof globalThis.WebSocket !== "undefined") {
                  return { type: "native", constructor: globalThis.WebSocket };
                }
                return {
                  type: "unsupported",
                  error: `Node.js ${nodeVersion} detected but native WebSocket not found.`,
                  workaround: "Provide a WebSocket implementation via the transport option."
                };
              }
              return {
                type: "unsupported",
                error: `Node.js ${nodeVersion} detected without native WebSocket support.`,
                workaround: 'For Node.js < 22, install "ws" package and provide it via the transport option:\nimport ws from "ws"\nnew RealtimeClient(url, { transport: ws })'
              };
            }
          }
          return {
            type: "unsupported",
            error: "Unknown JavaScript runtime without WebSocket support.",
            workaround: "Ensure you're running in a supported environment (browser, Node.js, Deno) or provide a custom WebSocket implementation."
          };
        }
        /**
         * Returns the best available WebSocket constructor for the current runtime.
         *
         * @example
         * ```ts
         * const WS = WebSocketFactory.getWebSocketConstructor()
         * const socket = new WS('wss://realtime.supabase.co/socket')
         * ```
         */
        static getWebSocketConstructor() {
          const env = this.detectEnvironment();
          if (env.constructor) {
            return env.constructor;
          }
          let errorMessage = env.error || "WebSocket not supported in this environment.";
          if (env.workaround) {
            errorMessage += `

Suggested solution: ${env.workaround}`;
          }
          throw new Error(errorMessage);
        }
        /**
         * Creates a WebSocket using the detected constructor.
         *
         * @example
         * ```ts
         * const socket = WebSocketFactory.createWebSocket('wss://realtime.supabase.co/socket')
         * ```
         */
        static createWebSocket(url, protocols) {
          const WS = this.getWebSocketConstructor();
          return new WS(url, protocols);
        }
        /**
         * Detects whether the runtime can establish WebSocket connections.
         *
         * @example
         * ```ts
         * if (!WebSocketFactory.isWebSocketSupported()) {
         *   console.warn('Falling back to long polling')
         * }
         * ```
         */
        static isWebSocketSupported() {
          try {
            const env = this.detectEnvironment();
            return env.type === "native" || env.type === "ws";
          } catch (_a) {
            return false;
          }
        }
      };
      websocket_factory_default = WebSocketFactory;
    }
  });

  // ../../node_modules/@supabase/realtime-js/dist/module/lib/version.js
  var version;
  var init_version = __esm({
    "../../node_modules/@supabase/realtime-js/dist/module/lib/version.js"() {
      version = "2.93.3";
    }
  });

  // ../../node_modules/@supabase/realtime-js/dist/module/lib/constants.js
  var DEFAULT_VERSION, VSN_1_0_0, VSN_2_0_0, DEFAULT_VSN, DEFAULT_TIMEOUT, WS_CLOSE_NORMAL, MAX_PUSH_BUFFER_SIZE, SOCKET_STATES, CHANNEL_STATES, CHANNEL_EVENTS, TRANSPORTS, CONNECTION_STATE;
  var init_constants = __esm({
    "../../node_modules/@supabase/realtime-js/dist/module/lib/constants.js"() {
      init_version();
      DEFAULT_VERSION = `realtime-js/${version}`;
      VSN_1_0_0 = "1.0.0";
      VSN_2_0_0 = "2.0.0";
      DEFAULT_VSN = VSN_2_0_0;
      DEFAULT_TIMEOUT = 1e4;
      WS_CLOSE_NORMAL = 1e3;
      MAX_PUSH_BUFFER_SIZE = 100;
      (function(SOCKET_STATES2) {
        SOCKET_STATES2[SOCKET_STATES2["connecting"] = 0] = "connecting";
        SOCKET_STATES2[SOCKET_STATES2["open"] = 1] = "open";
        SOCKET_STATES2[SOCKET_STATES2["closing"] = 2] = "closing";
        SOCKET_STATES2[SOCKET_STATES2["closed"] = 3] = "closed";
      })(SOCKET_STATES || (SOCKET_STATES = {}));
      (function(CHANNEL_STATES2) {
        CHANNEL_STATES2["closed"] = "closed";
        CHANNEL_STATES2["errored"] = "errored";
        CHANNEL_STATES2["joined"] = "joined";
        CHANNEL_STATES2["joining"] = "joining";
        CHANNEL_STATES2["leaving"] = "leaving";
      })(CHANNEL_STATES || (CHANNEL_STATES = {}));
      (function(CHANNEL_EVENTS2) {
        CHANNEL_EVENTS2["close"] = "phx_close";
        CHANNEL_EVENTS2["error"] = "phx_error";
        CHANNEL_EVENTS2["join"] = "phx_join";
        CHANNEL_EVENTS2["reply"] = "phx_reply";
        CHANNEL_EVENTS2["leave"] = "phx_leave";
        CHANNEL_EVENTS2["access_token"] = "access_token";
      })(CHANNEL_EVENTS || (CHANNEL_EVENTS = {}));
      (function(TRANSPORTS2) {
        TRANSPORTS2["websocket"] = "websocket";
      })(TRANSPORTS || (TRANSPORTS = {}));
      (function(CONNECTION_STATE2) {
        CONNECTION_STATE2["Connecting"] = "connecting";
        CONNECTION_STATE2["Open"] = "open";
        CONNECTION_STATE2["Closing"] = "closing";
        CONNECTION_STATE2["Closed"] = "closed";
      })(CONNECTION_STATE || (CONNECTION_STATE = {}));
    }
  });

  // ../../node_modules/@supabase/realtime-js/dist/module/lib/serializer.js
  var Serializer;
  var init_serializer = __esm({
    "../../node_modules/@supabase/realtime-js/dist/module/lib/serializer.js"() {
      Serializer = class {
        constructor(allowedMetadataKeys) {
          this.HEADER_LENGTH = 1;
          this.USER_BROADCAST_PUSH_META_LENGTH = 6;
          this.KINDS = { userBroadcastPush: 3, userBroadcast: 4 };
          this.BINARY_ENCODING = 0;
          this.JSON_ENCODING = 1;
          this.BROADCAST_EVENT = "broadcast";
          this.allowedMetadataKeys = [];
          this.allowedMetadataKeys = allowedMetadataKeys !== null && allowedMetadataKeys !== void 0 ? allowedMetadataKeys : [];
        }
        encode(msg, callback) {
          if (msg.event === this.BROADCAST_EVENT && !(msg.payload instanceof ArrayBuffer) && typeof msg.payload.event === "string") {
            return callback(this._binaryEncodeUserBroadcastPush(msg));
          }
          let payload = [msg.join_ref, msg.ref, msg.topic, msg.event, msg.payload];
          return callback(JSON.stringify(payload));
        }
        _binaryEncodeUserBroadcastPush(message) {
          var _a;
          if (this._isArrayBuffer((_a = message.payload) === null || _a === void 0 ? void 0 : _a.payload)) {
            return this._encodeBinaryUserBroadcastPush(message);
          } else {
            return this._encodeJsonUserBroadcastPush(message);
          }
        }
        _encodeBinaryUserBroadcastPush(message) {
          var _a, _b;
          const userPayload = (_b = (_a = message.payload) === null || _a === void 0 ? void 0 : _a.payload) !== null && _b !== void 0 ? _b : new ArrayBuffer(0);
          return this._encodeUserBroadcastPush(message, this.BINARY_ENCODING, userPayload);
        }
        _encodeJsonUserBroadcastPush(message) {
          var _a, _b;
          const userPayload = (_b = (_a = message.payload) === null || _a === void 0 ? void 0 : _a.payload) !== null && _b !== void 0 ? _b : {};
          const encoder = new TextEncoder();
          const encodedUserPayload = encoder.encode(JSON.stringify(userPayload)).buffer;
          return this._encodeUserBroadcastPush(message, this.JSON_ENCODING, encodedUserPayload);
        }
        _encodeUserBroadcastPush(message, encodingType, encodedPayload) {
          var _a, _b;
          const topic = message.topic;
          const ref = (_a = message.ref) !== null && _a !== void 0 ? _a : "";
          const joinRef = (_b = message.join_ref) !== null && _b !== void 0 ? _b : "";
          const userEvent = message.payload.event;
          const rest = this.allowedMetadataKeys ? this._pick(message.payload, this.allowedMetadataKeys) : {};
          const metadata = Object.keys(rest).length === 0 ? "" : JSON.stringify(rest);
          if (joinRef.length > 255) {
            throw new Error(`joinRef length ${joinRef.length} exceeds maximum of 255`);
          }
          if (ref.length > 255) {
            throw new Error(`ref length ${ref.length} exceeds maximum of 255`);
          }
          if (topic.length > 255) {
            throw new Error(`topic length ${topic.length} exceeds maximum of 255`);
          }
          if (userEvent.length > 255) {
            throw new Error(`userEvent length ${userEvent.length} exceeds maximum of 255`);
          }
          if (metadata.length > 255) {
            throw new Error(`metadata length ${metadata.length} exceeds maximum of 255`);
          }
          const metaLength = this.USER_BROADCAST_PUSH_META_LENGTH + joinRef.length + ref.length + topic.length + userEvent.length + metadata.length;
          const header = new ArrayBuffer(this.HEADER_LENGTH + metaLength);
          let view = new DataView(header);
          let offset = 0;
          view.setUint8(offset++, this.KINDS.userBroadcastPush);
          view.setUint8(offset++, joinRef.length);
          view.setUint8(offset++, ref.length);
          view.setUint8(offset++, topic.length);
          view.setUint8(offset++, userEvent.length);
          view.setUint8(offset++, metadata.length);
          view.setUint8(offset++, encodingType);
          Array.from(joinRef, (char) => view.setUint8(offset++, char.charCodeAt(0)));
          Array.from(ref, (char) => view.setUint8(offset++, char.charCodeAt(0)));
          Array.from(topic, (char) => view.setUint8(offset++, char.charCodeAt(0)));
          Array.from(userEvent, (char) => view.setUint8(offset++, char.charCodeAt(0)));
          Array.from(metadata, (char) => view.setUint8(offset++, char.charCodeAt(0)));
          var combined = new Uint8Array(header.byteLength + encodedPayload.byteLength);
          combined.set(new Uint8Array(header), 0);
          combined.set(new Uint8Array(encodedPayload), header.byteLength);
          return combined.buffer;
        }
        decode(rawPayload, callback) {
          if (this._isArrayBuffer(rawPayload)) {
            let result = this._binaryDecode(rawPayload);
            return callback(result);
          }
          if (typeof rawPayload === "string") {
            const jsonPayload = JSON.parse(rawPayload);
            const [join_ref, ref, topic, event, payload] = jsonPayload;
            return callback({ join_ref, ref, topic, event, payload });
          }
          return callback({});
        }
        _binaryDecode(buffer) {
          const view = new DataView(buffer);
          const kind = view.getUint8(0);
          const decoder = new TextDecoder();
          switch (kind) {
            case this.KINDS.userBroadcast:
              return this._decodeUserBroadcast(buffer, view, decoder);
          }
        }
        _decodeUserBroadcast(buffer, view, decoder) {
          const topicSize = view.getUint8(1);
          const userEventSize = view.getUint8(2);
          const metadataSize = view.getUint8(3);
          const payloadEncoding = view.getUint8(4);
          let offset = this.HEADER_LENGTH + 4;
          const topic = decoder.decode(buffer.slice(offset, offset + topicSize));
          offset = offset + topicSize;
          const userEvent = decoder.decode(buffer.slice(offset, offset + userEventSize));
          offset = offset + userEventSize;
          const metadata = decoder.decode(buffer.slice(offset, offset + metadataSize));
          offset = offset + metadataSize;
          const payload = buffer.slice(offset, buffer.byteLength);
          const parsedPayload = payloadEncoding === this.JSON_ENCODING ? JSON.parse(decoder.decode(payload)) : payload;
          const data = {
            type: this.BROADCAST_EVENT,
            event: userEvent,
            payload: parsedPayload
          };
          if (metadataSize > 0) {
            data["meta"] = JSON.parse(metadata);
          }
          return { join_ref: null, ref: null, topic, event: this.BROADCAST_EVENT, payload: data };
        }
        _isArrayBuffer(buffer) {
          var _a;
          return buffer instanceof ArrayBuffer || ((_a = buffer === null || buffer === void 0 ? void 0 : buffer.constructor) === null || _a === void 0 ? void 0 : _a.name) === "ArrayBuffer";
        }
        _pick(obj, keys) {
          if (!obj || typeof obj !== "object") {
            return {};
          }
          return Object.fromEntries(Object.entries(obj).filter(([key]) => keys.includes(key)));
        }
      };
    }
  });

  // ../../node_modules/@supabase/realtime-js/dist/module/lib/timer.js
  var Timer;
  var init_timer = __esm({
    "../../node_modules/@supabase/realtime-js/dist/module/lib/timer.js"() {
      Timer = class {
        constructor(callback, timerCalc) {
          this.callback = callback;
          this.timerCalc = timerCalc;
          this.timer = void 0;
          this.tries = 0;
          this.callback = callback;
          this.timerCalc = timerCalc;
        }
        reset() {
          this.tries = 0;
          clearTimeout(this.timer);
          this.timer = void 0;
        }
        // Cancels any previous scheduleTimeout and schedules callback
        scheduleTimeout() {
          clearTimeout(this.timer);
          this.timer = setTimeout(() => {
            this.tries = this.tries + 1;
            this.callback();
          }, this.timerCalc(this.tries + 1));
        }
      };
    }
  });

  // ../../node_modules/@supabase/realtime-js/dist/module/lib/transformers.js
  var PostgresTypes, convertChangeData, convertColumn, convertCell, noop, toBoolean, toNumber, toJson, toArray, toTimestampString, httpEndpointURL;
  var init_transformers = __esm({
    "../../node_modules/@supabase/realtime-js/dist/module/lib/transformers.js"() {
      (function(PostgresTypes2) {
        PostgresTypes2["abstime"] = "abstime";
        PostgresTypes2["bool"] = "bool";
        PostgresTypes2["date"] = "date";
        PostgresTypes2["daterange"] = "daterange";
        PostgresTypes2["float4"] = "float4";
        PostgresTypes2["float8"] = "float8";
        PostgresTypes2["int2"] = "int2";
        PostgresTypes2["int4"] = "int4";
        PostgresTypes2["int4range"] = "int4range";
        PostgresTypes2["int8"] = "int8";
        PostgresTypes2["int8range"] = "int8range";
        PostgresTypes2["json"] = "json";
        PostgresTypes2["jsonb"] = "jsonb";
        PostgresTypes2["money"] = "money";
        PostgresTypes2["numeric"] = "numeric";
        PostgresTypes2["oid"] = "oid";
        PostgresTypes2["reltime"] = "reltime";
        PostgresTypes2["text"] = "text";
        PostgresTypes2["time"] = "time";
        PostgresTypes2["timestamp"] = "timestamp";
        PostgresTypes2["timestamptz"] = "timestamptz";
        PostgresTypes2["timetz"] = "timetz";
        PostgresTypes2["tsrange"] = "tsrange";
        PostgresTypes2["tstzrange"] = "tstzrange";
      })(PostgresTypes || (PostgresTypes = {}));
      convertChangeData = (columns, record, options = {}) => {
        var _a;
        const skipTypes = (_a = options.skipTypes) !== null && _a !== void 0 ? _a : [];
        if (!record) {
          return {};
        }
        return Object.keys(record).reduce((acc, rec_key) => {
          acc[rec_key] = convertColumn(rec_key, columns, record, skipTypes);
          return acc;
        }, {});
      };
      convertColumn = (columnName, columns, record, skipTypes) => {
        const column = columns.find((x) => x.name === columnName);
        const colType = column === null || column === void 0 ? void 0 : column.type;
        const value = record[columnName];
        if (colType && !skipTypes.includes(colType)) {
          return convertCell(colType, value);
        }
        return noop(value);
      };
      convertCell = (type, value) => {
        if (type.charAt(0) === "_") {
          const dataType = type.slice(1, type.length);
          return toArray(value, dataType);
        }
        switch (type) {
          case PostgresTypes.bool:
            return toBoolean(value);
          case PostgresTypes.float4:
          case PostgresTypes.float8:
          case PostgresTypes.int2:
          case PostgresTypes.int4:
          case PostgresTypes.int8:
          case PostgresTypes.numeric:
          case PostgresTypes.oid:
            return toNumber(value);
          case PostgresTypes.json:
          case PostgresTypes.jsonb:
            return toJson(value);
          case PostgresTypes.timestamp:
            return toTimestampString(value);
          case PostgresTypes.abstime:
          case PostgresTypes.date:
          case PostgresTypes.daterange:
          case PostgresTypes.int4range:
          case PostgresTypes.int8range:
          case PostgresTypes.money:
          case PostgresTypes.reltime:
          case PostgresTypes.text:
          case PostgresTypes.time:
          case PostgresTypes.timestamptz:
          case PostgresTypes.timetz:
          case PostgresTypes.tsrange:
          case PostgresTypes.tstzrange:
            return noop(value);
          default:
            return noop(value);
        }
      };
      noop = (value) => {
        return value;
      };
      toBoolean = (value) => {
        switch (value) {
          case "t":
            return true;
          case "f":
            return false;
          default:
            return value;
        }
      };
      toNumber = (value) => {
        if (typeof value === "string") {
          const parsedValue = parseFloat(value);
          if (!Number.isNaN(parsedValue)) {
            return parsedValue;
          }
        }
        return value;
      };
      toJson = (value) => {
        if (typeof value === "string") {
          try {
            return JSON.parse(value);
          } catch (_a) {
            return value;
          }
        }
        return value;
      };
      toArray = (value, type) => {
        if (typeof value !== "string") {
          return value;
        }
        const lastIdx = value.length - 1;
        const closeBrace = value[lastIdx];
        const openBrace = value[0];
        if (openBrace === "{" && closeBrace === "}") {
          let arr;
          const valTrim = value.slice(1, lastIdx);
          try {
            arr = JSON.parse("[" + valTrim + "]");
          } catch (_) {
            arr = valTrim ? valTrim.split(",") : [];
          }
          return arr.map((val) => convertCell(type, val));
        }
        return value;
      };
      toTimestampString = (value) => {
        if (typeof value === "string") {
          return value.replace(" ", "T");
        }
        return value;
      };
      httpEndpointURL = (socketUrl) => {
        const wsUrl = new URL(socketUrl);
        wsUrl.protocol = wsUrl.protocol.replace(/^ws/i, "http");
        wsUrl.pathname = wsUrl.pathname.replace(/\/+$/, "").replace(/\/socket\/websocket$/i, "").replace(/\/socket$/i, "").replace(/\/websocket$/i, "");
        if (wsUrl.pathname === "" || wsUrl.pathname === "/") {
          wsUrl.pathname = "/api/broadcast";
        } else {
          wsUrl.pathname = wsUrl.pathname + "/api/broadcast";
        }
        return wsUrl.href;
      };
    }
  });

  // ../../node_modules/@supabase/realtime-js/dist/module/lib/push.js
  var Push;
  var init_push = __esm({
    "../../node_modules/@supabase/realtime-js/dist/module/lib/push.js"() {
      init_constants();
      Push = class {
        /**
         * Initializes the Push
         *
         * @param channel The Channel
         * @param event The event, for example `"phx_join"`
         * @param payload The payload, for example `{user_id: 123}`
         * @param timeout The push timeout in milliseconds
         */
        constructor(channel, event, payload = {}, timeout = DEFAULT_TIMEOUT) {
          this.channel = channel;
          this.event = event;
          this.payload = payload;
          this.timeout = timeout;
          this.sent = false;
          this.timeoutTimer = void 0;
          this.ref = "";
          this.receivedResp = null;
          this.recHooks = [];
          this.refEvent = null;
        }
        resend(timeout) {
          this.timeout = timeout;
          this._cancelRefEvent();
          this.ref = "";
          this.refEvent = null;
          this.receivedResp = null;
          this.sent = false;
          this.send();
        }
        send() {
          if (this._hasReceived("timeout")) {
            return;
          }
          this.startTimeout();
          this.sent = true;
          this.channel.socket.push({
            topic: this.channel.topic,
            event: this.event,
            payload: this.payload,
            ref: this.ref,
            join_ref: this.channel._joinRef()
          });
        }
        updatePayload(payload) {
          this.payload = Object.assign(Object.assign({}, this.payload), payload);
        }
        receive(status, callback) {
          var _a;
          if (this._hasReceived(status)) {
            callback((_a = this.receivedResp) === null || _a === void 0 ? void 0 : _a.response);
          }
          this.recHooks.push({ status, callback });
          return this;
        }
        startTimeout() {
          if (this.timeoutTimer) {
            return;
          }
          this.ref = this.channel.socket._makeRef();
          this.refEvent = this.channel._replyEventName(this.ref);
          const callback = (payload) => {
            this._cancelRefEvent();
            this._cancelTimeout();
            this.receivedResp = payload;
            this._matchReceive(payload);
          };
          this.channel._on(this.refEvent, {}, callback);
          this.timeoutTimer = setTimeout(() => {
            this.trigger("timeout", {});
          }, this.timeout);
        }
        trigger(status, response) {
          if (this.refEvent)
            this.channel._trigger(this.refEvent, { status, response });
        }
        destroy() {
          this._cancelRefEvent();
          this._cancelTimeout();
        }
        _cancelRefEvent() {
          if (!this.refEvent) {
            return;
          }
          this.channel._off(this.refEvent, {});
        }
        _cancelTimeout() {
          clearTimeout(this.timeoutTimer);
          this.timeoutTimer = void 0;
        }
        _matchReceive({ status, response }) {
          this.recHooks.filter((h) => h.status === status).forEach((h) => h.callback(response));
        }
        _hasReceived(status) {
          return this.receivedResp && this.receivedResp.status === status;
        }
      };
    }
  });

  // ../../node_modules/@supabase/realtime-js/dist/module/RealtimePresence.js
  var REALTIME_PRESENCE_LISTEN_EVENTS, RealtimePresence;
  var init_RealtimePresence = __esm({
    "../../node_modules/@supabase/realtime-js/dist/module/RealtimePresence.js"() {
      (function(REALTIME_PRESENCE_LISTEN_EVENTS2) {
        REALTIME_PRESENCE_LISTEN_EVENTS2["SYNC"] = "sync";
        REALTIME_PRESENCE_LISTEN_EVENTS2["JOIN"] = "join";
        REALTIME_PRESENCE_LISTEN_EVENTS2["LEAVE"] = "leave";
      })(REALTIME_PRESENCE_LISTEN_EVENTS || (REALTIME_PRESENCE_LISTEN_EVENTS = {}));
      RealtimePresence = class _RealtimePresence {
        /**
         * Creates a Presence helper that keeps the local presence state in sync with the server.
         *
         * @param channel - The realtime channel to bind to.
         * @param opts - Optional custom event names, e.g. `{ events: { state: 'state', diff: 'diff' } }`.
         *
         * @example
         * ```ts
         * const presence = new RealtimePresence(channel)
         *
         * channel.on('presence', ({ event, key }) => {
         *   console.log(`Presence ${event} on ${key}`)
         * })
         * ```
         */
        constructor(channel, opts) {
          this.channel = channel;
          this.state = {};
          this.pendingDiffs = [];
          this.joinRef = null;
          this.enabled = false;
          this.caller = {
            onJoin: () => {
            },
            onLeave: () => {
            },
            onSync: () => {
            }
          };
          const events = (opts === null || opts === void 0 ? void 0 : opts.events) || {
            state: "presence_state",
            diff: "presence_diff"
          };
          this.channel._on(events.state, {}, (newState) => {
            const { onJoin, onLeave, onSync } = this.caller;
            this.joinRef = this.channel._joinRef();
            this.state = _RealtimePresence.syncState(this.state, newState, onJoin, onLeave);
            this.pendingDiffs.forEach((diff) => {
              this.state = _RealtimePresence.syncDiff(this.state, diff, onJoin, onLeave);
            });
            this.pendingDiffs = [];
            onSync();
          });
          this.channel._on(events.diff, {}, (diff) => {
            const { onJoin, onLeave, onSync } = this.caller;
            if (this.inPendingSyncState()) {
              this.pendingDiffs.push(diff);
            } else {
              this.state = _RealtimePresence.syncDiff(this.state, diff, onJoin, onLeave);
              onSync();
            }
          });
          this.onJoin((key, currentPresences, newPresences) => {
            this.channel._trigger("presence", {
              event: "join",
              key,
              currentPresences,
              newPresences
            });
          });
          this.onLeave((key, currentPresences, leftPresences) => {
            this.channel._trigger("presence", {
              event: "leave",
              key,
              currentPresences,
              leftPresences
            });
          });
          this.onSync(() => {
            this.channel._trigger("presence", { event: "sync" });
          });
        }
        /**
         * Used to sync the list of presences on the server with the
         * client's state.
         *
         * An optional `onJoin` and `onLeave` callback can be provided to
         * react to changes in the client's local presences across
         * disconnects and reconnects with the server.
         *
         * @internal
         */
        static syncState(currentState, newState, onJoin, onLeave) {
          const state = this.cloneDeep(currentState);
          const transformedState = this.transformState(newState);
          const joins = {};
          const leaves = {};
          this.map(state, (key, presences) => {
            if (!transformedState[key]) {
              leaves[key] = presences;
            }
          });
          this.map(transformedState, (key, newPresences) => {
            const currentPresences = state[key];
            if (currentPresences) {
              const newPresenceRefs = newPresences.map((m) => m.presence_ref);
              const curPresenceRefs = currentPresences.map((m) => m.presence_ref);
              const joinedPresences = newPresences.filter((m) => curPresenceRefs.indexOf(m.presence_ref) < 0);
              const leftPresences = currentPresences.filter((m) => newPresenceRefs.indexOf(m.presence_ref) < 0);
              if (joinedPresences.length > 0) {
                joins[key] = joinedPresences;
              }
              if (leftPresences.length > 0) {
                leaves[key] = leftPresences;
              }
            } else {
              joins[key] = newPresences;
            }
          });
          return this.syncDiff(state, { joins, leaves }, onJoin, onLeave);
        }
        /**
         * Used to sync a diff of presence join and leave events from the
         * server, as they happen.
         *
         * Like `syncState`, `syncDiff` accepts optional `onJoin` and
         * `onLeave` callbacks to react to a user joining or leaving from a
         * device.
         *
         * @internal
         */
        static syncDiff(state, diff, onJoin, onLeave) {
          const { joins, leaves } = {
            joins: this.transformState(diff.joins),
            leaves: this.transformState(diff.leaves)
          };
          if (!onJoin) {
            onJoin = () => {
            };
          }
          if (!onLeave) {
            onLeave = () => {
            };
          }
          this.map(joins, (key, newPresences) => {
            var _a;
            const currentPresences = (_a = state[key]) !== null && _a !== void 0 ? _a : [];
            state[key] = this.cloneDeep(newPresences);
            if (currentPresences.length > 0) {
              const joinedPresenceRefs = state[key].map((m) => m.presence_ref);
              const curPresences = currentPresences.filter((m) => joinedPresenceRefs.indexOf(m.presence_ref) < 0);
              state[key].unshift(...curPresences);
            }
            onJoin(key, currentPresences, newPresences);
          });
          this.map(leaves, (key, leftPresences) => {
            let currentPresences = state[key];
            if (!currentPresences)
              return;
            const presenceRefsToRemove = leftPresences.map((m) => m.presence_ref);
            currentPresences = currentPresences.filter((m) => presenceRefsToRemove.indexOf(m.presence_ref) < 0);
            state[key] = currentPresences;
            onLeave(key, currentPresences, leftPresences);
            if (currentPresences.length === 0)
              delete state[key];
          });
          return state;
        }
        /** @internal */
        static map(obj, func) {
          return Object.getOwnPropertyNames(obj).map((key) => func(key, obj[key]));
        }
        /**
         * Remove 'metas' key
         * Change 'phx_ref' to 'presence_ref'
         * Remove 'phx_ref' and 'phx_ref_prev'
         *
         * @example
         * // returns {
         *  abc123: [
         *    { presence_ref: '2', user_id: 1 },
         *    { presence_ref: '3', user_id: 2 }
         *  ]
         * }
         * RealtimePresence.transformState({
         *  abc123: {
         *    metas: [
         *      { phx_ref: '2', phx_ref_prev: '1' user_id: 1 },
         *      { phx_ref: '3', user_id: 2 }
         *    ]
         *  }
         * })
         *
         * @internal
         */
        static transformState(state) {
          state = this.cloneDeep(state);
          return Object.getOwnPropertyNames(state).reduce((newState, key) => {
            const presences = state[key];
            if ("metas" in presences) {
              newState[key] = presences.metas.map((presence) => {
                presence["presence_ref"] = presence["phx_ref"];
                delete presence["phx_ref"];
                delete presence["phx_ref_prev"];
                return presence;
              });
            } else {
              newState[key] = presences;
            }
            return newState;
          }, {});
        }
        /** @internal */
        static cloneDeep(obj) {
          return JSON.parse(JSON.stringify(obj));
        }
        /** @internal */
        onJoin(callback) {
          this.caller.onJoin = callback;
        }
        /** @internal */
        onLeave(callback) {
          this.caller.onLeave = callback;
        }
        /** @internal */
        onSync(callback) {
          this.caller.onSync = callback;
        }
        /** @internal */
        inPendingSyncState() {
          return !this.joinRef || this.joinRef !== this.channel._joinRef();
        }
      };
    }
  });

  // ../../node_modules/@supabase/realtime-js/dist/module/RealtimeChannel.js
  var REALTIME_POSTGRES_CHANGES_LISTEN_EVENT, REALTIME_LISTEN_TYPES, REALTIME_SUBSCRIBE_STATES, RealtimeChannel;
  var init_RealtimeChannel = __esm({
    "../../node_modules/@supabase/realtime-js/dist/module/RealtimeChannel.js"() {
      init_constants();
      init_push();
      init_timer();
      init_RealtimePresence();
      init_transformers();
      init_transformers();
      (function(REALTIME_POSTGRES_CHANGES_LISTEN_EVENT2) {
        REALTIME_POSTGRES_CHANGES_LISTEN_EVENT2["ALL"] = "*";
        REALTIME_POSTGRES_CHANGES_LISTEN_EVENT2["INSERT"] = "INSERT";
        REALTIME_POSTGRES_CHANGES_LISTEN_EVENT2["UPDATE"] = "UPDATE";
        REALTIME_POSTGRES_CHANGES_LISTEN_EVENT2["DELETE"] = "DELETE";
      })(REALTIME_POSTGRES_CHANGES_LISTEN_EVENT || (REALTIME_POSTGRES_CHANGES_LISTEN_EVENT = {}));
      (function(REALTIME_LISTEN_TYPES2) {
        REALTIME_LISTEN_TYPES2["BROADCAST"] = "broadcast";
        REALTIME_LISTEN_TYPES2["PRESENCE"] = "presence";
        REALTIME_LISTEN_TYPES2["POSTGRES_CHANGES"] = "postgres_changes";
        REALTIME_LISTEN_TYPES2["SYSTEM"] = "system";
      })(REALTIME_LISTEN_TYPES || (REALTIME_LISTEN_TYPES = {}));
      (function(REALTIME_SUBSCRIBE_STATES2) {
        REALTIME_SUBSCRIBE_STATES2["SUBSCRIBED"] = "SUBSCRIBED";
        REALTIME_SUBSCRIBE_STATES2["TIMED_OUT"] = "TIMED_OUT";
        REALTIME_SUBSCRIBE_STATES2["CLOSED"] = "CLOSED";
        REALTIME_SUBSCRIBE_STATES2["CHANNEL_ERROR"] = "CHANNEL_ERROR";
      })(REALTIME_SUBSCRIBE_STATES || (REALTIME_SUBSCRIBE_STATES = {}));
      RealtimeChannel = class _RealtimeChannel {
        /**
         * Creates a channel that can broadcast messages, sync presence, and listen to Postgres changes.
         *
         * The topic determines which realtime stream you are subscribing to. Config options let you
         * enable acknowledgement for broadcasts, presence tracking, or private channels.
         *
         * @example
         * ```ts
         * import RealtimeClient from '@supabase/realtime-js'
         *
         * const client = new RealtimeClient('https://xyzcompany.supabase.co/realtime/v1', {
         *   params: { apikey: 'public-anon-key' },
         * })
         * const channel = new RealtimeChannel('realtime:public:messages', { config: {} }, client)
         * ```
         */
        constructor(topic, params = { config: {} }, socket) {
          var _a, _b;
          this.topic = topic;
          this.params = params;
          this.socket = socket;
          this.bindings = {};
          this.state = CHANNEL_STATES.closed;
          this.joinedOnce = false;
          this.pushBuffer = [];
          this.subTopic = topic.replace(/^realtime:/i, "");
          this.params.config = Object.assign({
            broadcast: { ack: false, self: false },
            presence: { key: "", enabled: false },
            private: false
          }, params.config);
          this.timeout = this.socket.timeout;
          this.joinPush = new Push(this, CHANNEL_EVENTS.join, this.params, this.timeout);
          this.rejoinTimer = new Timer(() => this._rejoinUntilConnected(), this.socket.reconnectAfterMs);
          this.joinPush.receive("ok", () => {
            this.state = CHANNEL_STATES.joined;
            this.rejoinTimer.reset();
            this.pushBuffer.forEach((pushEvent) => pushEvent.send());
            this.pushBuffer = [];
          });
          this._onClose(() => {
            this.rejoinTimer.reset();
            this.socket.log("channel", `close ${this.topic} ${this._joinRef()}`);
            this.state = CHANNEL_STATES.closed;
            this.socket._remove(this);
          });
          this._onError((reason) => {
            if (this._isLeaving() || this._isClosed()) {
              return;
            }
            this.socket.log("channel", `error ${this.topic}`, reason);
            this.state = CHANNEL_STATES.errored;
            this.rejoinTimer.scheduleTimeout();
          });
          this.joinPush.receive("timeout", () => {
            if (!this._isJoining()) {
              return;
            }
            this.socket.log("channel", `timeout ${this.topic}`, this.joinPush.timeout);
            this.state = CHANNEL_STATES.errored;
            this.rejoinTimer.scheduleTimeout();
          });
          this.joinPush.receive("error", (reason) => {
            if (this._isLeaving() || this._isClosed()) {
              return;
            }
            this.socket.log("channel", `error ${this.topic}`, reason);
            this.state = CHANNEL_STATES.errored;
            this.rejoinTimer.scheduleTimeout();
          });
          this._on(CHANNEL_EVENTS.reply, {}, (payload, ref) => {
            this._trigger(this._replyEventName(ref), payload);
          });
          this.presence = new RealtimePresence(this);
          this.broadcastEndpointURL = httpEndpointURL(this.socket.endPoint);
          this.private = this.params.config.private || false;
          if (!this.private && ((_b = (_a = this.params.config) === null || _a === void 0 ? void 0 : _a.broadcast) === null || _b === void 0 ? void 0 : _b.replay)) {
            throw `tried to use replay on public channel '${this.topic}'. It must be a private channel.`;
          }
        }
        /** Subscribe registers your client with the server */
        subscribe(callback, timeout = this.timeout) {
          var _a, _b, _c;
          if (!this.socket.isConnected()) {
            this.socket.connect();
          }
          if (this.state == CHANNEL_STATES.closed) {
            const { config: { broadcast, presence, private: isPrivate } } = this.params;
            const postgres_changes = (_b = (_a = this.bindings.postgres_changes) === null || _a === void 0 ? void 0 : _a.map((r) => r.filter)) !== null && _b !== void 0 ? _b : [];
            const presence_enabled = !!this.bindings[REALTIME_LISTEN_TYPES.PRESENCE] && this.bindings[REALTIME_LISTEN_TYPES.PRESENCE].length > 0 || ((_c = this.params.config.presence) === null || _c === void 0 ? void 0 : _c.enabled) === true;
            const accessTokenPayload = {};
            const config = {
              broadcast,
              presence: Object.assign(Object.assign({}, presence), { enabled: presence_enabled }),
              postgres_changes,
              private: isPrivate
            };
            if (this.socket.accessTokenValue) {
              accessTokenPayload.access_token = this.socket.accessTokenValue;
            }
            this._onError((e) => callback === null || callback === void 0 ? void 0 : callback(REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR, e));
            this._onClose(() => callback === null || callback === void 0 ? void 0 : callback(REALTIME_SUBSCRIBE_STATES.CLOSED));
            this.updateJoinPayload(Object.assign({ config }, accessTokenPayload));
            this.joinedOnce = true;
            this._rejoin(timeout);
            this.joinPush.receive("ok", async ({ postgres_changes: postgres_changes2 }) => {
              var _a2;
              if (!this.socket._isManualToken()) {
                this.socket.setAuth();
              }
              if (postgres_changes2 === void 0) {
                callback === null || callback === void 0 ? void 0 : callback(REALTIME_SUBSCRIBE_STATES.SUBSCRIBED);
                return;
              } else {
                const clientPostgresBindings = this.bindings.postgres_changes;
                const bindingsLen = (_a2 = clientPostgresBindings === null || clientPostgresBindings === void 0 ? void 0 : clientPostgresBindings.length) !== null && _a2 !== void 0 ? _a2 : 0;
                const newPostgresBindings = [];
                for (let i = 0; i < bindingsLen; i++) {
                  const clientPostgresBinding = clientPostgresBindings[i];
                  const { filter: { event, schema, table, filter } } = clientPostgresBinding;
                  const serverPostgresFilter = postgres_changes2 && postgres_changes2[i];
                  if (serverPostgresFilter && serverPostgresFilter.event === event && _RealtimeChannel.isFilterValueEqual(serverPostgresFilter.schema, schema) && _RealtimeChannel.isFilterValueEqual(serverPostgresFilter.table, table) && _RealtimeChannel.isFilterValueEqual(serverPostgresFilter.filter, filter)) {
                    newPostgresBindings.push(Object.assign(Object.assign({}, clientPostgresBinding), { id: serverPostgresFilter.id }));
                  } else {
                    this.unsubscribe();
                    this.state = CHANNEL_STATES.errored;
                    callback === null || callback === void 0 ? void 0 : callback(REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR, new Error("mismatch between server and client bindings for postgres changes"));
                    return;
                  }
                }
                this.bindings.postgres_changes = newPostgresBindings;
                callback && callback(REALTIME_SUBSCRIBE_STATES.SUBSCRIBED);
                return;
              }
            }).receive("error", (error) => {
              this.state = CHANNEL_STATES.errored;
              callback === null || callback === void 0 ? void 0 : callback(REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR, new Error(JSON.stringify(Object.values(error).join(", ") || "error")));
              return;
            }).receive("timeout", () => {
              callback === null || callback === void 0 ? void 0 : callback(REALTIME_SUBSCRIBE_STATES.TIMED_OUT);
              return;
            });
          }
          return this;
        }
        /**
         * Returns the current presence state for this channel.
         *
         * The shape is a map keyed by presence key (for example a user id) where each entry contains the
         * tracked metadata for that user.
         */
        presenceState() {
          return this.presence.state;
        }
        /**
         * Sends the supplied payload to the presence tracker so other subscribers can see that this
         * client is online. Use `untrack` to stop broadcasting presence for the same key.
         */
        async track(payload, opts = {}) {
          return await this.send({
            type: "presence",
            event: "track",
            payload
          }, opts.timeout || this.timeout);
        }
        /**
         * Removes the current presence state for this client.
         */
        async untrack(opts = {}) {
          return await this.send({
            type: "presence",
            event: "untrack"
          }, opts);
        }
        on(type, filter, callback) {
          if (this.state === CHANNEL_STATES.joined && type === REALTIME_LISTEN_TYPES.PRESENCE) {
            this.socket.log("channel", `resubscribe to ${this.topic} due to change in presence callbacks on joined channel`);
            this.unsubscribe().then(async () => await this.subscribe());
          }
          return this._on(type, filter, callback);
        }
        /**
         * Sends a broadcast message explicitly via REST API.
         *
         * This method always uses the REST API endpoint regardless of WebSocket connection state.
         * Useful when you want to guarantee REST delivery or when gradually migrating from implicit REST fallback.
         *
         * @param event The name of the broadcast event
         * @param payload Payload to be sent (required)
         * @param opts Options including timeout
         * @returns Promise resolving to object with success status, and error details if failed
         */
        async httpSend(event, payload, opts = {}) {
          var _a;
          if (payload === void 0 || payload === null) {
            return Promise.reject("Payload is required for httpSend()");
          }
          const headers = {
            apikey: this.socket.apiKey ? this.socket.apiKey : "",
            "Content-Type": "application/json"
          };
          if (this.socket.accessTokenValue) {
            headers["Authorization"] = `Bearer ${this.socket.accessTokenValue}`;
          }
          const options = {
            method: "POST",
            headers,
            body: JSON.stringify({
              messages: [
                {
                  topic: this.subTopic,
                  event,
                  payload,
                  private: this.private
                }
              ]
            })
          };
          const response = await this._fetchWithTimeout(this.broadcastEndpointURL, options, (_a = opts.timeout) !== null && _a !== void 0 ? _a : this.timeout);
          if (response.status === 202) {
            return { success: true };
          }
          let errorMessage = response.statusText;
          try {
            const errorBody = await response.json();
            errorMessage = errorBody.error || errorBody.message || errorMessage;
          } catch (_b) {
          }
          return Promise.reject(new Error(errorMessage));
        }
        /**
         * Sends a message into the channel.
         *
         * @param args Arguments to send to channel
         * @param args.type The type of event to send
         * @param args.event The name of the event being sent
         * @param args.payload Payload to be sent
         * @param opts Options to be used during the send process
         */
        async send(args, opts = {}) {
          var _a, _b;
          if (!this._canPush() && args.type === "broadcast") {
            console.warn("Realtime send() is automatically falling back to REST API. This behavior will be deprecated in the future. Please use httpSend() explicitly for REST delivery.");
            const { event, payload: endpoint_payload } = args;
            const headers = {
              apikey: this.socket.apiKey ? this.socket.apiKey : "",
              "Content-Type": "application/json"
            };
            if (this.socket.accessTokenValue) {
              headers["Authorization"] = `Bearer ${this.socket.accessTokenValue}`;
            }
            const options = {
              method: "POST",
              headers,
              body: JSON.stringify({
                messages: [
                  {
                    topic: this.subTopic,
                    event,
                    payload: endpoint_payload,
                    private: this.private
                  }
                ]
              })
            };
            try {
              const response = await this._fetchWithTimeout(this.broadcastEndpointURL, options, (_a = opts.timeout) !== null && _a !== void 0 ? _a : this.timeout);
              await ((_b = response.body) === null || _b === void 0 ? void 0 : _b.cancel());
              return response.ok ? "ok" : "error";
            } catch (error) {
              if (error.name === "AbortError") {
                return "timed out";
              } else {
                return "error";
              }
            }
          } else {
            return new Promise((resolve) => {
              var _a2, _b2, _c;
              const push = this._push(args.type, args, opts.timeout || this.timeout);
              if (args.type === "broadcast" && !((_c = (_b2 = (_a2 = this.params) === null || _a2 === void 0 ? void 0 : _a2.config) === null || _b2 === void 0 ? void 0 : _b2.broadcast) === null || _c === void 0 ? void 0 : _c.ack)) {
                resolve("ok");
              }
              push.receive("ok", () => resolve("ok"));
              push.receive("error", () => resolve("error"));
              push.receive("timeout", () => resolve("timed out"));
            });
          }
        }
        /**
         * Updates the payload that will be sent the next time the channel joins (reconnects).
         * Useful for rotating access tokens or updating config without re-creating the channel.
         */
        updateJoinPayload(payload) {
          this.joinPush.updatePayload(payload);
        }
        /**
         * Leaves the channel.
         *
         * Unsubscribes from server events, and instructs channel to terminate on server.
         * Triggers onClose() hooks.
         *
         * To receive leave acknowledgements, use the a `receive` hook to bind to the server ack, ie:
         * channel.unsubscribe().receive("ok", () => alert("left!") )
         */
        unsubscribe(timeout = this.timeout) {
          this.state = CHANNEL_STATES.leaving;
          const onClose = () => {
            this.socket.log("channel", `leave ${this.topic}`);
            this._trigger(CHANNEL_EVENTS.close, "leave", this._joinRef());
          };
          this.joinPush.destroy();
          let leavePush = null;
          return new Promise((resolve) => {
            leavePush = new Push(this, CHANNEL_EVENTS.leave, {}, timeout);
            leavePush.receive("ok", () => {
              onClose();
              resolve("ok");
            }).receive("timeout", () => {
              onClose();
              resolve("timed out");
            }).receive("error", () => {
              resolve("error");
            });
            leavePush.send();
            if (!this._canPush()) {
              leavePush.trigger("ok", {});
            }
          }).finally(() => {
            leavePush === null || leavePush === void 0 ? void 0 : leavePush.destroy();
          });
        }
        /**
         * Teardown the channel.
         *
         * Destroys and stops related timers.
         */
        teardown() {
          this.pushBuffer.forEach((push) => push.destroy());
          this.pushBuffer = [];
          this.rejoinTimer.reset();
          this.joinPush.destroy();
          this.state = CHANNEL_STATES.closed;
          this.bindings = {};
        }
        /** @internal */
        async _fetchWithTimeout(url, options, timeout) {
          const controller = new AbortController();
          const id = setTimeout(() => controller.abort(), timeout);
          const response = await this.socket.fetch(url, Object.assign(Object.assign({}, options), { signal: controller.signal }));
          clearTimeout(id);
          return response;
        }
        /** @internal */
        _push(event, payload, timeout = this.timeout) {
          if (!this.joinedOnce) {
            throw `tried to push '${event}' to '${this.topic}' before joining. Use channel.subscribe() before pushing events`;
          }
          let pushEvent = new Push(this, event, payload, timeout);
          if (this._canPush()) {
            pushEvent.send();
          } else {
            this._addToPushBuffer(pushEvent);
          }
          return pushEvent;
        }
        /** @internal */
        _addToPushBuffer(pushEvent) {
          pushEvent.startTimeout();
          this.pushBuffer.push(pushEvent);
          if (this.pushBuffer.length > MAX_PUSH_BUFFER_SIZE) {
            const removedPush = this.pushBuffer.shift();
            if (removedPush) {
              removedPush.destroy();
              this.socket.log("channel", `discarded push due to buffer overflow: ${removedPush.event}`, removedPush.payload);
            }
          }
        }
        /**
         * Overridable message hook
         *
         * Receives all events for specialized message handling before dispatching to the channel callbacks.
         * Must return the payload, modified or unmodified.
         *
         * @internal
         */
        _onMessage(_event, payload, _ref) {
          return payload;
        }
        /** @internal */
        _isMember(topic) {
          return this.topic === topic;
        }
        /** @internal */
        _joinRef() {
          return this.joinPush.ref;
        }
        /** @internal */
        _trigger(type, payload, ref) {
          var _a, _b;
          const typeLower = type.toLocaleLowerCase();
          const { close, error, leave, join } = CHANNEL_EVENTS;
          const events = [close, error, leave, join];
          if (ref && events.indexOf(typeLower) >= 0 && ref !== this._joinRef()) {
            return;
          }
          let handledPayload = this._onMessage(typeLower, payload, ref);
          if (payload && !handledPayload) {
            throw "channel onMessage callbacks must return the payload, modified or unmodified";
          }
          if (["insert", "update", "delete"].includes(typeLower)) {
            (_a = this.bindings.postgres_changes) === null || _a === void 0 ? void 0 : _a.filter((bind) => {
              var _a2, _b2, _c;
              return ((_a2 = bind.filter) === null || _a2 === void 0 ? void 0 : _a2.event) === "*" || ((_c = (_b2 = bind.filter) === null || _b2 === void 0 ? void 0 : _b2.event) === null || _c === void 0 ? void 0 : _c.toLocaleLowerCase()) === typeLower;
            }).map((bind) => bind.callback(handledPayload, ref));
          } else {
            (_b = this.bindings[typeLower]) === null || _b === void 0 ? void 0 : _b.filter((bind) => {
              var _a2, _b2, _c, _d, _e, _f;
              if (["broadcast", "presence", "postgres_changes"].includes(typeLower)) {
                if ("id" in bind) {
                  const bindId = bind.id;
                  const bindEvent = (_a2 = bind.filter) === null || _a2 === void 0 ? void 0 : _a2.event;
                  return bindId && ((_b2 = payload.ids) === null || _b2 === void 0 ? void 0 : _b2.includes(bindId)) && (bindEvent === "*" || (bindEvent === null || bindEvent === void 0 ? void 0 : bindEvent.toLocaleLowerCase()) === ((_c = payload.data) === null || _c === void 0 ? void 0 : _c.type.toLocaleLowerCase()));
                } else {
                  const bindEvent = (_e = (_d = bind === null || bind === void 0 ? void 0 : bind.filter) === null || _d === void 0 ? void 0 : _d.event) === null || _e === void 0 ? void 0 : _e.toLocaleLowerCase();
                  return bindEvent === "*" || bindEvent === ((_f = payload === null || payload === void 0 ? void 0 : payload.event) === null || _f === void 0 ? void 0 : _f.toLocaleLowerCase());
                }
              } else {
                return bind.type.toLocaleLowerCase() === typeLower;
              }
            }).map((bind) => {
              if (typeof handledPayload === "object" && "ids" in handledPayload) {
                const postgresChanges = handledPayload.data;
                const { schema, table, commit_timestamp, type: type2, errors } = postgresChanges;
                const enrichedPayload = {
                  schema,
                  table,
                  commit_timestamp,
                  eventType: type2,
                  new: {},
                  old: {},
                  errors
                };
                handledPayload = Object.assign(Object.assign({}, enrichedPayload), this._getPayloadRecords(postgresChanges));
              }
              bind.callback(handledPayload, ref);
            });
          }
        }
        /** @internal */
        _isClosed() {
          return this.state === CHANNEL_STATES.closed;
        }
        /** @internal */
        _isJoined() {
          return this.state === CHANNEL_STATES.joined;
        }
        /** @internal */
        _isJoining() {
          return this.state === CHANNEL_STATES.joining;
        }
        /** @internal */
        _isLeaving() {
          return this.state === CHANNEL_STATES.leaving;
        }
        /** @internal */
        _replyEventName(ref) {
          return `chan_reply_${ref}`;
        }
        /** @internal */
        _on(type, filter, callback) {
          const typeLower = type.toLocaleLowerCase();
          const binding = {
            type: typeLower,
            filter,
            callback
          };
          if (this.bindings[typeLower]) {
            this.bindings[typeLower].push(binding);
          } else {
            this.bindings[typeLower] = [binding];
          }
          return this;
        }
        /** @internal */
        _off(type, filter) {
          const typeLower = type.toLocaleLowerCase();
          if (this.bindings[typeLower]) {
            this.bindings[typeLower] = this.bindings[typeLower].filter((bind) => {
              var _a;
              return !(((_a = bind.type) === null || _a === void 0 ? void 0 : _a.toLocaleLowerCase()) === typeLower && _RealtimeChannel.isEqual(bind.filter, filter));
            });
          }
          return this;
        }
        /** @internal */
        static isEqual(obj1, obj2) {
          if (Object.keys(obj1).length !== Object.keys(obj2).length) {
            return false;
          }
          for (const k in obj1) {
            if (obj1[k] !== obj2[k]) {
              return false;
            }
          }
          return true;
        }
        /**
         * Compares two optional filter values for equality.
         * Treats undefined, null, and empty string as equivalent empty values.
         * @internal
         */
        static isFilterValueEqual(serverValue, clientValue) {
          const normalizedServer = serverValue !== null && serverValue !== void 0 ? serverValue : void 0;
          const normalizedClient = clientValue !== null && clientValue !== void 0 ? clientValue : void 0;
          return normalizedServer === normalizedClient;
        }
        /** @internal */
        _rejoinUntilConnected() {
          this.rejoinTimer.scheduleTimeout();
          if (this.socket.isConnected()) {
            this._rejoin();
          }
        }
        /**
         * Registers a callback that will be executed when the channel closes.
         *
         * @internal
         */
        _onClose(callback) {
          this._on(CHANNEL_EVENTS.close, {}, callback);
        }
        /**
         * Registers a callback that will be executed when the channel encounteres an error.
         *
         * @internal
         */
        _onError(callback) {
          this._on(CHANNEL_EVENTS.error, {}, (reason) => callback(reason));
        }
        /**
         * Returns `true` if the socket is connected and the channel has been joined.
         *
         * @internal
         */
        _canPush() {
          return this.socket.isConnected() && this._isJoined();
        }
        /** @internal */
        _rejoin(timeout = this.timeout) {
          if (this._isLeaving()) {
            return;
          }
          this.socket._leaveOpenTopic(this.topic);
          this.state = CHANNEL_STATES.joining;
          this.joinPush.resend(timeout);
        }
        /** @internal */
        _getPayloadRecords(payload) {
          const records = {
            new: {},
            old: {}
          };
          if (payload.type === "INSERT" || payload.type === "UPDATE") {
            records.new = convertChangeData(payload.columns, payload.record);
          }
          if (payload.type === "UPDATE" || payload.type === "DELETE") {
            records.old = convertChangeData(payload.columns, payload.old_record);
          }
          return records;
        }
      };
    }
  });

  // ../../node_modules/@supabase/realtime-js/dist/module/RealtimeClient.js
  var noop2, CONNECTION_TIMEOUTS, RECONNECT_INTERVALS, DEFAULT_RECONNECT_FALLBACK, WORKER_SCRIPT, RealtimeClient;
  var init_RealtimeClient = __esm({
    "../../node_modules/@supabase/realtime-js/dist/module/RealtimeClient.js"() {
      init_websocket_factory();
      init_constants();
      init_serializer();
      init_timer();
      init_transformers();
      init_RealtimeChannel();
      noop2 = () => {
      };
      CONNECTION_TIMEOUTS = {
        HEARTBEAT_INTERVAL: 25e3,
        RECONNECT_DELAY: 10,
        HEARTBEAT_TIMEOUT_FALLBACK: 100
      };
      RECONNECT_INTERVALS = [1e3, 2e3, 5e3, 1e4];
      DEFAULT_RECONNECT_FALLBACK = 1e4;
      WORKER_SCRIPT = `
  addEventListener("message", (e) => {
    if (e.data.event === "start") {
      setInterval(() => postMessage({ event: "keepAlive" }), e.data.interval);
    }
  });`;
      RealtimeClient = class {
        /**
         * Initializes the Socket.
         *
         * @param endPoint The string WebSocket endpoint, ie, "ws://example.com/socket", "wss://example.com", "/socket" (inherited host & protocol)
         * @param httpEndpoint The string HTTP endpoint, ie, "https://example.com", "/" (inherited host & protocol)
         * @param options.transport The Websocket Transport, for example WebSocket. This can be a custom implementation
         * @param options.timeout The default timeout in milliseconds to trigger push timeouts.
         * @param options.params The optional params to pass when connecting.
         * @param options.headers Deprecated: headers cannot be set on websocket connections and this option will be removed in the future.
         * @param options.heartbeatIntervalMs The millisec interval to send a heartbeat message.
         * @param options.heartbeatCallback The optional function to handle heartbeat status and latency.
         * @param options.logger The optional function for specialized logging, ie: logger: (kind, msg, data) => { console.log(`${kind}: ${msg}`, data) }
         * @param options.logLevel Sets the log level for Realtime
         * @param options.encode The function to encode outgoing messages. Defaults to JSON: (payload, callback) => callback(JSON.stringify(payload))
         * @param options.decode The function to decode incoming messages. Defaults to Serializer's decode.
         * @param options.reconnectAfterMs he optional function that returns the millsec reconnect interval. Defaults to stepped backoff off.
         * @param options.worker Use Web Worker to set a side flow. Defaults to false.
         * @param options.workerUrl The URL of the worker script. Defaults to https://realtime.supabase.com/worker.js that includes a heartbeat event call to keep the connection alive.
         * @param options.vsn The protocol version to use when connecting. Supported versions are "1.0.0" and "2.0.0". Defaults to "2.0.0".
         * @example
         * ```ts
         * import RealtimeClient from '@supabase/realtime-js'
         *
         * const client = new RealtimeClient('https://xyzcompany.supabase.co/realtime/v1', {
         *   params: { apikey: 'public-anon-key' },
         * })
         * client.connect()
         * ```
         */
        constructor(endPoint, options) {
          var _a;
          this.accessTokenValue = null;
          this.apiKey = null;
          this._manuallySetToken = false;
          this.channels = new Array();
          this.endPoint = "";
          this.httpEndpoint = "";
          this.headers = {};
          this.params = {};
          this.timeout = DEFAULT_TIMEOUT;
          this.transport = null;
          this.heartbeatIntervalMs = CONNECTION_TIMEOUTS.HEARTBEAT_INTERVAL;
          this.heartbeatTimer = void 0;
          this.pendingHeartbeatRef = null;
          this.heartbeatCallback = noop2;
          this.ref = 0;
          this.reconnectTimer = null;
          this.vsn = DEFAULT_VSN;
          this.logger = noop2;
          this.conn = null;
          this.sendBuffer = [];
          this.serializer = new Serializer();
          this.stateChangeCallbacks = {
            open: [],
            close: [],
            error: [],
            message: []
          };
          this.accessToken = null;
          this._connectionState = "disconnected";
          this._wasManualDisconnect = false;
          this._authPromise = null;
          this._heartbeatSentAt = null;
          this._resolveFetch = (customFetch) => {
            if (customFetch) {
              return (...args) => customFetch(...args);
            }
            return (...args) => fetch(...args);
          };
          if (!((_a = options === null || options === void 0 ? void 0 : options.params) === null || _a === void 0 ? void 0 : _a.apikey)) {
            throw new Error("API key is required to connect to Realtime");
          }
          this.apiKey = options.params.apikey;
          this.endPoint = `${endPoint}/${TRANSPORTS.websocket}`;
          this.httpEndpoint = httpEndpointURL(endPoint);
          this._initializeOptions(options);
          this._setupReconnectionTimer();
          this.fetch = this._resolveFetch(options === null || options === void 0 ? void 0 : options.fetch);
        }
        /**
         * Connects the socket, unless already connected.
         */
        connect() {
          if (this.isConnecting() || this.isDisconnecting() || this.conn !== null && this.isConnected()) {
            return;
          }
          this._setConnectionState("connecting");
          if (this.accessToken && !this._authPromise) {
            this._setAuthSafely("connect");
          }
          if (this.transport) {
            this.conn = new this.transport(this.endpointURL());
          } else {
            try {
              this.conn = websocket_factory_default.createWebSocket(this.endpointURL());
            } catch (error) {
              this._setConnectionState("disconnected");
              const errorMessage = error.message;
              if (errorMessage.includes("Node.js")) {
                throw new Error(`${errorMessage}

To use Realtime in Node.js, you need to provide a WebSocket implementation:

Option 1: Use Node.js 22+ which has native WebSocket support
Option 2: Install and provide the "ws" package:

  npm install ws

  import ws from "ws"
  const client = new RealtimeClient(url, {
    ...options,
    transport: ws
  })`);
              }
              throw new Error(`WebSocket not available: ${errorMessage}`);
            }
          }
          this._setupConnectionHandlers();
        }
        /**
         * Returns the URL of the websocket.
         * @returns string The URL of the websocket.
         */
        endpointURL() {
          return this._appendParams(this.endPoint, Object.assign({}, this.params, { vsn: this.vsn }));
        }
        /**
         * Disconnects the socket.
         *
         * @param code A numeric status code to send on disconnect.
         * @param reason A custom reason for the disconnect.
         */
        disconnect(code, reason) {
          if (this.isDisconnecting()) {
            return;
          }
          this._setConnectionState("disconnecting", true);
          if (this.conn) {
            const fallbackTimer = setTimeout(() => {
              this._setConnectionState("disconnected");
            }, 100);
            this.conn.onclose = () => {
              clearTimeout(fallbackTimer);
              this._setConnectionState("disconnected");
            };
            if (typeof this.conn.close === "function") {
              if (code) {
                this.conn.close(code, reason !== null && reason !== void 0 ? reason : "");
              } else {
                this.conn.close();
              }
            }
            this._teardownConnection();
          } else {
            this._setConnectionState("disconnected");
          }
        }
        /**
         * Returns all created channels
         */
        getChannels() {
          return this.channels;
        }
        /**
         * Unsubscribes and removes a single channel
         * @param channel A RealtimeChannel instance
         */
        async removeChannel(channel) {
          const status = await channel.unsubscribe();
          if (this.channels.length === 0) {
            this.disconnect();
          }
          return status;
        }
        /**
         * Unsubscribes and removes all channels
         */
        async removeAllChannels() {
          const values_1 = await Promise.all(this.channels.map((channel) => channel.unsubscribe()));
          this.channels = [];
          this.disconnect();
          return values_1;
        }
        /**
         * Logs the message.
         *
         * For customized logging, `this.logger` can be overridden.
         */
        log(kind, msg, data) {
          this.logger(kind, msg, data);
        }
        /**
         * Returns the current state of the socket.
         */
        connectionState() {
          switch (this.conn && this.conn.readyState) {
            case SOCKET_STATES.connecting:
              return CONNECTION_STATE.Connecting;
            case SOCKET_STATES.open:
              return CONNECTION_STATE.Open;
            case SOCKET_STATES.closing:
              return CONNECTION_STATE.Closing;
            default:
              return CONNECTION_STATE.Closed;
          }
        }
        /**
         * Returns `true` is the connection is open.
         */
        isConnected() {
          return this.connectionState() === CONNECTION_STATE.Open;
        }
        /**
         * Returns `true` if the connection is currently connecting.
         */
        isConnecting() {
          return this._connectionState === "connecting";
        }
        /**
         * Returns `true` if the connection is currently disconnecting.
         */
        isDisconnecting() {
          return this._connectionState === "disconnecting";
        }
        /**
         * Creates (or reuses) a {@link RealtimeChannel} for the provided topic.
         *
         * Topics are automatically prefixed with `realtime:` to match the Realtime service.
         * If a channel with the same topic already exists it will be returned instead of creating
         * a duplicate connection.
         */
        channel(topic, params = { config: {} }) {
          const realtimeTopic = `realtime:${topic}`;
          const exists = this.getChannels().find((c) => c.topic === realtimeTopic);
          if (!exists) {
            const chan = new RealtimeChannel(`realtime:${topic}`, params, this);
            this.channels.push(chan);
            return chan;
          } else {
            return exists;
          }
        }
        /**
         * Push out a message if the socket is connected.
         *
         * If the socket is not connected, the message gets enqueued within a local buffer, and sent out when a connection is next established.
         */
        push(data) {
          const { topic, event, payload, ref } = data;
          const callback = () => {
            this.encode(data, (result) => {
              var _a;
              (_a = this.conn) === null || _a === void 0 ? void 0 : _a.send(result);
            });
          };
          this.log("push", `${topic} ${event} (${ref})`, payload);
          if (this.isConnected()) {
            callback();
          } else {
            this.sendBuffer.push(callback);
          }
        }
        /**
         * Sets the JWT access token used for channel subscription authorization and Realtime RLS.
         *
         * If param is null it will use the `accessToken` callback function or the token set on the client.
         *
         * On callback used, it will set the value of the token internal to the client.
         *
         * When a token is explicitly provided, it will be preserved across channel operations
         * (including removeChannel and resubscribe). The `accessToken` callback will not be
         * invoked until `setAuth()` is called without arguments.
         *
         * @param token A JWT string to override the token set on the client.
         *
         * @example
         * // Use a manual token (preserved across resubscribes, ignores accessToken callback)
         * client.realtime.setAuth('my-custom-jwt')
         *
         * // Switch back to using the accessToken callback
         * client.realtime.setAuth()
         */
        async setAuth(token = null) {
          this._authPromise = this._performAuth(token);
          try {
            await this._authPromise;
          } finally {
            this._authPromise = null;
          }
        }
        /**
         * Returns true if the current access token was explicitly set via setAuth(token),
         * false if it was obtained via the accessToken callback.
         * @internal
         */
        _isManualToken() {
          return this._manuallySetToken;
        }
        /**
         * Sends a heartbeat message if the socket is connected.
         */
        async sendHeartbeat() {
          var _a;
          if (!this.isConnected()) {
            try {
              this.heartbeatCallback("disconnected");
            } catch (e) {
              this.log("error", "error in heartbeat callback", e);
            }
            return;
          }
          if (this.pendingHeartbeatRef) {
            this.pendingHeartbeatRef = null;
            this._heartbeatSentAt = null;
            this.log("transport", "heartbeat timeout. Attempting to re-establish connection");
            try {
              this.heartbeatCallback("timeout");
            } catch (e) {
              this.log("error", "error in heartbeat callback", e);
            }
            this._wasManualDisconnect = false;
            (_a = this.conn) === null || _a === void 0 ? void 0 : _a.close(WS_CLOSE_NORMAL, "heartbeat timeout");
            setTimeout(() => {
              var _a2;
              if (!this.isConnected()) {
                (_a2 = this.reconnectTimer) === null || _a2 === void 0 ? void 0 : _a2.scheduleTimeout();
              }
            }, CONNECTION_TIMEOUTS.HEARTBEAT_TIMEOUT_FALLBACK);
            return;
          }
          this._heartbeatSentAt = Date.now();
          this.pendingHeartbeatRef = this._makeRef();
          this.push({
            topic: "phoenix",
            event: "heartbeat",
            payload: {},
            ref: this.pendingHeartbeatRef
          });
          try {
            this.heartbeatCallback("sent");
          } catch (e) {
            this.log("error", "error in heartbeat callback", e);
          }
          this._setAuthSafely("heartbeat");
        }
        /**
         * Sets a callback that receives lifecycle events for internal heartbeat messages.
         * Useful for instrumenting connection health (e.g. sent/ok/timeout/disconnected).
         */
        onHeartbeat(callback) {
          this.heartbeatCallback = callback;
        }
        /**
         * Flushes send buffer
         */
        flushSendBuffer() {
          if (this.isConnected() && this.sendBuffer.length > 0) {
            this.sendBuffer.forEach((callback) => callback());
            this.sendBuffer = [];
          }
        }
        /**
         * Return the next message ref, accounting for overflows
         *
         * @internal
         */
        _makeRef() {
          let newRef = this.ref + 1;
          if (newRef === this.ref) {
            this.ref = 0;
          } else {
            this.ref = newRef;
          }
          return this.ref.toString();
        }
        /**
         * Unsubscribe from channels with the specified topic.
         *
         * @internal
         */
        _leaveOpenTopic(topic) {
          let dupChannel = this.channels.find((c) => c.topic === topic && (c._isJoined() || c._isJoining()));
          if (dupChannel) {
            this.log("transport", `leaving duplicate topic "${topic}"`);
            dupChannel.unsubscribe();
          }
        }
        /**
         * Removes a subscription from the socket.
         *
         * @param channel An open subscription.
         *
         * @internal
         */
        _remove(channel) {
          this.channels = this.channels.filter((c) => c.topic !== channel.topic);
        }
        /** @internal */
        _onConnMessage(rawMessage) {
          this.decode(rawMessage.data, (msg) => {
            if (msg.topic === "phoenix" && msg.event === "phx_reply" && msg.ref && msg.ref === this.pendingHeartbeatRef) {
              const latency = this._heartbeatSentAt ? Date.now() - this._heartbeatSentAt : void 0;
              try {
                this.heartbeatCallback(msg.payload.status === "ok" ? "ok" : "error", latency);
              } catch (e) {
                this.log("error", "error in heartbeat callback", e);
              }
              this._heartbeatSentAt = null;
              this.pendingHeartbeatRef = null;
            }
            const { topic, event, payload, ref } = msg;
            const refString = ref ? `(${ref})` : "";
            const status = payload.status || "";
            this.log("receive", `${status} ${topic} ${event} ${refString}`.trim(), payload);
            this.channels.filter((channel) => channel._isMember(topic)).forEach((channel) => channel._trigger(event, payload, ref));
            this._triggerStateCallbacks("message", msg);
          });
        }
        /**
         * Clear specific timer
         * @internal
         */
        _clearTimer(timer) {
          var _a;
          if (timer === "heartbeat" && this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = void 0;
          } else if (timer === "reconnect") {
            (_a = this.reconnectTimer) === null || _a === void 0 ? void 0 : _a.reset();
          }
        }
        /**
         * Clear all timers
         * @internal
         */
        _clearAllTimers() {
          this._clearTimer("heartbeat");
          this._clearTimer("reconnect");
        }
        /**
         * Setup connection handlers for WebSocket events
         * @internal
         */
        _setupConnectionHandlers() {
          if (!this.conn)
            return;
          if ("binaryType" in this.conn) {
            ;
            this.conn.binaryType = "arraybuffer";
          }
          this.conn.onopen = () => this._onConnOpen();
          this.conn.onerror = (error) => this._onConnError(error);
          this.conn.onmessage = (event) => this._onConnMessage(event);
          this.conn.onclose = (event) => this._onConnClose(event);
          if (this.conn.readyState === SOCKET_STATES.open) {
            this._onConnOpen();
          }
        }
        /**
         * Teardown connection and cleanup resources
         * @internal
         */
        _teardownConnection() {
          if (this.conn) {
            if (this.conn.readyState === SOCKET_STATES.open || this.conn.readyState === SOCKET_STATES.connecting) {
              try {
                this.conn.close();
              } catch (e) {
                this.log("error", "Error closing connection", e);
              }
            }
            this.conn.onopen = null;
            this.conn.onerror = null;
            this.conn.onmessage = null;
            this.conn.onclose = null;
            this.conn = null;
          }
          this._clearAllTimers();
          this._terminateWorker();
          this.channels.forEach((channel) => channel.teardown());
        }
        /** @internal */
        _onConnOpen() {
          this._setConnectionState("connected");
          this.log("transport", `connected to ${this.endpointURL()}`);
          const authPromise = this._authPromise || (this.accessToken && !this.accessTokenValue ? this.setAuth() : Promise.resolve());
          authPromise.then(() => {
            this.flushSendBuffer();
          }).catch((e) => {
            this.log("error", "error waiting for auth on connect", e);
            this.flushSendBuffer();
          });
          this._clearTimer("reconnect");
          if (!this.worker) {
            this._startHeartbeat();
          } else {
            if (!this.workerRef) {
              this._startWorkerHeartbeat();
            }
          }
          this._triggerStateCallbacks("open");
        }
        /** @internal */
        _startHeartbeat() {
          this.heartbeatTimer && clearInterval(this.heartbeatTimer);
          this.heartbeatTimer = setInterval(() => this.sendHeartbeat(), this.heartbeatIntervalMs);
        }
        /** @internal */
        _startWorkerHeartbeat() {
          if (this.workerUrl) {
            this.log("worker", `starting worker for from ${this.workerUrl}`);
          } else {
            this.log("worker", `starting default worker`);
          }
          const objectUrl = this._workerObjectUrl(this.workerUrl);
          this.workerRef = new Worker(objectUrl);
          this.workerRef.onerror = (error) => {
            this.log("worker", "worker error", error.message);
            this._terminateWorker();
          };
          this.workerRef.onmessage = (event) => {
            if (event.data.event === "keepAlive") {
              this.sendHeartbeat();
            }
          };
          this.workerRef.postMessage({
            event: "start",
            interval: this.heartbeatIntervalMs
          });
        }
        /**
         * Terminate the Web Worker and clear the reference
         * @internal
         */
        _terminateWorker() {
          if (this.workerRef) {
            this.log("worker", "terminating worker");
            this.workerRef.terminate();
            this.workerRef = void 0;
          }
        }
        /** @internal */
        _onConnClose(event) {
          var _a;
          this._setConnectionState("disconnected");
          this.log("transport", "close", event);
          this._triggerChanError();
          this._clearTimer("heartbeat");
          if (!this._wasManualDisconnect) {
            (_a = this.reconnectTimer) === null || _a === void 0 ? void 0 : _a.scheduleTimeout();
          }
          this._triggerStateCallbacks("close", event);
        }
        /** @internal */
        _onConnError(error) {
          this._setConnectionState("disconnected");
          this.log("transport", `${error}`);
          this._triggerChanError();
          this._triggerStateCallbacks("error", error);
          try {
            this.heartbeatCallback("error");
          } catch (e) {
            this.log("error", "error in heartbeat callback", e);
          }
        }
        /** @internal */
        _triggerChanError() {
          this.channels.forEach((channel) => channel._trigger(CHANNEL_EVENTS.error));
        }
        /** @internal */
        _appendParams(url, params) {
          if (Object.keys(params).length === 0) {
            return url;
          }
          const prefix = url.match(/\?/) ? "&" : "?";
          const query = new URLSearchParams(params);
          return `${url}${prefix}${query}`;
        }
        _workerObjectUrl(url) {
          let result_url;
          if (url) {
            result_url = url;
          } else {
            const blob = new Blob([WORKER_SCRIPT], { type: "application/javascript" });
            result_url = URL.createObjectURL(blob);
          }
          return result_url;
        }
        /**
         * Set connection state with proper state management
         * @internal
         */
        _setConnectionState(state, manual = false) {
          this._connectionState = state;
          if (state === "connecting") {
            this._wasManualDisconnect = false;
          } else if (state === "disconnecting") {
            this._wasManualDisconnect = manual;
          }
        }
        /**
         * Perform the actual auth operation
         * @internal
         */
        async _performAuth(token = null) {
          let tokenToSend;
          let isManualToken = false;
          if (token) {
            tokenToSend = token;
            isManualToken = true;
          } else if (this.accessToken) {
            try {
              tokenToSend = await this.accessToken();
            } catch (e) {
              this.log("error", "Error fetching access token from callback", e);
              tokenToSend = this.accessTokenValue;
            }
          } else {
            tokenToSend = this.accessTokenValue;
          }
          if (isManualToken) {
            this._manuallySetToken = true;
          } else if (this.accessToken) {
            this._manuallySetToken = false;
          }
          if (this.accessTokenValue != tokenToSend) {
            this.accessTokenValue = tokenToSend;
            this.channels.forEach((channel) => {
              const payload = {
                access_token: tokenToSend,
                version: DEFAULT_VERSION
              };
              tokenToSend && channel.updateJoinPayload(payload);
              if (channel.joinedOnce && channel._isJoined()) {
                channel._push(CHANNEL_EVENTS.access_token, {
                  access_token: tokenToSend
                });
              }
            });
          }
        }
        /**
         * Wait for any in-flight auth operations to complete
         * @internal
         */
        async _waitForAuthIfNeeded() {
          if (this._authPromise) {
            await this._authPromise;
          }
        }
        /**
         * Safely call setAuth with standardized error handling
         * @internal
         */
        _setAuthSafely(context = "general") {
          if (!this._isManualToken()) {
            this.setAuth().catch((e) => {
              this.log("error", `Error setting auth in ${context}`, e);
            });
          }
        }
        /**
         * Trigger state change callbacks with proper error handling
         * @internal
         */
        _triggerStateCallbacks(event, data) {
          try {
            this.stateChangeCallbacks[event].forEach((callback) => {
              try {
                callback(data);
              } catch (e) {
                this.log("error", `error in ${event} callback`, e);
              }
            });
          } catch (e) {
            this.log("error", `error triggering ${event} callbacks`, e);
          }
        }
        /**
         * Setup reconnection timer with proper configuration
         * @internal
         */
        _setupReconnectionTimer() {
          this.reconnectTimer = new Timer(async () => {
            setTimeout(async () => {
              await this._waitForAuthIfNeeded();
              if (!this.isConnected()) {
                this.connect();
              }
            }, CONNECTION_TIMEOUTS.RECONNECT_DELAY);
          }, this.reconnectAfterMs);
        }
        /**
         * Initialize client options with defaults
         * @internal
         */
        _initializeOptions(options) {
          var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
          this.transport = (_a = options === null || options === void 0 ? void 0 : options.transport) !== null && _a !== void 0 ? _a : null;
          this.timeout = (_b = options === null || options === void 0 ? void 0 : options.timeout) !== null && _b !== void 0 ? _b : DEFAULT_TIMEOUT;
          this.heartbeatIntervalMs = (_c = options === null || options === void 0 ? void 0 : options.heartbeatIntervalMs) !== null && _c !== void 0 ? _c : CONNECTION_TIMEOUTS.HEARTBEAT_INTERVAL;
          this.worker = (_d = options === null || options === void 0 ? void 0 : options.worker) !== null && _d !== void 0 ? _d : false;
          this.accessToken = (_e = options === null || options === void 0 ? void 0 : options.accessToken) !== null && _e !== void 0 ? _e : null;
          this.heartbeatCallback = (_f = options === null || options === void 0 ? void 0 : options.heartbeatCallback) !== null && _f !== void 0 ? _f : noop2;
          this.vsn = (_g = options === null || options === void 0 ? void 0 : options.vsn) !== null && _g !== void 0 ? _g : DEFAULT_VSN;
          if (options === null || options === void 0 ? void 0 : options.params)
            this.params = options.params;
          if (options === null || options === void 0 ? void 0 : options.logger)
            this.logger = options.logger;
          if ((options === null || options === void 0 ? void 0 : options.logLevel) || (options === null || options === void 0 ? void 0 : options.log_level)) {
            this.logLevel = options.logLevel || options.log_level;
            this.params = Object.assign(Object.assign({}, this.params), { log_level: this.logLevel });
          }
          this.reconnectAfterMs = (_h = options === null || options === void 0 ? void 0 : options.reconnectAfterMs) !== null && _h !== void 0 ? _h : (tries) => {
            return RECONNECT_INTERVALS[tries - 1] || DEFAULT_RECONNECT_FALLBACK;
          };
          switch (this.vsn) {
            case VSN_1_0_0:
              this.encode = (_j = options === null || options === void 0 ? void 0 : options.encode) !== null && _j !== void 0 ? _j : (payload, callback) => {
                return callback(JSON.stringify(payload));
              };
              this.decode = (_k = options === null || options === void 0 ? void 0 : options.decode) !== null && _k !== void 0 ? _k : (payload, callback) => {
                return callback(JSON.parse(payload));
              };
              break;
            case VSN_2_0_0:
              this.encode = (_l = options === null || options === void 0 ? void 0 : options.encode) !== null && _l !== void 0 ? _l : this.serializer.encode.bind(this.serializer);
              this.decode = (_m = options === null || options === void 0 ? void 0 : options.decode) !== null && _m !== void 0 ? _m : this.serializer.decode.bind(this.serializer);
              break;
            default:
              throw new Error(`Unsupported serializer version: ${this.vsn}`);
          }
          if (this.worker) {
            if (typeof window !== "undefined" && !window.Worker) {
              throw new Error("Web Worker is not supported");
            }
            this.workerUrl = options === null || options === void 0 ? void 0 : options.workerUrl;
          }
        }
      };
    }
  });

  // ../../node_modules/@supabase/realtime-js/dist/module/index.js
  var init_module2 = __esm({
    "../../node_modules/@supabase/realtime-js/dist/module/index.js"() {
      init_RealtimeClient();
      init_RealtimeChannel();
      init_RealtimePresence();
      init_websocket_factory();
    }
  });

  // ../../node_modules/iceberg-js/dist/index.mjs
  function buildUrl(baseUrl, path, query) {
    const url = new URL(path, baseUrl);
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== void 0) {
          url.searchParams.set(key, value);
        }
      }
    }
    return url.toString();
  }
  async function buildAuthHeaders(auth) {
    if (!auth || auth.type === "none") {
      return {};
    }
    if (auth.type === "bearer") {
      return { Authorization: `Bearer ${auth.token}` };
    }
    if (auth.type === "header") {
      return { [auth.name]: auth.value };
    }
    if (auth.type === "custom") {
      return await auth.getHeaders();
    }
    return {};
  }
  function createFetchClient(options) {
    const fetchFn = options.fetchImpl ?? globalThis.fetch;
    return {
      async request({
        method,
        path,
        query,
        body,
        headers
      }) {
        const url = buildUrl(options.baseUrl, path, query);
        const authHeaders = await buildAuthHeaders(options.auth);
        const res = await fetchFn(url, {
          method,
          headers: {
            ...body ? { "Content-Type": "application/json" } : {},
            ...authHeaders,
            ...headers
          },
          body: body ? JSON.stringify(body) : void 0
        });
        const text = await res.text();
        const isJson = (res.headers.get("content-type") || "").includes("application/json");
        const data = isJson && text ? JSON.parse(text) : text;
        if (!res.ok) {
          const errBody = isJson ? data : void 0;
          const errorDetail = errBody?.error;
          throw new IcebergError(
            errorDetail?.message ?? `Request failed with status ${res.status}`,
            {
              status: res.status,
              icebergType: errorDetail?.type,
              icebergCode: errorDetail?.code,
              details: errBody
            }
          );
        }
        return { status: res.status, headers: res.headers, data };
      }
    };
  }
  function namespaceToPath(namespace) {
    return namespace.join("");
  }
  function namespaceToPath2(namespace) {
    return namespace.join("");
  }
  var IcebergError, NamespaceOperations, TableOperations, IcebergRestCatalog;
  var init_dist2 = __esm({
    "../../node_modules/iceberg-js/dist/index.mjs"() {
      IcebergError = class extends Error {
        constructor(message, opts) {
          super(message);
          this.name = "IcebergError";
          this.status = opts.status;
          this.icebergType = opts.icebergType;
          this.icebergCode = opts.icebergCode;
          this.details = opts.details;
          this.isCommitStateUnknown = opts.icebergType === "CommitStateUnknownException" || [500, 502, 504].includes(opts.status) && opts.icebergType?.includes("CommitState") === true;
        }
        /**
         * Returns true if the error is a 404 Not Found error.
         */
        isNotFound() {
          return this.status === 404;
        }
        /**
         * Returns true if the error is a 409 Conflict error.
         */
        isConflict() {
          return this.status === 409;
        }
        /**
         * Returns true if the error is a 419 Authentication Timeout error.
         */
        isAuthenticationTimeout() {
          return this.status === 419;
        }
      };
      NamespaceOperations = class {
        constructor(client, prefix = "") {
          this.client = client;
          this.prefix = prefix;
        }
        async listNamespaces(parent) {
          const query = parent ? { parent: namespaceToPath(parent.namespace) } : void 0;
          const response = await this.client.request({
            method: "GET",
            path: `${this.prefix}/namespaces`,
            query
          });
          return response.data.namespaces.map((ns) => ({ namespace: ns }));
        }
        async createNamespace(id, metadata) {
          const request = {
            namespace: id.namespace,
            properties: metadata?.properties
          };
          const response = await this.client.request({
            method: "POST",
            path: `${this.prefix}/namespaces`,
            body: request
          });
          return response.data;
        }
        async dropNamespace(id) {
          await this.client.request({
            method: "DELETE",
            path: `${this.prefix}/namespaces/${namespaceToPath(id.namespace)}`
          });
        }
        async loadNamespaceMetadata(id) {
          const response = await this.client.request({
            method: "GET",
            path: `${this.prefix}/namespaces/${namespaceToPath(id.namespace)}`
          });
          return {
            properties: response.data.properties
          };
        }
        async namespaceExists(id) {
          try {
            await this.client.request({
              method: "HEAD",
              path: `${this.prefix}/namespaces/${namespaceToPath(id.namespace)}`
            });
            return true;
          } catch (error) {
            if (error instanceof IcebergError && error.status === 404) {
              return false;
            }
            throw error;
          }
        }
        async createNamespaceIfNotExists(id, metadata) {
          try {
            return await this.createNamespace(id, metadata);
          } catch (error) {
            if (error instanceof IcebergError && error.status === 409) {
              return;
            }
            throw error;
          }
        }
      };
      TableOperations = class {
        constructor(client, prefix = "", accessDelegation) {
          this.client = client;
          this.prefix = prefix;
          this.accessDelegation = accessDelegation;
        }
        async listTables(namespace) {
          const response = await this.client.request({
            method: "GET",
            path: `${this.prefix}/namespaces/${namespaceToPath2(namespace.namespace)}/tables`
          });
          return response.data.identifiers;
        }
        async createTable(namespace, request) {
          const headers = {};
          if (this.accessDelegation) {
            headers["X-Iceberg-Access-Delegation"] = this.accessDelegation;
          }
          const response = await this.client.request({
            method: "POST",
            path: `${this.prefix}/namespaces/${namespaceToPath2(namespace.namespace)}/tables`,
            body: request,
            headers
          });
          return response.data.metadata;
        }
        async updateTable(id, request) {
          const response = await this.client.request({
            method: "POST",
            path: `${this.prefix}/namespaces/${namespaceToPath2(id.namespace)}/tables/${id.name}`,
            body: request
          });
          return {
            "metadata-location": response.data["metadata-location"],
            metadata: response.data.metadata
          };
        }
        async dropTable(id, options) {
          await this.client.request({
            method: "DELETE",
            path: `${this.prefix}/namespaces/${namespaceToPath2(id.namespace)}/tables/${id.name}`,
            query: { purgeRequested: String(options?.purge ?? false) }
          });
        }
        async loadTable(id) {
          const headers = {};
          if (this.accessDelegation) {
            headers["X-Iceberg-Access-Delegation"] = this.accessDelegation;
          }
          const response = await this.client.request({
            method: "GET",
            path: `${this.prefix}/namespaces/${namespaceToPath2(id.namespace)}/tables/${id.name}`,
            headers
          });
          return response.data.metadata;
        }
        async tableExists(id) {
          const headers = {};
          if (this.accessDelegation) {
            headers["X-Iceberg-Access-Delegation"] = this.accessDelegation;
          }
          try {
            await this.client.request({
              method: "HEAD",
              path: `${this.prefix}/namespaces/${namespaceToPath2(id.namespace)}/tables/${id.name}`,
              headers
            });
            return true;
          } catch (error) {
            if (error instanceof IcebergError && error.status === 404) {
              return false;
            }
            throw error;
          }
        }
        async createTableIfNotExists(namespace, request) {
          try {
            return await this.createTable(namespace, request);
          } catch (error) {
            if (error instanceof IcebergError && error.status === 409) {
              return await this.loadTable({ namespace: namespace.namespace, name: request.name });
            }
            throw error;
          }
        }
      };
      IcebergRestCatalog = class {
        /**
         * Creates a new Iceberg REST Catalog client.
         *
         * @param options - Configuration options for the catalog client
         */
        constructor(options) {
          let prefix = "v1";
          if (options.catalogName) {
            prefix += `/${options.catalogName}`;
          }
          const baseUrl = options.baseUrl.endsWith("/") ? options.baseUrl : `${options.baseUrl}/`;
          this.client = createFetchClient({
            baseUrl,
            auth: options.auth,
            fetchImpl: options.fetch
          });
          this.accessDelegation = options.accessDelegation?.join(",");
          this.namespaceOps = new NamespaceOperations(this.client, prefix);
          this.tableOps = new TableOperations(this.client, prefix, this.accessDelegation);
        }
        /**
         * Lists all namespaces in the catalog.
         *
         * @param parent - Optional parent namespace to list children under
         * @returns Array of namespace identifiers
         *
         * @example
         * ```typescript
         * // List all top-level namespaces
         * const namespaces = await catalog.listNamespaces();
         *
         * // List namespaces under a parent
         * const children = await catalog.listNamespaces({ namespace: ['analytics'] });
         * ```
         */
        async listNamespaces(parent) {
          return this.namespaceOps.listNamespaces(parent);
        }
        /**
         * Creates a new namespace in the catalog.
         *
         * @param id - Namespace identifier to create
         * @param metadata - Optional metadata properties for the namespace
         * @returns Response containing the created namespace and its properties
         *
         * @example
         * ```typescript
         * const response = await catalog.createNamespace(
         *   { namespace: ['analytics'] },
         *   { properties: { owner: 'data-team' } }
         * );
         * console.log(response.namespace); // ['analytics']
         * console.log(response.properties); // { owner: 'data-team', ... }
         * ```
         */
        async createNamespace(id, metadata) {
          return this.namespaceOps.createNamespace(id, metadata);
        }
        /**
         * Drops a namespace from the catalog.
         *
         * The namespace must be empty (contain no tables) before it can be dropped.
         *
         * @param id - Namespace identifier to drop
         *
         * @example
         * ```typescript
         * await catalog.dropNamespace({ namespace: ['analytics'] });
         * ```
         */
        async dropNamespace(id) {
          await this.namespaceOps.dropNamespace(id);
        }
        /**
         * Loads metadata for a namespace.
         *
         * @param id - Namespace identifier to load
         * @returns Namespace metadata including properties
         *
         * @example
         * ```typescript
         * const metadata = await catalog.loadNamespaceMetadata({ namespace: ['analytics'] });
         * console.log(metadata.properties);
         * ```
         */
        async loadNamespaceMetadata(id) {
          return this.namespaceOps.loadNamespaceMetadata(id);
        }
        /**
         * Lists all tables in a namespace.
         *
         * @param namespace - Namespace identifier to list tables from
         * @returns Array of table identifiers
         *
         * @example
         * ```typescript
         * const tables = await catalog.listTables({ namespace: ['analytics'] });
         * console.log(tables); // [{ namespace: ['analytics'], name: 'events' }, ...]
         * ```
         */
        async listTables(namespace) {
          return this.tableOps.listTables(namespace);
        }
        /**
         * Creates a new table in the catalog.
         *
         * @param namespace - Namespace to create the table in
         * @param request - Table creation request including name, schema, partition spec, etc.
         * @returns Table metadata for the created table
         *
         * @example
         * ```typescript
         * const metadata = await catalog.createTable(
         *   { namespace: ['analytics'] },
         *   {
         *     name: 'events',
         *     schema: {
         *       type: 'struct',
         *       fields: [
         *         { id: 1, name: 'id', type: 'long', required: true },
         *         { id: 2, name: 'timestamp', type: 'timestamp', required: true }
         *       ],
         *       'schema-id': 0
         *     },
         *     'partition-spec': {
         *       'spec-id': 0,
         *       fields: [
         *         { source_id: 2, field_id: 1000, name: 'ts_day', transform: 'day' }
         *       ]
         *     }
         *   }
         * );
         * ```
         */
        async createTable(namespace, request) {
          return this.tableOps.createTable(namespace, request);
        }
        /**
         * Updates an existing table's metadata.
         *
         * Can update the schema, partition spec, or properties of a table.
         *
         * @param id - Table identifier to update
         * @param request - Update request with fields to modify
         * @returns Response containing the metadata location and updated table metadata
         *
         * @example
         * ```typescript
         * const response = await catalog.updateTable(
         *   { namespace: ['analytics'], name: 'events' },
         *   {
         *     properties: { 'read.split.target-size': '134217728' }
         *   }
         * );
         * console.log(response['metadata-location']); // s3://...
         * console.log(response.metadata); // TableMetadata object
         * ```
         */
        async updateTable(id, request) {
          return this.tableOps.updateTable(id, request);
        }
        /**
         * Drops a table from the catalog.
         *
         * @param id - Table identifier to drop
         *
         * @example
         * ```typescript
         * await catalog.dropTable({ namespace: ['analytics'], name: 'events' });
         * ```
         */
        async dropTable(id, options) {
          await this.tableOps.dropTable(id, options);
        }
        /**
         * Loads metadata for a table.
         *
         * @param id - Table identifier to load
         * @returns Table metadata including schema, partition spec, location, etc.
         *
         * @example
         * ```typescript
         * const metadata = await catalog.loadTable({ namespace: ['analytics'], name: 'events' });
         * console.log(metadata.schema);
         * console.log(metadata.location);
         * ```
         */
        async loadTable(id) {
          return this.tableOps.loadTable(id);
        }
        /**
         * Checks if a namespace exists in the catalog.
         *
         * @param id - Namespace identifier to check
         * @returns True if the namespace exists, false otherwise
         *
         * @example
         * ```typescript
         * const exists = await catalog.namespaceExists({ namespace: ['analytics'] });
         * console.log(exists); // true or false
         * ```
         */
        async namespaceExists(id) {
          return this.namespaceOps.namespaceExists(id);
        }
        /**
         * Checks if a table exists in the catalog.
         *
         * @param id - Table identifier to check
         * @returns True if the table exists, false otherwise
         *
         * @example
         * ```typescript
         * const exists = await catalog.tableExists({ namespace: ['analytics'], name: 'events' });
         * console.log(exists); // true or false
         * ```
         */
        async tableExists(id) {
          return this.tableOps.tableExists(id);
        }
        /**
         * Creates a namespace if it does not exist.
         *
         * If the namespace already exists, returns void. If created, returns the response.
         *
         * @param id - Namespace identifier to create
         * @param metadata - Optional metadata properties for the namespace
         * @returns Response containing the created namespace and its properties, or void if it already exists
         *
         * @example
         * ```typescript
         * const response = await catalog.createNamespaceIfNotExists(
         *   { namespace: ['analytics'] },
         *   { properties: { owner: 'data-team' } }
         * );
         * if (response) {
         *   console.log('Created:', response.namespace);
         * } else {
         *   console.log('Already exists');
         * }
         * ```
         */
        async createNamespaceIfNotExists(id, metadata) {
          return this.namespaceOps.createNamespaceIfNotExists(id, metadata);
        }
        /**
         * Creates a table if it does not exist.
         *
         * If the table already exists, returns its metadata instead.
         *
         * @param namespace - Namespace to create the table in
         * @param request - Table creation request including name, schema, partition spec, etc.
         * @returns Table metadata for the created or existing table
         *
         * @example
         * ```typescript
         * const metadata = await catalog.createTableIfNotExists(
         *   { namespace: ['analytics'] },
         *   {
         *     name: 'events',
         *     schema: {
         *       type: 'struct',
         *       fields: [
         *         { id: 1, name: 'id', type: 'long', required: true },
         *         { id: 2, name: 'timestamp', type: 'timestamp', required: true }
         *       ],
         *       'schema-id': 0
         *     }
         *   }
         * );
         * ```
         */
        async createTableIfNotExists(namespace, request) {
          return this.tableOps.createTableIfNotExists(namespace, request);
        }
      };
    }
  });

  // ../../node_modules/@supabase/storage-js/dist/index.mjs
  function isStorageError(error) {
    return typeof error === "object" && error !== null && "__isStorageError" in error;
  }
  function _typeof(o) {
    "@babel/helpers - typeof";
    return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o$1) {
      return typeof o$1;
    } : function(o$1) {
      return o$1 && "function" == typeof Symbol && o$1.constructor === Symbol && o$1 !== Symbol.prototype ? "symbol" : typeof o$1;
    }, _typeof(o);
  }
  function toPrimitive(t, r) {
    if ("object" != _typeof(t) || !t)
      return t;
    var e = t[Symbol.toPrimitive];
    if (void 0 !== e) {
      var i = e.call(t, r || "default");
      if ("object" != _typeof(i))
        return i;
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return ("string" === r ? String : Number)(t);
  }
  function toPropertyKey(t) {
    var i = toPrimitive(t, "string");
    return "symbol" == _typeof(i) ? i : i + "";
  }
  function _defineProperty(e, r, t) {
    return (r = toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
      value: t,
      enumerable: true,
      configurable: true,
      writable: true
    }) : e[r] = t, e;
  }
  function ownKeys(e, r) {
    var t = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
      var o = Object.getOwnPropertySymbols(e);
      r && (o = o.filter(function(r$1) {
        return Object.getOwnPropertyDescriptor(e, r$1).enumerable;
      })), t.push.apply(t, o);
    }
    return t;
  }
  function _objectSpread2(e) {
    for (var r = 1; r < arguments.length; r++) {
      var t = null != arguments[r] ? arguments[r] : {};
      r % 2 ? ownKeys(Object(t), true).forEach(function(r$1) {
        _defineProperty(e, r$1, t[r$1]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function(r$1) {
        Object.defineProperty(e, r$1, Object.getOwnPropertyDescriptor(t, r$1));
      });
    }
    return e;
  }
  async function _handleRequest(fetcher, method, url, options, parameters, body, namespace) {
    return new Promise((resolve, reject) => {
      fetcher(url, _getRequestParams(method, options, parameters, body)).then((result) => {
        if (!result.ok)
          throw result;
        if (options === null || options === void 0 ? void 0 : options.noResolveJson)
          return result;
        if (namespace === "vectors") {
          const contentType = result.headers.get("content-type");
          if (result.headers.get("content-length") === "0" || result.status === 204)
            return {};
          if (!contentType || !contentType.includes("application/json"))
            return {};
        }
        return result.json();
      }).then((data) => resolve(data)).catch((error) => handleError(error, reject, options, namespace));
    });
  }
  function createFetchApi(namespace = "storage") {
    return {
      get: async (fetcher, url, options, parameters) => {
        return _handleRequest(fetcher, "GET", url, options, parameters, void 0, namespace);
      },
      post: async (fetcher, url, body, options, parameters) => {
        return _handleRequest(fetcher, "POST", url, options, parameters, body, namespace);
      },
      put: async (fetcher, url, body, options, parameters) => {
        return _handleRequest(fetcher, "PUT", url, options, parameters, body, namespace);
      },
      head: async (fetcher, url, options, parameters) => {
        return _handleRequest(fetcher, "HEAD", url, _objectSpread2(_objectSpread2({}, options), {}, { noResolveJson: true }), parameters, void 0, namespace);
      },
      remove: async (fetcher, url, body, options, parameters) => {
        return _handleRequest(fetcher, "DELETE", url, options, parameters, body, namespace);
      }
    };
  }
  var StorageError, StorageApiError, StorageUnknownError, resolveFetch2, isPlainObject, recursiveToCamel, isValidBucketName, _getErrorMessage, handleError, _getRequestParams, defaultApi, get, post, put, head, remove, vectorsApi, BaseApiClient, StreamDownloadBuilder, _Symbol$toStringTag, BlobDownloadBuilder, DEFAULT_SEARCH_OPTIONS, DEFAULT_FILE_OPTIONS, StorageFileApi, version2, DEFAULT_HEADERS, StorageBucketApi, StorageAnalyticsClient, VectorIndexApi, VectorDataApi, VectorBucketApi, StorageVectorsClient, VectorBucketScope, VectorIndexScope, StorageClient;
  var init_dist3 = __esm({
    "../../node_modules/@supabase/storage-js/dist/index.mjs"() {
      init_dist2();
      StorageError = class extends Error {
        constructor(message, namespace = "storage", status, statusCode) {
          super(message);
          this.__isStorageError = true;
          this.namespace = namespace;
          this.name = namespace === "vectors" ? "StorageVectorsError" : "StorageError";
          this.status = status;
          this.statusCode = statusCode;
        }
      };
      StorageApiError = class extends StorageError {
        constructor(message, status, statusCode, namespace = "storage") {
          super(message, namespace, status, statusCode);
          this.name = namespace === "vectors" ? "StorageVectorsApiError" : "StorageApiError";
          this.status = status;
          this.statusCode = statusCode;
        }
        toJSON() {
          return {
            name: this.name,
            message: this.message,
            status: this.status,
            statusCode: this.statusCode
          };
        }
      };
      StorageUnknownError = class extends StorageError {
        constructor(message, originalError, namespace = "storage") {
          super(message, namespace);
          this.name = namespace === "vectors" ? "StorageVectorsUnknownError" : "StorageUnknownError";
          this.originalError = originalError;
        }
      };
      resolveFetch2 = (customFetch) => {
        if (customFetch)
          return (...args) => customFetch(...args);
        return (...args) => fetch(...args);
      };
      isPlainObject = (value) => {
        if (typeof value !== "object" || value === null)
          return false;
        const prototype = Object.getPrototypeOf(value);
        return (prototype === null || prototype === Object.prototype || Object.getPrototypeOf(prototype) === null) && !(Symbol.toStringTag in value) && !(Symbol.iterator in value);
      };
      recursiveToCamel = (item) => {
        if (Array.isArray(item))
          return item.map((el) => recursiveToCamel(el));
        else if (typeof item === "function" || item !== Object(item))
          return item;
        const result = {};
        Object.entries(item).forEach(([key, value]) => {
          const newKey = key.replace(/([-_][a-z])/gi, (c) => c.toUpperCase().replace(/[-_]/g, ""));
          result[newKey] = recursiveToCamel(value);
        });
        return result;
      };
      isValidBucketName = (bucketName) => {
        if (!bucketName || typeof bucketName !== "string")
          return false;
        if (bucketName.length === 0 || bucketName.length > 100)
          return false;
        if (bucketName.trim() !== bucketName)
          return false;
        if (bucketName.includes("/") || bucketName.includes("\\"))
          return false;
        return /^[\w!.\*'() &$@=;:+,?-]+$/.test(bucketName);
      };
      _getErrorMessage = (err) => {
        var _err$error;
        return err.msg || err.message || err.error_description || (typeof err.error === "string" ? err.error : (_err$error = err.error) === null || _err$error === void 0 ? void 0 : _err$error.message) || JSON.stringify(err);
      };
      handleError = async (error, reject, options, namespace) => {
        if (error && typeof error === "object" && "status" in error && "ok" in error && typeof error.status === "number" && !(options === null || options === void 0 ? void 0 : options.noResolveJson)) {
          const responseError = error;
          const status = responseError.status || 500;
          if (typeof responseError.json === "function")
            responseError.json().then((err) => {
              const statusCode = (err === null || err === void 0 ? void 0 : err.statusCode) || (err === null || err === void 0 ? void 0 : err.code) || status + "";
              reject(new StorageApiError(_getErrorMessage(err), status, statusCode, namespace));
            }).catch(() => {
              if (namespace === "vectors") {
                const statusCode = status + "";
                reject(new StorageApiError(responseError.statusText || `HTTP ${status} error`, status, statusCode, namespace));
              } else {
                const statusCode = status + "";
                reject(new StorageApiError(responseError.statusText || `HTTP ${status} error`, status, statusCode, namespace));
              }
            });
          else {
            const statusCode = status + "";
            reject(new StorageApiError(responseError.statusText || `HTTP ${status} error`, status, statusCode, namespace));
          }
        } else
          reject(new StorageUnknownError(_getErrorMessage(error), error, namespace));
      };
      _getRequestParams = (method, options, parameters, body) => {
        const params = {
          method,
          headers: (options === null || options === void 0 ? void 0 : options.headers) || {}
        };
        if (method === "GET" || method === "HEAD" || !body)
          return _objectSpread2(_objectSpread2({}, params), parameters);
        if (isPlainObject(body)) {
          params.headers = _objectSpread2({ "Content-Type": "application/json" }, options === null || options === void 0 ? void 0 : options.headers);
          params.body = JSON.stringify(body);
        } else
          params.body = body;
        if (options === null || options === void 0 ? void 0 : options.duplex)
          params.duplex = options.duplex;
        return _objectSpread2(_objectSpread2({}, params), parameters);
      };
      defaultApi = createFetchApi("storage");
      ({ get, post, put, head, remove } = defaultApi);
      vectorsApi = createFetchApi("vectors");
      BaseApiClient = class {
        /**
        * Creates a new BaseApiClient instance
        * @param url - Base URL for API requests
        * @param headers - Default headers for API requests
        * @param fetch - Optional custom fetch implementation
        * @param namespace - Error namespace ('storage' or 'vectors')
        */
        constructor(url, headers = {}, fetch$1, namespace = "storage") {
          this.shouldThrowOnError = false;
          this.url = url;
          this.headers = headers;
          this.fetch = resolveFetch2(fetch$1);
          this.namespace = namespace;
        }
        /**
        * Enable throwing errors instead of returning them.
        * When enabled, errors are thrown instead of returned in { data, error } format.
        *
        * @returns this - For method chaining
        */
        throwOnError() {
          this.shouldThrowOnError = true;
          return this;
        }
        /**
        * Handles API operation with standardized error handling
        * Eliminates repetitive try-catch blocks across all API methods
        *
        * This wrapper:
        * 1. Executes the operation
        * 2. Returns { data, error: null } on success
        * 3. Returns { data: null, error } on failure (if shouldThrowOnError is false)
        * 4. Throws error on failure (if shouldThrowOnError is true)
        *
        * @typeParam T - The expected data type from the operation
        * @param operation - Async function that performs the API call
        * @returns Promise with { data, error } tuple
        *
        * @example
        * ```typescript
        * async listBuckets() {
        *   return this.handleOperation(async () => {
        *     return await get(this.fetch, `${this.url}/bucket`, {
        *       headers: this.headers,
        *     })
        *   })
        * }
        * ```
        */
        async handleOperation(operation) {
          var _this = this;
          try {
            return {
              data: await operation(),
              error: null
            };
          } catch (error) {
            if (_this.shouldThrowOnError)
              throw error;
            if (isStorageError(error))
              return {
                data: null,
                error
              };
            throw error;
          }
        }
      };
      StreamDownloadBuilder = class {
        constructor(downloadFn, shouldThrowOnError) {
          this.downloadFn = downloadFn;
          this.shouldThrowOnError = shouldThrowOnError;
        }
        then(onfulfilled, onrejected) {
          return this.execute().then(onfulfilled, onrejected);
        }
        async execute() {
          var _this = this;
          try {
            return {
              data: (await _this.downloadFn()).body,
              error: null
            };
          } catch (error) {
            if (_this.shouldThrowOnError)
              throw error;
            if (isStorageError(error))
              return {
                data: null,
                error
              };
            throw error;
          }
        }
      };
      _Symbol$toStringTag = Symbol.toStringTag;
      BlobDownloadBuilder = class {
        constructor(downloadFn, shouldThrowOnError) {
          this.downloadFn = downloadFn;
          this.shouldThrowOnError = shouldThrowOnError;
          this[_Symbol$toStringTag] = "BlobDownloadBuilder";
          this.promise = null;
        }
        asStream() {
          return new StreamDownloadBuilder(this.downloadFn, this.shouldThrowOnError);
        }
        then(onfulfilled, onrejected) {
          return this.getPromise().then(onfulfilled, onrejected);
        }
        catch(onrejected) {
          return this.getPromise().catch(onrejected);
        }
        finally(onfinally) {
          return this.getPromise().finally(onfinally);
        }
        getPromise() {
          if (!this.promise)
            this.promise = this.execute();
          return this.promise;
        }
        async execute() {
          var _this = this;
          try {
            return {
              data: await (await _this.downloadFn()).blob(),
              error: null
            };
          } catch (error) {
            if (_this.shouldThrowOnError)
              throw error;
            if (isStorageError(error))
              return {
                data: null,
                error
              };
            throw error;
          }
        }
      };
      DEFAULT_SEARCH_OPTIONS = {
        limit: 100,
        offset: 0,
        sortBy: {
          column: "name",
          order: "asc"
        }
      };
      DEFAULT_FILE_OPTIONS = {
        cacheControl: "3600",
        contentType: "text/plain;charset=UTF-8",
        upsert: false
      };
      StorageFileApi = class extends BaseApiClient {
        constructor(url, headers = {}, bucketId, fetch$1) {
          super(url, headers, fetch$1, "storage");
          this.bucketId = bucketId;
        }
        /**
        * Uploads a file to an existing bucket or replaces an existing file at the specified path with a new one.
        *
        * @param method HTTP method.
        * @param path The relative file path. Should be of the format `folder/subfolder/filename.png`. The bucket must already exist before attempting to upload.
        * @param fileBody The body of the file to be stored in the bucket.
        */
        async uploadOrUpdate(method, path, fileBody, fileOptions) {
          var _this = this;
          return _this.handleOperation(async () => {
            let body;
            const options = _objectSpread2(_objectSpread2({}, DEFAULT_FILE_OPTIONS), fileOptions);
            let headers = _objectSpread2(_objectSpread2({}, _this.headers), method === "POST" && { "x-upsert": String(options.upsert) });
            const metadata = options.metadata;
            if (typeof Blob !== "undefined" && fileBody instanceof Blob) {
              body = new FormData();
              body.append("cacheControl", options.cacheControl);
              if (metadata)
                body.append("metadata", _this.encodeMetadata(metadata));
              body.append("", fileBody);
            } else if (typeof FormData !== "undefined" && fileBody instanceof FormData) {
              body = fileBody;
              if (!body.has("cacheControl"))
                body.append("cacheControl", options.cacheControl);
              if (metadata && !body.has("metadata"))
                body.append("metadata", _this.encodeMetadata(metadata));
            } else {
              body = fileBody;
              headers["cache-control"] = `max-age=${options.cacheControl}`;
              headers["content-type"] = options.contentType;
              if (metadata)
                headers["x-metadata"] = _this.toBase64(_this.encodeMetadata(metadata));
              if ((typeof ReadableStream !== "undefined" && body instanceof ReadableStream || body && typeof body === "object" && "pipe" in body && typeof body.pipe === "function") && !options.duplex)
                options.duplex = "half";
            }
            if (fileOptions === null || fileOptions === void 0 ? void 0 : fileOptions.headers)
              headers = _objectSpread2(_objectSpread2({}, headers), fileOptions.headers);
            const cleanPath = _this._removeEmptyFolders(path);
            const _path = _this._getFinalPath(cleanPath);
            const data = await (method == "PUT" ? put : post)(_this.fetch, `${_this.url}/object/${_path}`, body, _objectSpread2({ headers }, (options === null || options === void 0 ? void 0 : options.duplex) ? { duplex: options.duplex } : {}));
            return {
              path: cleanPath,
              id: data.Id,
              fullPath: data.Key
            };
          });
        }
        /**
        * Uploads a file to an existing bucket.
        *
        * @category File Buckets
        * @param path The file path, including the file name. Should be of the format `folder/subfolder/filename.png`. The bucket must already exist before attempting to upload.
        * @param fileBody The body of the file to be stored in the bucket.
        * @param fileOptions Optional file upload options including cacheControl, contentType, upsert, and metadata.
        * @returns Promise with response containing file path, id, and fullPath or error
        *
        * @example Upload file
        * ```js
        * const avatarFile = event.target.files[0]
        * const { data, error } = await supabase
        *   .storage
        *   .from('avatars')
        *   .upload('public/avatar1.png', avatarFile, {
        *     cacheControl: '3600',
        *     upsert: false
        *   })
        * ```
        *
        * Response:
        * ```json
        * {
        *   "data": {
        *     "path": "public/avatar1.png",
        *     "fullPath": "avatars/public/avatar1.png"
        *   },
        *   "error": null
        * }
        * ```
        *
        * @example Upload file using `ArrayBuffer` from base64 file data
        * ```js
        * import { decode } from 'base64-arraybuffer'
        *
        * const { data, error } = await supabase
        *   .storage
        *   .from('avatars')
        *   .upload('public/avatar1.png', decode('base64FileData'), {
        *     contentType: 'image/png'
        *   })
        * ```
        */
        async upload(path, fileBody, fileOptions) {
          return this.uploadOrUpdate("POST", path, fileBody, fileOptions);
        }
        /**
        * Upload a file with a token generated from `createSignedUploadUrl`.
        *
        * @category File Buckets
        * @param path The file path, including the file name. Should be of the format `folder/subfolder/filename.png`. The bucket must already exist before attempting to upload.
        * @param token The token generated from `createSignedUploadUrl`
        * @param fileBody The body of the file to be stored in the bucket.
        * @param fileOptions HTTP headers (cacheControl, contentType, etc.).
        * **Note:** The `upsert` option has no effect here. To enable upsert behavior,
        * pass `{ upsert: true }` when calling `createSignedUploadUrl()` instead.
        * @returns Promise with response containing file path and fullPath or error
        *
        * @example Upload to a signed URL
        * ```js
        * const { data, error } = await supabase
        *   .storage
        *   .from('avatars')
        *   .uploadToSignedUrl('folder/cat.jpg', 'token-from-createSignedUploadUrl', file)
        * ```
        *
        * Response:
        * ```json
        * {
        *   "data": {
        *     "path": "folder/cat.jpg",
        *     "fullPath": "avatars/folder/cat.jpg"
        *   },
        *   "error": null
        * }
        * ```
        */
        async uploadToSignedUrl(path, token, fileBody, fileOptions) {
          var _this3 = this;
          const cleanPath = _this3._removeEmptyFolders(path);
          const _path = _this3._getFinalPath(cleanPath);
          const url = new URL(_this3.url + `/object/upload/sign/${_path}`);
          url.searchParams.set("token", token);
          return _this3.handleOperation(async () => {
            let body;
            const options = _objectSpread2({ upsert: DEFAULT_FILE_OPTIONS.upsert }, fileOptions);
            const headers = _objectSpread2(_objectSpread2({}, _this3.headers), { "x-upsert": String(options.upsert) });
            if (typeof Blob !== "undefined" && fileBody instanceof Blob) {
              body = new FormData();
              body.append("cacheControl", options.cacheControl);
              body.append("", fileBody);
            } else if (typeof FormData !== "undefined" && fileBody instanceof FormData) {
              body = fileBody;
              body.append("cacheControl", options.cacheControl);
            } else {
              body = fileBody;
              headers["cache-control"] = `max-age=${options.cacheControl}`;
              headers["content-type"] = options.contentType;
            }
            return {
              path: cleanPath,
              fullPath: (await put(_this3.fetch, url.toString(), body, { headers })).Key
            };
          });
        }
        /**
        * Creates a signed upload URL.
        * Signed upload URLs can be used to upload files to the bucket without further authentication.
        * They are valid for 2 hours.
        *
        * @category File Buckets
        * @param path The file path, including the current file name. For example `folder/image.png`.
        * @param options.upsert If set to true, allows the file to be overwritten if it already exists.
        * @returns Promise with response containing signed upload URL, token, and path or error
        *
        * @example Create Signed Upload URL
        * ```js
        * const { data, error } = await supabase
        *   .storage
        *   .from('avatars')
        *   .createSignedUploadUrl('folder/cat.jpg')
        * ```
        *
        * Response:
        * ```json
        * {
        *   "data": {
        *     "signedUrl": "https://example.supabase.co/storage/v1/object/upload/sign/avatars/folder/cat.jpg?token=<TOKEN>",
        *     "path": "folder/cat.jpg",
        *     "token": "<TOKEN>"
        *   },
        *   "error": null
        * }
        * ```
        */
        async createSignedUploadUrl(path, options) {
          var _this4 = this;
          return _this4.handleOperation(async () => {
            let _path = _this4._getFinalPath(path);
            const headers = _objectSpread2({}, _this4.headers);
            if (options === null || options === void 0 ? void 0 : options.upsert)
              headers["x-upsert"] = "true";
            const data = await post(_this4.fetch, `${_this4.url}/object/upload/sign/${_path}`, {}, { headers });
            const url = new URL(_this4.url + data.url);
            const token = url.searchParams.get("token");
            if (!token)
              throw new StorageError("No token returned by API");
            return {
              signedUrl: url.toString(),
              path,
              token
            };
          });
        }
        /**
        * Replaces an existing file at the specified path with a new one.
        *
        * @category File Buckets
        * @param path The relative file path. Should be of the format `folder/subfolder/filename.png`. The bucket must already exist before attempting to update.
        * @param fileBody The body of the file to be stored in the bucket.
        * @param fileOptions Optional file upload options including cacheControl, contentType, upsert, and metadata.
        * @returns Promise with response containing file path, id, and fullPath or error
        *
        * @example Update file
        * ```js
        * const avatarFile = event.target.files[0]
        * const { data, error } = await supabase
        *   .storage
        *   .from('avatars')
        *   .update('public/avatar1.png', avatarFile, {
        *     cacheControl: '3600',
        *     upsert: true
        *   })
        * ```
        *
        * Response:
        * ```json
        * {
        *   "data": {
        *     "path": "public/avatar1.png",
        *     "fullPath": "avatars/public/avatar1.png"
        *   },
        *   "error": null
        * }
        * ```
        *
        * @example Update file using `ArrayBuffer` from base64 file data
        * ```js
        * import {decode} from 'base64-arraybuffer'
        *
        * const { data, error } = await supabase
        *   .storage
        *   .from('avatars')
        *   .update('public/avatar1.png', decode('base64FileData'), {
        *     contentType: 'image/png'
        *   })
        * ```
        */
        async update(path, fileBody, fileOptions) {
          return this.uploadOrUpdate("PUT", path, fileBody, fileOptions);
        }
        /**
        * Moves an existing file to a new path in the same bucket.
        *
        * @category File Buckets
        * @param fromPath The original file path, including the current file name. For example `folder/image.png`.
        * @param toPath The new file path, including the new file name. For example `folder/image-new.png`.
        * @param options The destination options.
        * @returns Promise with response containing success message or error
        *
        * @example Move file
        * ```js
        * const { data, error } = await supabase
        *   .storage
        *   .from('avatars')
        *   .move('public/avatar1.png', 'private/avatar2.png')
        * ```
        *
        * Response:
        * ```json
        * {
        *   "data": {
        *     "message": "Successfully moved"
        *   },
        *   "error": null
        * }
        * ```
        */
        async move(fromPath, toPath, options) {
          var _this6 = this;
          return _this6.handleOperation(async () => {
            return await post(_this6.fetch, `${_this6.url}/object/move`, {
              bucketId: _this6.bucketId,
              sourceKey: fromPath,
              destinationKey: toPath,
              destinationBucket: options === null || options === void 0 ? void 0 : options.destinationBucket
            }, { headers: _this6.headers });
          });
        }
        /**
        * Copies an existing file to a new path in the same bucket.
        *
        * @category File Buckets
        * @param fromPath The original file path, including the current file name. For example `folder/image.png`.
        * @param toPath The new file path, including the new file name. For example `folder/image-copy.png`.
        * @param options The destination options.
        * @returns Promise with response containing copied file path or error
        *
        * @example Copy file
        * ```js
        * const { data, error } = await supabase
        *   .storage
        *   .from('avatars')
        *   .copy('public/avatar1.png', 'private/avatar2.png')
        * ```
        *
        * Response:
        * ```json
        * {
        *   "data": {
        *     "path": "avatars/private/avatar2.png"
        *   },
        *   "error": null
        * }
        * ```
        */
        async copy(fromPath, toPath, options) {
          var _this7 = this;
          return _this7.handleOperation(async () => {
            return { path: (await post(_this7.fetch, `${_this7.url}/object/copy`, {
              bucketId: _this7.bucketId,
              sourceKey: fromPath,
              destinationKey: toPath,
              destinationBucket: options === null || options === void 0 ? void 0 : options.destinationBucket
            }, { headers: _this7.headers })).Key };
          });
        }
        /**
        * Creates a signed URL. Use a signed URL to share a file for a fixed amount of time.
        *
        * @category File Buckets
        * @param path The file path, including the current file name. For example `folder/image.png`.
        * @param expiresIn The number of seconds until the signed URL expires. For example, `60` for a URL which is valid for one minute.
        * @param options.download triggers the file as a download if set to true. Set this parameter as the name of the file if you want to trigger the download with a different filename.
        * @param options.transform Transform the asset before serving it to the client.
        * @returns Promise with response containing signed URL or error
        *
        * @example Create Signed URL
        * ```js
        * const { data, error } = await supabase
        *   .storage
        *   .from('avatars')
        *   .createSignedUrl('folder/avatar1.png', 60)
        * ```
        *
        * Response:
        * ```json
        * {
        *   "data": {
        *     "signedUrl": "https://example.supabase.co/storage/v1/object/sign/avatars/folder/avatar1.png?token=<TOKEN>"
        *   },
        *   "error": null
        * }
        * ```
        *
        * @example Create a signed URL for an asset with transformations
        * ```js
        * const { data } = await supabase
        *   .storage
        *   .from('avatars')
        *   .createSignedUrl('folder/avatar1.png', 60, {
        *     transform: {
        *       width: 100,
        *       height: 100,
        *     }
        *   })
        * ```
        *
        * @example Create a signed URL which triggers the download of the asset
        * ```js
        * const { data } = await supabase
        *   .storage
        *   .from('avatars')
        *   .createSignedUrl('folder/avatar1.png', 60, {
        *     download: true,
        *   })
        * ```
        */
        async createSignedUrl(path, expiresIn, options) {
          var _this8 = this;
          return _this8.handleOperation(async () => {
            let _path = _this8._getFinalPath(path);
            let data = await post(_this8.fetch, `${_this8.url}/object/sign/${_path}`, _objectSpread2({ expiresIn }, (options === null || options === void 0 ? void 0 : options.transform) ? { transform: options.transform } : {}), { headers: _this8.headers });
            const downloadQueryParam = (options === null || options === void 0 ? void 0 : options.download) ? `&download=${options.download === true ? "" : options.download}` : "";
            return { signedUrl: encodeURI(`${_this8.url}${data.signedURL}${downloadQueryParam}`) };
          });
        }
        /**
        * Creates multiple signed URLs. Use a signed URL to share a file for a fixed amount of time.
        *
        * @category File Buckets
        * @param paths The file paths to be downloaded, including the current file names. For example `['folder/image.png', 'folder2/image2.png']`.
        * @param expiresIn The number of seconds until the signed URLs expire. For example, `60` for URLs which are valid for one minute.
        * @param options.download triggers the file as a download if set to true. Set this parameter as the name of the file if you want to trigger the download with a different filename.
        * @returns Promise with response containing array of objects with signedUrl, path, and error or error
        *
        * @example Create Signed URLs
        * ```js
        * const { data, error } = await supabase
        *   .storage
        *   .from('avatars')
        *   .createSignedUrls(['folder/avatar1.png', 'folder/avatar2.png'], 60)
        * ```
        *
        * Response:
        * ```json
        * {
        *   "data": [
        *     {
        *       "error": null,
        *       "path": "folder/avatar1.png",
        *       "signedURL": "/object/sign/avatars/folder/avatar1.png?token=<TOKEN>",
        *       "signedUrl": "https://example.supabase.co/storage/v1/object/sign/avatars/folder/avatar1.png?token=<TOKEN>"
        *     },
        *     {
        *       "error": null,
        *       "path": "folder/avatar2.png",
        *       "signedURL": "/object/sign/avatars/folder/avatar2.png?token=<TOKEN>",
        *       "signedUrl": "https://example.supabase.co/storage/v1/object/sign/avatars/folder/avatar2.png?token=<TOKEN>"
        *     }
        *   ],
        *   "error": null
        * }
        * ```
        */
        async createSignedUrls(paths, expiresIn, options) {
          var _this9 = this;
          return _this9.handleOperation(async () => {
            const data = await post(_this9.fetch, `${_this9.url}/object/sign/${_this9.bucketId}`, {
              expiresIn,
              paths
            }, { headers: _this9.headers });
            const downloadQueryParam = (options === null || options === void 0 ? void 0 : options.download) ? `&download=${options.download === true ? "" : options.download}` : "";
            return data.map((datum) => _objectSpread2(_objectSpread2({}, datum), {}, { signedUrl: datum.signedURL ? encodeURI(`${_this9.url}${datum.signedURL}${downloadQueryParam}`) : null }));
          });
        }
        /**
        * Downloads a file from a private bucket. For public buckets, make a request to the URL returned from `getPublicUrl` instead.
        *
        * @category File Buckets
        * @param path The full path and file name of the file to be downloaded. For example `folder/image.png`.
        * @param options.transform Transform the asset before serving it to the client.
        * @returns BlobDownloadBuilder instance for downloading the file
        *
        * @example Download file
        * ```js
        * const { data, error } = await supabase
        *   .storage
        *   .from('avatars')
        *   .download('folder/avatar1.png')
        * ```
        *
        * Response:
        * ```json
        * {
        *   "data": <BLOB>,
        *   "error": null
        * }
        * ```
        *
        * @example Download file with transformations
        * ```js
        * const { data, error } = await supabase
        *   .storage
        *   .from('avatars')
        *   .download('folder/avatar1.png', {
        *     transform: {
        *       width: 100,
        *       height: 100,
        *       quality: 80
        *     }
        *   })
        * ```
        */
        download(path, options) {
          const renderPath = typeof (options === null || options === void 0 ? void 0 : options.transform) !== "undefined" ? "render/image/authenticated" : "object";
          const transformationQuery = this.transformOptsToQueryString((options === null || options === void 0 ? void 0 : options.transform) || {});
          const queryString = transformationQuery ? `?${transformationQuery}` : "";
          const _path = this._getFinalPath(path);
          const downloadFn = () => get(this.fetch, `${this.url}/${renderPath}/${_path}${queryString}`, {
            headers: this.headers,
            noResolveJson: true
          });
          return new BlobDownloadBuilder(downloadFn, this.shouldThrowOnError);
        }
        /**
        * Retrieves the details of an existing file.
        *
        * @category File Buckets
        * @param path The file path, including the file name. For example `folder/image.png`.
        * @returns Promise with response containing file metadata or error
        *
        * @example Get file info
        * ```js
        * const { data, error } = await supabase
        *   .storage
        *   .from('avatars')
        *   .info('folder/avatar1.png')
        * ```
        */
        async info(path) {
          var _this10 = this;
          const _path = _this10._getFinalPath(path);
          return _this10.handleOperation(async () => {
            return recursiveToCamel(await get(_this10.fetch, `${_this10.url}/object/info/${_path}`, { headers: _this10.headers }));
          });
        }
        /**
        * Checks the existence of a file.
        *
        * @category File Buckets
        * @param path The file path, including the file name. For example `folder/image.png`.
        * @returns Promise with response containing boolean indicating file existence or error
        *
        * @example Check file existence
        * ```js
        * const { data, error } = await supabase
        *   .storage
        *   .from('avatars')
        *   .exists('folder/avatar1.png')
        * ```
        */
        async exists(path) {
          var _this11 = this;
          const _path = _this11._getFinalPath(path);
          try {
            await head(_this11.fetch, `${_this11.url}/object/${_path}`, { headers: _this11.headers });
            return {
              data: true,
              error: null
            };
          } catch (error) {
            if (_this11.shouldThrowOnError)
              throw error;
            if (isStorageError(error) && error instanceof StorageUnknownError) {
              const originalError = error.originalError;
              if ([400, 404].includes(originalError === null || originalError === void 0 ? void 0 : originalError.status))
                return {
                  data: false,
                  error
                };
            }
            throw error;
          }
        }
        /**
        * A simple convenience function to get the URL for an asset in a public bucket. If you do not want to use this function, you can construct the public URL by concatenating the bucket URL with the path to the asset.
        * This function does not verify if the bucket is public. If a public URL is created for a bucket which is not public, you will not be able to download the asset.
        *
        * @category File Buckets
        * @param path The path and name of the file to generate the public URL for. For example `folder/image.png`.
        * @param options.download Triggers the file as a download if set to true. Set this parameter as the name of the file if you want to trigger the download with a different filename.
        * @param options.transform Transform the asset before serving it to the client.
        * @returns Object with public URL
        *
        * @example Returns the URL for an asset in a public bucket
        * ```js
        * const { data } = supabase
        *   .storage
        *   .from('public-bucket')
        *   .getPublicUrl('folder/avatar1.png')
        * ```
        *
        * Response:
        * ```json
        * {
        *   "data": {
        *     "publicUrl": "https://example.supabase.co/storage/v1/object/public/public-bucket/folder/avatar1.png"
        *   }
        * }
        * ```
        *
        * @example Returns the URL for an asset in a public bucket with transformations
        * ```js
        * const { data } = supabase
        *   .storage
        *   .from('public-bucket')
        *   .getPublicUrl('folder/avatar1.png', {
        *     transform: {
        *       width: 100,
        *       height: 100,
        *     }
        *   })
        * ```
        *
        * @example Returns the URL which triggers the download of an asset in a public bucket
        * ```js
        * const { data } = supabase
        *   .storage
        *   .from('public-bucket')
        *   .getPublicUrl('folder/avatar1.png', {
        *     download: true,
        *   })
        * ```
        */
        getPublicUrl(path, options) {
          const _path = this._getFinalPath(path);
          const _queryString = [];
          const downloadQueryParam = (options === null || options === void 0 ? void 0 : options.download) ? `download=${options.download === true ? "" : options.download}` : "";
          if (downloadQueryParam !== "")
            _queryString.push(downloadQueryParam);
          const renderPath = typeof (options === null || options === void 0 ? void 0 : options.transform) !== "undefined" ? "render/image" : "object";
          const transformationQuery = this.transformOptsToQueryString((options === null || options === void 0 ? void 0 : options.transform) || {});
          if (transformationQuery !== "")
            _queryString.push(transformationQuery);
          let queryString = _queryString.join("&");
          if (queryString !== "")
            queryString = `?${queryString}`;
          return { data: { publicUrl: encodeURI(`${this.url}/${renderPath}/public/${_path}${queryString}`) } };
        }
        /**
        * Deletes files within the same bucket
        *
        * @category File Buckets
        * @param paths An array of files to delete, including the path and file name. For example [`'folder/image.png'`].
        * @returns Promise with response containing array of deleted file objects or error
        *
        * @example Delete file
        * ```js
        * const { data, error } = await supabase
        *   .storage
        *   .from('avatars')
        *   .remove(['folder/avatar1.png'])
        * ```
        *
        * Response:
        * ```json
        * {
        *   "data": [],
        *   "error": null
        * }
        * ```
        */
        async remove(paths) {
          var _this12 = this;
          return _this12.handleOperation(async () => {
            return await remove(_this12.fetch, `${_this12.url}/object/${_this12.bucketId}`, { prefixes: paths }, { headers: _this12.headers });
          });
        }
        /**
        * Get file metadata
        * @param id the file id to retrieve metadata
        */
        /**
        * Update file metadata
        * @param id the file id to update metadata
        * @param meta the new file metadata
        */
        /**
        * Lists all the files and folders within a path of the bucket.
        *
        * @category File Buckets
        * @param path The folder path.
        * @param options Search options including limit (defaults to 100), offset, sortBy, and search
        * @param parameters Optional fetch parameters including signal for cancellation
        * @returns Promise with response containing array of files or error
        *
        * @example List files in a bucket
        * ```js
        * const { data, error } = await supabase
        *   .storage
        *   .from('avatars')
        *   .list('folder', {
        *     limit: 100,
        *     offset: 0,
        *     sortBy: { column: 'name', order: 'asc' },
        *   })
        * ```
        *
        * Response:
        * ```json
        * {
        *   "data": [
        *     {
        *       "name": "avatar1.png",
        *       "id": "e668cf7f-821b-4a2f-9dce-7dfa5dd1cfd2",
        *       "updated_at": "2024-05-22T23:06:05.580Z",
        *       "created_at": "2024-05-22T23:04:34.443Z",
        *       "last_accessed_at": "2024-05-22T23:04:34.443Z",
        *       "metadata": {
        *         "eTag": "\"c5e8c553235d9af30ef4f6e280790b92\"",
        *         "size": 32175,
        *         "mimetype": "image/png",
        *         "cacheControl": "max-age=3600",
        *         "lastModified": "2024-05-22T23:06:05.574Z",
        *         "contentLength": 32175,
        *         "httpStatusCode": 200
        *       }
        *     }
        *   ],
        *   "error": null
        * }
        * ```
        *
        * @example Search files in a bucket
        * ```js
        * const { data, error } = await supabase
        *   .storage
        *   .from('avatars')
        *   .list('folder', {
        *     limit: 100,
        *     offset: 0,
        *     sortBy: { column: 'name', order: 'asc' },
        *     search: 'jon'
        *   })
        * ```
        */
        async list(path, options, parameters) {
          var _this13 = this;
          return _this13.handleOperation(async () => {
            const body = _objectSpread2(_objectSpread2(_objectSpread2({}, DEFAULT_SEARCH_OPTIONS), options), {}, { prefix: path || "" });
            return await post(_this13.fetch, `${_this13.url}/object/list/${_this13.bucketId}`, body, { headers: _this13.headers }, parameters);
          });
        }
        /**
        * @experimental this method signature might change in the future
        *
        * @category File Buckets
        * @param options search options
        * @param parameters
        */
        async listV2(options, parameters) {
          var _this14 = this;
          return _this14.handleOperation(async () => {
            const body = _objectSpread2({}, options);
            return await post(_this14.fetch, `${_this14.url}/object/list-v2/${_this14.bucketId}`, body, { headers: _this14.headers }, parameters);
          });
        }
        encodeMetadata(metadata) {
          return JSON.stringify(metadata);
        }
        toBase64(data) {
          if (typeof Buffer !== "undefined")
            return Buffer.from(data).toString("base64");
          return btoa(data);
        }
        _getFinalPath(path) {
          return `${this.bucketId}/${path.replace(/^\/+/, "")}`;
        }
        _removeEmptyFolders(path) {
          return path.replace(/^\/|\/$/g, "").replace(/\/+/g, "/");
        }
        transformOptsToQueryString(transform) {
          const params = [];
          if (transform.width)
            params.push(`width=${transform.width}`);
          if (transform.height)
            params.push(`height=${transform.height}`);
          if (transform.resize)
            params.push(`resize=${transform.resize}`);
          if (transform.format)
            params.push(`format=${transform.format}`);
          if (transform.quality)
            params.push(`quality=${transform.quality}`);
          return params.join("&");
        }
      };
      version2 = "2.93.3";
      DEFAULT_HEADERS = { "X-Client-Info": `storage-js/${version2}` };
      StorageBucketApi = class extends BaseApiClient {
        constructor(url, headers = {}, fetch$1, opts) {
          const baseUrl = new URL(url);
          if (opts === null || opts === void 0 ? void 0 : opts.useNewHostname) {
            if (/supabase\.(co|in|red)$/.test(baseUrl.hostname) && !baseUrl.hostname.includes("storage.supabase."))
              baseUrl.hostname = baseUrl.hostname.replace("supabase.", "storage.supabase.");
          }
          const finalUrl = baseUrl.href.replace(/\/$/, "");
          const finalHeaders = _objectSpread2(_objectSpread2({}, DEFAULT_HEADERS), headers);
          super(finalUrl, finalHeaders, fetch$1, "storage");
        }
        /**
        * Retrieves the details of all Storage buckets within an existing project.
        *
        * @category File Buckets
        * @param options Query parameters for listing buckets
        * @param options.limit Maximum number of buckets to return
        * @param options.offset Number of buckets to skip
        * @param options.sortColumn Column to sort by ('id', 'name', 'created_at', 'updated_at')
        * @param options.sortOrder Sort order ('asc' or 'desc')
        * @param options.search Search term to filter bucket names
        * @returns Promise with response containing array of buckets or error
        *
        * @example List buckets
        * ```js
        * const { data, error } = await supabase
        *   .storage
        *   .listBuckets()
        * ```
        *
        * @example List buckets with options
        * ```js
        * const { data, error } = await supabase
        *   .storage
        *   .listBuckets({
        *     limit: 10,
        *     offset: 0,
        *     sortColumn: 'created_at',
        *     sortOrder: 'desc',
        *     search: 'prod'
        *   })
        * ```
        */
        async listBuckets(options) {
          var _this = this;
          return _this.handleOperation(async () => {
            const queryString = _this.listBucketOptionsToQueryString(options);
            return await get(_this.fetch, `${_this.url}/bucket${queryString}`, { headers: _this.headers });
          });
        }
        /**
        * Retrieves the details of an existing Storage bucket.
        *
        * @category File Buckets
        * @param id The unique identifier of the bucket you would like to retrieve.
        * @returns Promise with response containing bucket details or error
        *
        * @example Get bucket
        * ```js
        * const { data, error } = await supabase
        *   .storage
        *   .getBucket('avatars')
        * ```
        *
        * Response:
        * ```json
        * {
        *   "data": {
        *     "id": "avatars",
        *     "name": "avatars",
        *     "owner": "",
        *     "public": false,
        *     "file_size_limit": 1024,
        *     "allowed_mime_types": [
        *       "image/png"
        *     ],
        *     "created_at": "2024-05-22T22:26:05.100Z",
        *     "updated_at": "2024-05-22T22:26:05.100Z"
        *   },
        *   "error": null
        * }
        * ```
        */
        async getBucket(id) {
          var _this2 = this;
          return _this2.handleOperation(async () => {
            return await get(_this2.fetch, `${_this2.url}/bucket/${id}`, { headers: _this2.headers });
          });
        }
        /**
        * Creates a new Storage bucket
        *
        * @category File Buckets
        * @param id A unique identifier for the bucket you are creating.
        * @param options.public The visibility of the bucket. Public buckets don't require an authorization token to download objects, but still require a valid token for all other operations. By default, buckets are private.
        * @param options.fileSizeLimit specifies the max file size in bytes that can be uploaded to this bucket.
        * The global file size limit takes precedence over this value.
        * The default value is null, which doesn't set a per bucket file size limit.
        * @param options.allowedMimeTypes specifies the allowed mime types that this bucket can accept during upload.
        * The default value is null, which allows files with all mime types to be uploaded.
        * Each mime type specified can be a wildcard, e.g. image/*, or a specific mime type, e.g. image/png.
        * @param options.type (private-beta) specifies the bucket type. see `BucketType` for more details.
        *   - default bucket type is `STANDARD`
        * @returns Promise with response containing newly created bucket name or error
        *
        * @example Create bucket
        * ```js
        * const { data, error } = await supabase
        *   .storage
        *   .createBucket('avatars', {
        *     public: false,
        *     allowedMimeTypes: ['image/png'],
        *     fileSizeLimit: 1024
        *   })
        * ```
        *
        * Response:
        * ```json
        * {
        *   "data": {
        *     "name": "avatars"
        *   },
        *   "error": null
        * }
        * ```
        */
        async createBucket(id, options = { public: false }) {
          var _this3 = this;
          return _this3.handleOperation(async () => {
            return await post(_this3.fetch, `${_this3.url}/bucket`, {
              id,
              name: id,
              type: options.type,
              public: options.public,
              file_size_limit: options.fileSizeLimit,
              allowed_mime_types: options.allowedMimeTypes
            }, { headers: _this3.headers });
          });
        }
        /**
        * Updates a Storage bucket
        *
        * @category File Buckets
        * @param id A unique identifier for the bucket you are updating.
        * @param options.public The visibility of the bucket. Public buckets don't require an authorization token to download objects, but still require a valid token for all other operations.
        * @param options.fileSizeLimit specifies the max file size in bytes that can be uploaded to this bucket.
        * The global file size limit takes precedence over this value.
        * The default value is null, which doesn't set a per bucket file size limit.
        * @param options.allowedMimeTypes specifies the allowed mime types that this bucket can accept during upload.
        * The default value is null, which allows files with all mime types to be uploaded.
        * Each mime type specified can be a wildcard, e.g. image/*, or a specific mime type, e.g. image/png.
        * @returns Promise with response containing success message or error
        *
        * @example Update bucket
        * ```js
        * const { data, error } = await supabase
        *   .storage
        *   .updateBucket('avatars', {
        *     public: false,
        *     allowedMimeTypes: ['image/png'],
        *     fileSizeLimit: 1024
        *   })
        * ```
        *
        * Response:
        * ```json
        * {
        *   "data": {
        *     "message": "Successfully updated"
        *   },
        *   "error": null
        * }
        * ```
        */
        async updateBucket(id, options) {
          var _this4 = this;
          return _this4.handleOperation(async () => {
            return await put(_this4.fetch, `${_this4.url}/bucket/${id}`, {
              id,
              name: id,
              public: options.public,
              file_size_limit: options.fileSizeLimit,
              allowed_mime_types: options.allowedMimeTypes
            }, { headers: _this4.headers });
          });
        }
        /**
        * Removes all objects inside a single bucket.
        *
        * @category File Buckets
        * @param id The unique identifier of the bucket you would like to empty.
        * @returns Promise with success message or error
        *
        * @example Empty bucket
        * ```js
        * const { data, error } = await supabase
        *   .storage
        *   .emptyBucket('avatars')
        * ```
        *
        * Response:
        * ```json
        * {
        *   "data": {
        *     "message": "Successfully emptied"
        *   },
        *   "error": null
        * }
        * ```
        */
        async emptyBucket(id) {
          var _this5 = this;
          return _this5.handleOperation(async () => {
            return await post(_this5.fetch, `${_this5.url}/bucket/${id}/empty`, {}, { headers: _this5.headers });
          });
        }
        /**
        * Deletes an existing bucket. A bucket can't be deleted with existing objects inside it.
        * You must first `empty()` the bucket.
        *
        * @category File Buckets
        * @param id The unique identifier of the bucket you would like to delete.
        * @returns Promise with success message or error
        *
        * @example Delete bucket
        * ```js
        * const { data, error } = await supabase
        *   .storage
        *   .deleteBucket('avatars')
        * ```
        *
        * Response:
        * ```json
        * {
        *   "data": {
        *     "message": "Successfully deleted"
        *   },
        *   "error": null
        * }
        * ```
        */
        async deleteBucket(id) {
          var _this6 = this;
          return _this6.handleOperation(async () => {
            return await remove(_this6.fetch, `${_this6.url}/bucket/${id}`, {}, { headers: _this6.headers });
          });
        }
        listBucketOptionsToQueryString(options) {
          const params = {};
          if (options) {
            if ("limit" in options)
              params.limit = String(options.limit);
            if ("offset" in options)
              params.offset = String(options.offset);
            if (options.search)
              params.search = options.search;
            if (options.sortColumn)
              params.sortColumn = options.sortColumn;
            if (options.sortOrder)
              params.sortOrder = options.sortOrder;
          }
          return Object.keys(params).length > 0 ? "?" + new URLSearchParams(params).toString() : "";
        }
      };
      StorageAnalyticsClient = class extends BaseApiClient {
        /**
        * @alpha
        *
        * Creates a new StorageAnalyticsClient instance
        *
        * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
        *
        * @category Analytics Buckets
        * @param url - The base URL for the storage API
        * @param headers - HTTP headers to include in requests
        * @param fetch - Optional custom fetch implementation
        *
        * @example
        * ```typescript
        * const client = new StorageAnalyticsClient(url, headers)
        * ```
        */
        constructor(url, headers = {}, fetch$1) {
          const finalUrl = url.replace(/\/$/, "");
          const finalHeaders = _objectSpread2(_objectSpread2({}, DEFAULT_HEADERS), headers);
          super(finalUrl, finalHeaders, fetch$1, "storage");
        }
        /**
        * @alpha
        *
        * Creates a new analytics bucket using Iceberg tables
        * Analytics buckets are optimized for analytical queries and data processing
        *
        * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
        *
        * @category Analytics Buckets
        * @param name A unique name for the bucket you are creating
        * @returns Promise with response containing newly created analytics bucket or error
        *
        * @example Create analytics bucket
        * ```js
        * const { data, error } = await supabase
        *   .storage
        *   .analytics
        *   .createBucket('analytics-data')
        * ```
        *
        * Response:
        * ```json
        * {
        *   "data": {
        *     "name": "analytics-data",
        *     "type": "ANALYTICS",
        *     "format": "iceberg",
        *     "created_at": "2024-05-22T22:26:05.100Z",
        *     "updated_at": "2024-05-22T22:26:05.100Z"
        *   },
        *   "error": null
        * }
        * ```
        */
        async createBucket(name) {
          var _this = this;
          return _this.handleOperation(async () => {
            return await post(_this.fetch, `${_this.url}/bucket`, { name }, { headers: _this.headers });
          });
        }
        /**
        * @alpha
        *
        * Retrieves the details of all Analytics Storage buckets within an existing project
        * Only returns buckets of type 'ANALYTICS'
        *
        * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
        *
        * @category Analytics Buckets
        * @param options Query parameters for listing buckets
        * @param options.limit Maximum number of buckets to return
        * @param options.offset Number of buckets to skip
        * @param options.sortColumn Column to sort by ('name', 'created_at', 'updated_at')
        * @param options.sortOrder Sort order ('asc' or 'desc')
        * @param options.search Search term to filter bucket names
        * @returns Promise with response containing array of analytics buckets or error
        *
        * @example List analytics buckets
        * ```js
        * const { data, error } = await supabase
        *   .storage
        *   .analytics
        *   .listBuckets({
        *     limit: 10,
        *     offset: 0,
        *     sortColumn: 'created_at',
        *     sortOrder: 'desc'
        *   })
        * ```
        *
        * Response:
        * ```json
        * {
        *   "data": [
        *     {
        *       "name": "analytics-data",
        *       "type": "ANALYTICS",
        *       "format": "iceberg",
        *       "created_at": "2024-05-22T22:26:05.100Z",
        *       "updated_at": "2024-05-22T22:26:05.100Z"
        *     }
        *   ],
        *   "error": null
        * }
        * ```
        */
        async listBuckets(options) {
          var _this2 = this;
          return _this2.handleOperation(async () => {
            const queryParams = new URLSearchParams();
            if ((options === null || options === void 0 ? void 0 : options.limit) !== void 0)
              queryParams.set("limit", options.limit.toString());
            if ((options === null || options === void 0 ? void 0 : options.offset) !== void 0)
              queryParams.set("offset", options.offset.toString());
            if (options === null || options === void 0 ? void 0 : options.sortColumn)
              queryParams.set("sortColumn", options.sortColumn);
            if (options === null || options === void 0 ? void 0 : options.sortOrder)
              queryParams.set("sortOrder", options.sortOrder);
            if (options === null || options === void 0 ? void 0 : options.search)
              queryParams.set("search", options.search);
            const queryString = queryParams.toString();
            const url = queryString ? `${_this2.url}/bucket?${queryString}` : `${_this2.url}/bucket`;
            return await get(_this2.fetch, url, { headers: _this2.headers });
          });
        }
        /**
        * @alpha
        *
        * Deletes an existing analytics bucket
        * A bucket can't be deleted with existing objects inside it
        * You must first empty the bucket before deletion
        *
        * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
        *
        * @category Analytics Buckets
        * @param bucketName The unique identifier of the bucket you would like to delete
        * @returns Promise with response containing success message or error
        *
        * @example Delete analytics bucket
        * ```js
        * const { data, error } = await supabase
        *   .storage
        *   .analytics
        *   .deleteBucket('analytics-data')
        * ```
        *
        * Response:
        * ```json
        * {
        *   "data": {
        *     "message": "Successfully deleted"
        *   },
        *   "error": null
        * }
        * ```
        */
        async deleteBucket(bucketName) {
          var _this3 = this;
          return _this3.handleOperation(async () => {
            return await remove(_this3.fetch, `${_this3.url}/bucket/${bucketName}`, {}, { headers: _this3.headers });
          });
        }
        /**
        * @alpha
        *
        * Get an Iceberg REST Catalog client configured for a specific analytics bucket
        * Use this to perform advanced table and namespace operations within the bucket
        * The returned client provides full access to the Apache Iceberg REST Catalog API
        * with the Supabase `{ data, error }` pattern for consistent error handling on all operations.
        *
        * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
        *
        * @category Analytics Buckets
        * @param bucketName - The name of the analytics bucket (warehouse) to connect to
        * @returns The wrapped Iceberg catalog client
        * @throws {StorageError} If the bucket name is invalid
        *
        * @example Get catalog and create table
        * ```js
        * // First, create an analytics bucket
        * const { data: bucket, error: bucketError } = await supabase
        *   .storage
        *   .analytics
        *   .createBucket('analytics-data')
        *
        * // Get the Iceberg catalog for that bucket
        * const catalog = supabase.storage.analytics.from('analytics-data')
        *
        * // Create a namespace
        * const { error: nsError } = await catalog.createNamespace({ namespace: ['default'] })
        *
        * // Create a table with schema
        * const { data: tableMetadata, error: tableError } = await catalog.createTable(
        *   { namespace: ['default'] },
        *   {
        *     name: 'events',
        *     schema: {
        *       type: 'struct',
        *       fields: [
        *         { id: 1, name: 'id', type: 'long', required: true },
        *         { id: 2, name: 'timestamp', type: 'timestamp', required: true },
        *         { id: 3, name: 'user_id', type: 'string', required: false }
        *       ],
        *       'schema-id': 0,
        *       'identifier-field-ids': [1]
        *     },
        *     'partition-spec': {
        *       'spec-id': 0,
        *       fields: []
        *     },
        *     'write-order': {
        *       'order-id': 0,
        *       fields: []
        *     },
        *     properties: {
        *       'write.format.default': 'parquet'
        *     }
        *   }
        * )
        * ```
        *
        * @example List tables in namespace
        * ```js
        * const catalog = supabase.storage.analytics.from('analytics-data')
        *
        * // List all tables in the default namespace
        * const { data: tables, error: listError } = await catalog.listTables({ namespace: ['default'] })
        * if (listError) {
        *   if (listError.isNotFound()) {
        *     console.log('Namespace not found')
        *   }
        *   return
        * }
        * console.log(tables) // [{ namespace: ['default'], name: 'events' }]
        * ```
        *
        * @example Working with namespaces
        * ```js
        * const catalog = supabase.storage.analytics.from('analytics-data')
        *
        * // List all namespaces
        * const { data: namespaces } = await catalog.listNamespaces()
        *
        * // Create namespace with properties
        * await catalog.createNamespace(
        *   { namespace: ['production'] },
        *   { properties: { owner: 'data-team', env: 'prod' } }
        * )
        * ```
        *
        * @example Cleanup operations
        * ```js
        * const catalog = supabase.storage.analytics.from('analytics-data')
        *
        * // Drop table with purge option (removes all data)
        * const { error: dropError } = await catalog.dropTable(
        *   { namespace: ['default'], name: 'events' },
        *   { purge: true }
        * )
        *
        * if (dropError?.isNotFound()) {
        *   console.log('Table does not exist')
        * }
        *
        * // Drop namespace (must be empty)
        * await catalog.dropNamespace({ namespace: ['default'] })
        * ```
        *
        * @remarks
        * This method provides a bridge between Supabase's bucket management and the standard
        * Apache Iceberg REST Catalog API. The bucket name maps to the Iceberg warehouse parameter.
        * All authentication and configuration is handled automatically using your Supabase credentials.
        *
        * **Error Handling**: Invalid bucket names throw immediately. All catalog
        * operations return `{ data, error }` where errors are `IcebergError` instances from iceberg-js.
        * Use helper methods like `error.isNotFound()` or check `error.status` for specific error handling.
        * Use `.throwOnError()` on the analytics client if you prefer exceptions for catalog operations.
        *
        * **Cleanup Operations**: When using `dropTable`, the `purge: true` option permanently
        * deletes all table data. Without it, the table is marked as deleted but data remains.
        *
        * **Library Dependency**: The returned catalog wraps `IcebergRestCatalog` from iceberg-js.
        * For complete API documentation and advanced usage, refer to the
        * [iceberg-js documentation](https://supabase.github.io/iceberg-js/).
        */
        from(bucketName) {
          var _this4 = this;
          if (!isValidBucketName(bucketName))
            throw new StorageError("Invalid bucket name: File, folder, and bucket names must follow AWS object key naming guidelines and should avoid the use of any other characters.");
          const catalog = new IcebergRestCatalog({
            baseUrl: this.url,
            catalogName: bucketName,
            auth: {
              type: "custom",
              getHeaders: async () => _this4.headers
            },
            fetch: this.fetch
          });
          const shouldThrowOnError = this.shouldThrowOnError;
          return new Proxy(catalog, { get(target, prop) {
            const value = target[prop];
            if (typeof value !== "function")
              return value;
            return async (...args) => {
              try {
                return {
                  data: await value.apply(target, args),
                  error: null
                };
              } catch (error) {
                if (shouldThrowOnError)
                  throw error;
                return {
                  data: null,
                  error
                };
              }
            };
          } });
        }
      };
      VectorIndexApi = class extends BaseApiClient {
        /** Creates a new VectorIndexApi instance */
        constructor(url, headers = {}, fetch$1) {
          const finalUrl = url.replace(/\/$/, "");
          const finalHeaders = _objectSpread2(_objectSpread2({}, DEFAULT_HEADERS), {}, { "Content-Type": "application/json" }, headers);
          super(finalUrl, finalHeaders, fetch$1, "vectors");
        }
        /** Creates a new vector index within a bucket */
        async createIndex(options) {
          var _this = this;
          return _this.handleOperation(async () => {
            return await vectorsApi.post(_this.fetch, `${_this.url}/CreateIndex`, options, { headers: _this.headers }) || {};
          });
        }
        /** Retrieves metadata for a specific vector index */
        async getIndex(vectorBucketName, indexName) {
          var _this2 = this;
          return _this2.handleOperation(async () => {
            return await vectorsApi.post(_this2.fetch, `${_this2.url}/GetIndex`, {
              vectorBucketName,
              indexName
            }, { headers: _this2.headers });
          });
        }
        /** Lists vector indexes within a bucket with optional filtering and pagination */
        async listIndexes(options) {
          var _this3 = this;
          return _this3.handleOperation(async () => {
            return await vectorsApi.post(_this3.fetch, `${_this3.url}/ListIndexes`, options, { headers: _this3.headers });
          });
        }
        /** Deletes a vector index and all its data */
        async deleteIndex(vectorBucketName, indexName) {
          var _this4 = this;
          return _this4.handleOperation(async () => {
            return await vectorsApi.post(_this4.fetch, `${_this4.url}/DeleteIndex`, {
              vectorBucketName,
              indexName
            }, { headers: _this4.headers }) || {};
          });
        }
      };
      VectorDataApi = class extends BaseApiClient {
        /** Creates a new VectorDataApi instance */
        constructor(url, headers = {}, fetch$1) {
          const finalUrl = url.replace(/\/$/, "");
          const finalHeaders = _objectSpread2(_objectSpread2({}, DEFAULT_HEADERS), {}, { "Content-Type": "application/json" }, headers);
          super(finalUrl, finalHeaders, fetch$1, "vectors");
        }
        /** Inserts or updates vectors in batch (1-500 per request) */
        async putVectors(options) {
          var _this = this;
          if (options.vectors.length < 1 || options.vectors.length > 500)
            throw new Error("Vector batch size must be between 1 and 500 items");
          return _this.handleOperation(async () => {
            return await vectorsApi.post(_this.fetch, `${_this.url}/PutVectors`, options, { headers: _this.headers }) || {};
          });
        }
        /** Retrieves vectors by their keys in batch */
        async getVectors(options) {
          var _this2 = this;
          return _this2.handleOperation(async () => {
            return await vectorsApi.post(_this2.fetch, `${_this2.url}/GetVectors`, options, { headers: _this2.headers });
          });
        }
        /** Lists vectors in an index with pagination */
        async listVectors(options) {
          var _this3 = this;
          if (options.segmentCount !== void 0) {
            if (options.segmentCount < 1 || options.segmentCount > 16)
              throw new Error("segmentCount must be between 1 and 16");
            if (options.segmentIndex !== void 0) {
              if (options.segmentIndex < 0 || options.segmentIndex >= options.segmentCount)
                throw new Error(`segmentIndex must be between 0 and ${options.segmentCount - 1}`);
            }
          }
          return _this3.handleOperation(async () => {
            return await vectorsApi.post(_this3.fetch, `${_this3.url}/ListVectors`, options, { headers: _this3.headers });
          });
        }
        /** Queries for similar vectors using approximate nearest neighbor search */
        async queryVectors(options) {
          var _this4 = this;
          return _this4.handleOperation(async () => {
            return await vectorsApi.post(_this4.fetch, `${_this4.url}/QueryVectors`, options, { headers: _this4.headers });
          });
        }
        /** Deletes vectors by their keys in batch (1-500 per request) */
        async deleteVectors(options) {
          var _this5 = this;
          if (options.keys.length < 1 || options.keys.length > 500)
            throw new Error("Keys batch size must be between 1 and 500 items");
          return _this5.handleOperation(async () => {
            return await vectorsApi.post(_this5.fetch, `${_this5.url}/DeleteVectors`, options, { headers: _this5.headers }) || {};
          });
        }
      };
      VectorBucketApi = class extends BaseApiClient {
        /** Creates a new VectorBucketApi instance */
        constructor(url, headers = {}, fetch$1) {
          const finalUrl = url.replace(/\/$/, "");
          const finalHeaders = _objectSpread2(_objectSpread2({}, DEFAULT_HEADERS), {}, { "Content-Type": "application/json" }, headers);
          super(finalUrl, finalHeaders, fetch$1, "vectors");
        }
        /** Creates a new vector bucket */
        async createBucket(vectorBucketName) {
          var _this = this;
          return _this.handleOperation(async () => {
            return await vectorsApi.post(_this.fetch, `${_this.url}/CreateVectorBucket`, { vectorBucketName }, { headers: _this.headers }) || {};
          });
        }
        /** Retrieves metadata for a specific vector bucket */
        async getBucket(vectorBucketName) {
          var _this2 = this;
          return _this2.handleOperation(async () => {
            return await vectorsApi.post(_this2.fetch, `${_this2.url}/GetVectorBucket`, { vectorBucketName }, { headers: _this2.headers });
          });
        }
        /** Lists vector buckets with optional filtering and pagination */
        async listBuckets(options = {}) {
          var _this3 = this;
          return _this3.handleOperation(async () => {
            return await vectorsApi.post(_this3.fetch, `${_this3.url}/ListVectorBuckets`, options, { headers: _this3.headers });
          });
        }
        /** Deletes a vector bucket (must be empty first) */
        async deleteBucket(vectorBucketName) {
          var _this4 = this;
          return _this4.handleOperation(async () => {
            return await vectorsApi.post(_this4.fetch, `${_this4.url}/DeleteVectorBucket`, { vectorBucketName }, { headers: _this4.headers }) || {};
          });
        }
      };
      StorageVectorsClient = class extends VectorBucketApi {
        /**
        * @alpha
        *
        * Creates a StorageVectorsClient that can manage buckets, indexes, and vectors.
        *
        * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
        *
        * @category Vector Buckets
        * @param url - Base URL of the Storage Vectors REST API.
        * @param options.headers - Optional headers (for example `Authorization`) applied to every request.
        * @param options.fetch - Optional custom `fetch` implementation for non-browser runtimes.
        *
        * @example
        * ```typescript
        * const client = new StorageVectorsClient(url, options)
        * ```
        */
        constructor(url, options = {}) {
          super(url, options.headers || {}, options.fetch);
        }
        /**
        *
        * @alpha
        *
        * Access operations for a specific vector bucket
        * Returns a scoped client for index and vector operations within the bucket
        *
        * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
        *
        * @category Vector Buckets
        * @param vectorBucketName - Name of the vector bucket
        * @returns Bucket-scoped client with index and vector operations
        *
        * @example
        * ```typescript
        * const bucket = supabase.storage.vectors.from('embeddings-prod')
        * ```
        */
        from(vectorBucketName) {
          return new VectorBucketScope(this.url, this.headers, vectorBucketName, this.fetch);
        }
        /**
        *
        * @alpha
        *
        * Creates a new vector bucket
        * Vector buckets are containers for vector indexes and their data
        *
        * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
        *
        * @category Vector Buckets
        * @param vectorBucketName - Unique name for the vector bucket
        * @returns Promise with empty response on success or error
        *
        * @example
        * ```typescript
        * const { data, error } = await supabase
        *   .storage
        *   .vectors
        *   .createBucket('embeddings-prod')
        * ```
        */
        async createBucket(vectorBucketName) {
          var _superprop_getCreateBucket = () => super.createBucket, _this = this;
          return _superprop_getCreateBucket().call(_this, vectorBucketName);
        }
        /**
        *
        * @alpha
        *
        * Retrieves metadata for a specific vector bucket
        *
        * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
        *
        * @category Vector Buckets
        * @param vectorBucketName - Name of the vector bucket
        * @returns Promise with bucket metadata or error
        *
        * @example
        * ```typescript
        * const { data, error } = await supabase
        *   .storage
        *   .vectors
        *   .getBucket('embeddings-prod')
        *
        * console.log('Bucket created:', data?.vectorBucket.creationTime)
        * ```
        */
        async getBucket(vectorBucketName) {
          var _superprop_getGetBucket = () => super.getBucket, _this2 = this;
          return _superprop_getGetBucket().call(_this2, vectorBucketName);
        }
        /**
        *
        * @alpha
        *
        * Lists all vector buckets with optional filtering and pagination
        *
        * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
        *
        * @category Vector Buckets
        * @param options - Optional filters (prefix, maxResults, nextToken)
        * @returns Promise with list of buckets or error
        *
        * @example
        * ```typescript
        * const { data, error } = await supabase
        *   .storage
        *   .vectors
        *   .listBuckets({ prefix: 'embeddings-' })
        *
        * data?.vectorBuckets.forEach(bucket => {
        *   console.log(bucket.vectorBucketName)
        * })
        * ```
        */
        async listBuckets(options = {}) {
          var _superprop_getListBuckets = () => super.listBuckets, _this3 = this;
          return _superprop_getListBuckets().call(_this3, options);
        }
        /**
        *
        * @alpha
        *
        * Deletes a vector bucket (bucket must be empty)
        * All indexes must be deleted before deleting the bucket
        *
        * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
        *
        * @category Vector Buckets
        * @param vectorBucketName - Name of the vector bucket to delete
        * @returns Promise with empty response on success or error
        *
        * @example
        * ```typescript
        * const { data, error } = await supabase
        *   .storage
        *   .vectors
        *   .deleteBucket('embeddings-old')
        * ```
        */
        async deleteBucket(vectorBucketName) {
          var _superprop_getDeleteBucket = () => super.deleteBucket, _this4 = this;
          return _superprop_getDeleteBucket().call(_this4, vectorBucketName);
        }
      };
      VectorBucketScope = class extends VectorIndexApi {
        /**
        * @alpha
        *
        * Creates a helper that automatically scopes all index operations to the provided bucket.
        *
        * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
        *
        * @category Vector Buckets
        * @example
        * ```typescript
        * const bucket = supabase.storage.vectors.from('embeddings-prod')
        * ```
        */
        constructor(url, headers, vectorBucketName, fetch$1) {
          super(url, headers, fetch$1);
          this.vectorBucketName = vectorBucketName;
        }
        /**
        *
        * @alpha
        *
        * Creates a new vector index in this bucket
        * Convenience method that automatically includes the bucket name
        *
        * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
        *
        * @category Vector Buckets
        * @param options - Index configuration (vectorBucketName is automatically set)
        * @returns Promise with empty response on success or error
        *
        * @example
        * ```typescript
        * const bucket = supabase.storage.vectors.from('embeddings-prod')
        * await bucket.createIndex({
        *   indexName: 'documents-openai',
        *   dataType: 'float32',
        *   dimension: 1536,
        *   distanceMetric: 'cosine',
        *   metadataConfiguration: {
        *     nonFilterableMetadataKeys: ['raw_text']
        *   }
        * })
        * ```
        */
        async createIndex(options) {
          var _superprop_getCreateIndex = () => super.createIndex, _this5 = this;
          return _superprop_getCreateIndex().call(_this5, _objectSpread2(_objectSpread2({}, options), {}, { vectorBucketName: _this5.vectorBucketName }));
        }
        /**
        *
        * @alpha
        *
        * Lists indexes in this bucket
        * Convenience method that automatically includes the bucket name
        *
        * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
        *
        * @category Vector Buckets
        * @param options - Listing options (vectorBucketName is automatically set)
        * @returns Promise with response containing indexes array and pagination token or error
        *
        * @example
        * ```typescript
        * const bucket = supabase.storage.vectors.from('embeddings-prod')
        * const { data } = await bucket.listIndexes({ prefix: 'documents-' })
        * ```
        */
        async listIndexes(options = {}) {
          var _superprop_getListIndexes = () => super.listIndexes, _this6 = this;
          return _superprop_getListIndexes().call(_this6, _objectSpread2(_objectSpread2({}, options), {}, { vectorBucketName: _this6.vectorBucketName }));
        }
        /**
        *
        * @alpha
        *
        * Retrieves metadata for a specific index in this bucket
        * Convenience method that automatically includes the bucket name
        *
        * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
        *
        * @category Vector Buckets
        * @param indexName - Name of the index to retrieve
        * @returns Promise with index metadata or error
        *
        * @example
        * ```typescript
        * const bucket = supabase.storage.vectors.from('embeddings-prod')
        * const { data } = await bucket.getIndex('documents-openai')
        * console.log('Dimension:', data?.index.dimension)
        * ```
        */
        async getIndex(indexName) {
          var _superprop_getGetIndex = () => super.getIndex, _this7 = this;
          return _superprop_getGetIndex().call(_this7, _this7.vectorBucketName, indexName);
        }
        /**
        *
        * @alpha
        *
        * Deletes an index from this bucket
        * Convenience method that automatically includes the bucket name
        *
        * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
        *
        * @category Vector Buckets
        * @param indexName - Name of the index to delete
        * @returns Promise with empty response on success or error
        *
        * @example
        * ```typescript
        * const bucket = supabase.storage.vectors.from('embeddings-prod')
        * await bucket.deleteIndex('old-index')
        * ```
        */
        async deleteIndex(indexName) {
          var _superprop_getDeleteIndex = () => super.deleteIndex, _this8 = this;
          return _superprop_getDeleteIndex().call(_this8, _this8.vectorBucketName, indexName);
        }
        /**
        *
        * @alpha
        *
        * Access operations for a specific index within this bucket
        * Returns a scoped client for vector data operations
        *
        * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
        *
        * @category Vector Buckets
        * @param indexName - Name of the index
        * @returns Index-scoped client with vector data operations
        *
        * @example
        * ```typescript
        * const index = supabase.storage.vectors.from('embeddings-prod').index('documents-openai')
        *
        * // Insert vectors
        * await index.putVectors({
        *   vectors: [
        *     { key: 'doc-1', data: { float32: [...] }, metadata: { title: 'Intro' } }
        *   ]
        * })
        *
        * // Query similar vectors
        * const { data } = await index.queryVectors({
        *   queryVector: { float32: [...] },
        *   topK: 5
        * })
        * ```
        */
        index(indexName) {
          return new VectorIndexScope(this.url, this.headers, this.vectorBucketName, indexName, this.fetch);
        }
      };
      VectorIndexScope = class extends VectorDataApi {
        /**
        *
        * @alpha
        *
        * Creates a helper that automatically scopes all vector operations to the provided bucket/index names.
        *
        * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
        *
        * @category Vector Buckets
        * @example
        * ```typescript
        * const index = supabase.storage.vectors.from('embeddings-prod').index('documents-openai')
        * ```
        */
        constructor(url, headers, vectorBucketName, indexName, fetch$1) {
          super(url, headers, fetch$1);
          this.vectorBucketName = vectorBucketName;
          this.indexName = indexName;
        }
        /**
        *
        * @alpha
        *
        * Inserts or updates vectors in this index
        * Convenience method that automatically includes bucket and index names
        *
        * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
        *
        * @category Vector Buckets
        * @param options - Vector insertion options (bucket and index names automatically set)
        * @returns Promise with empty response on success or error
        *
        * @example
        * ```typescript
        * const index = supabase.storage.vectors.from('embeddings-prod').index('documents-openai')
        * await index.putVectors({
        *   vectors: [
        *     {
        *       key: 'doc-1',
        *       data: { float32: [0.1, 0.2, ...] },
        *       metadata: { title: 'Introduction', page: 1 }
        *     }
        *   ]
        * })
        * ```
        */
        async putVectors(options) {
          var _superprop_getPutVectors = () => super.putVectors, _this9 = this;
          return _superprop_getPutVectors().call(_this9, _objectSpread2(_objectSpread2({}, options), {}, {
            vectorBucketName: _this9.vectorBucketName,
            indexName: _this9.indexName
          }));
        }
        /**
        *
        * @alpha
        *
        * Retrieves vectors by keys from this index
        * Convenience method that automatically includes bucket and index names
        *
        * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
        *
        * @category Vector Buckets
        * @param options - Vector retrieval options (bucket and index names automatically set)
        * @returns Promise with response containing vectors array or error
        *
        * @example
        * ```typescript
        * const index = supabase.storage.vectors.from('embeddings-prod').index('documents-openai')
        * const { data } = await index.getVectors({
        *   keys: ['doc-1', 'doc-2'],
        *   returnMetadata: true
        * })
        * ```
        */
        async getVectors(options) {
          var _superprop_getGetVectors = () => super.getVectors, _this10 = this;
          return _superprop_getGetVectors().call(_this10, _objectSpread2(_objectSpread2({}, options), {}, {
            vectorBucketName: _this10.vectorBucketName,
            indexName: _this10.indexName
          }));
        }
        /**
        *
        * @alpha
        *
        * Lists vectors in this index with pagination
        * Convenience method that automatically includes bucket and index names
        *
        * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
        *
        * @category Vector Buckets
        * @param options - Listing options (bucket and index names automatically set)
        * @returns Promise with response containing vectors array and pagination token or error
        *
        * @example
        * ```typescript
        * const index = supabase.storage.vectors.from('embeddings-prod').index('documents-openai')
        * const { data } = await index.listVectors({
        *   maxResults: 500,
        *   returnMetadata: true
        * })
        * ```
        */
        async listVectors(options = {}) {
          var _superprop_getListVectors = () => super.listVectors, _this11 = this;
          return _superprop_getListVectors().call(_this11, _objectSpread2(_objectSpread2({}, options), {}, {
            vectorBucketName: _this11.vectorBucketName,
            indexName: _this11.indexName
          }));
        }
        /**
        *
        * @alpha
        *
        * Queries for similar vectors in this index
        * Convenience method that automatically includes bucket and index names
        *
        * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
        *
        * @category Vector Buckets
        * @param options - Query options (bucket and index names automatically set)
        * @returns Promise with response containing matches array of similar vectors ordered by distance or error
        *
        * @example
        * ```typescript
        * const index = supabase.storage.vectors.from('embeddings-prod').index('documents-openai')
        * const { data } = await index.queryVectors({
        *   queryVector: { float32: [0.1, 0.2, ...] },
        *   topK: 5,
        *   filter: { category: 'technical' },
        *   returnDistance: true,
        *   returnMetadata: true
        * })
        * ```
        */
        async queryVectors(options) {
          var _superprop_getQueryVectors = () => super.queryVectors, _this12 = this;
          return _superprop_getQueryVectors().call(_this12, _objectSpread2(_objectSpread2({}, options), {}, {
            vectorBucketName: _this12.vectorBucketName,
            indexName: _this12.indexName
          }));
        }
        /**
        *
        * @alpha
        *
        * Deletes vectors by keys from this index
        * Convenience method that automatically includes bucket and index names
        *
        * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
        *
        * @category Vector Buckets
        * @param options - Deletion options (bucket and index names automatically set)
        * @returns Promise with empty response on success or error
        *
        * @example
        * ```typescript
        * const index = supabase.storage.vectors.from('embeddings-prod').index('documents-openai')
        * await index.deleteVectors({
        *   keys: ['doc-1', 'doc-2', 'doc-3']
        * })
        * ```
        */
        async deleteVectors(options) {
          var _superprop_getDeleteVectors = () => super.deleteVectors, _this13 = this;
          return _superprop_getDeleteVectors().call(_this13, _objectSpread2(_objectSpread2({}, options), {}, {
            vectorBucketName: _this13.vectorBucketName,
            indexName: _this13.indexName
          }));
        }
      };
      StorageClient = class extends StorageBucketApi {
        /**
        * Creates a client for Storage buckets, files, analytics, and vectors.
        *
        * @category File Buckets
        * @example
        * ```ts
        * import { StorageClient } from '@supabase/storage-js'
        *
        * const storage = new StorageClient('https://xyzcompany.supabase.co/storage/v1', {
        *   apikey: 'public-anon-key',
        * })
        * const avatars = storage.from('avatars')
        * ```
        */
        constructor(url, headers = {}, fetch$1, opts) {
          super(url, headers, fetch$1, opts);
        }
        /**
        * Perform file operation in a bucket.
        *
        * @category File Buckets
        * @param id The bucket id to operate on.
        *
        * @example
        * ```typescript
        * const avatars = supabase.storage.from('avatars')
        * ```
        */
        from(id) {
          return new StorageFileApi(this.url, this.headers, id, this.fetch);
        }
        /**
        *
        * @alpha
        *
        * Access vector storage operations.
        *
        * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
        *
        * @category Vector Buckets
        * @returns A StorageVectorsClient instance configured with the current storage settings.
        */
        get vectors() {
          return new StorageVectorsClient(this.url + "/vector", {
            headers: this.headers,
            fetch: this.fetch
          });
        }
        /**
        *
        * @alpha
        *
        * Access analytics storage operations using Iceberg tables.
        *
        * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
        *
        * @category Analytics Buckets
        * @returns A StorageAnalyticsClient instance configured with the current storage settings.
        */
        get analytics() {
          return new StorageAnalyticsClient(this.url + "/iceberg", this.headers, this.fetch);
        }
      };
    }
  });

  // ../../node_modules/@supabase/auth-js/dist/module/lib/version.js
  var version3;
  var init_version2 = __esm({
    "../../node_modules/@supabase/auth-js/dist/module/lib/version.js"() {
      version3 = "2.93.3";
    }
  });

  // ../../node_modules/@supabase/auth-js/dist/module/lib/constants.js
  var AUTO_REFRESH_TICK_DURATION_MS, AUTO_REFRESH_TICK_THRESHOLD, EXPIRY_MARGIN_MS, GOTRUE_URL, STORAGE_KEY, DEFAULT_HEADERS2, API_VERSION_HEADER_NAME, API_VERSIONS, BASE64URL_REGEX, JWKS_TTL;
  var init_constants2 = __esm({
    "../../node_modules/@supabase/auth-js/dist/module/lib/constants.js"() {
      init_version2();
      AUTO_REFRESH_TICK_DURATION_MS = 30 * 1e3;
      AUTO_REFRESH_TICK_THRESHOLD = 3;
      EXPIRY_MARGIN_MS = AUTO_REFRESH_TICK_THRESHOLD * AUTO_REFRESH_TICK_DURATION_MS;
      GOTRUE_URL = "http://localhost:9999";
      STORAGE_KEY = "supabase.auth.token";
      DEFAULT_HEADERS2 = { "X-Client-Info": `gotrue-js/${version3}` };
      API_VERSION_HEADER_NAME = "X-Supabase-Api-Version";
      API_VERSIONS = {
        "2024-01-01": {
          timestamp: Date.parse("2024-01-01T00:00:00.0Z"),
          name: "2024-01-01"
        }
      };
      BASE64URL_REGEX = /^([a-z0-9_-]{4})*($|[a-z0-9_-]{3}$|[a-z0-9_-]{2}$)$/i;
      JWKS_TTL = 10 * 60 * 1e3;
    }
  });

  // ../../node_modules/@supabase/auth-js/dist/module/lib/errors.js
  function isAuthError(error) {
    return typeof error === "object" && error !== null && "__isAuthError" in error;
  }
  function isAuthApiError(error) {
    return isAuthError(error) && error.name === "AuthApiError";
  }
  function isAuthSessionMissingError(error) {
    return isAuthError(error) && error.name === "AuthSessionMissingError";
  }
  function isAuthImplicitGrantRedirectError(error) {
    return isAuthError(error) && error.name === "AuthImplicitGrantRedirectError";
  }
  function isAuthRetryableFetchError(error) {
    return isAuthError(error) && error.name === "AuthRetryableFetchError";
  }
  var AuthError, AuthApiError, AuthUnknownError, CustomAuthError, AuthSessionMissingError, AuthInvalidTokenResponseError, AuthInvalidCredentialsError, AuthImplicitGrantRedirectError, AuthPKCEGrantCodeExchangeError, AuthPKCECodeVerifierMissingError, AuthRetryableFetchError, AuthWeakPasswordError, AuthInvalidJwtError;
  var init_errors = __esm({
    "../../node_modules/@supabase/auth-js/dist/module/lib/errors.js"() {
      AuthError = class extends Error {
        constructor(message, status, code) {
          super(message);
          this.__isAuthError = true;
          this.name = "AuthError";
          this.status = status;
          this.code = code;
        }
      };
      AuthApiError = class extends AuthError {
        constructor(message, status, code) {
          super(message, status, code);
          this.name = "AuthApiError";
          this.status = status;
          this.code = code;
        }
      };
      AuthUnknownError = class extends AuthError {
        constructor(message, originalError) {
          super(message);
          this.name = "AuthUnknownError";
          this.originalError = originalError;
        }
      };
      CustomAuthError = class extends AuthError {
        constructor(message, name, status, code) {
          super(message, status, code);
          this.name = name;
          this.status = status;
        }
      };
      AuthSessionMissingError = class extends CustomAuthError {
        constructor() {
          super("Auth session missing!", "AuthSessionMissingError", 400, void 0);
        }
      };
      AuthInvalidTokenResponseError = class extends CustomAuthError {
        constructor() {
          super("Auth session or user missing", "AuthInvalidTokenResponseError", 500, void 0);
        }
      };
      AuthInvalidCredentialsError = class extends CustomAuthError {
        constructor(message) {
          super(message, "AuthInvalidCredentialsError", 400, void 0);
        }
      };
      AuthImplicitGrantRedirectError = class extends CustomAuthError {
        constructor(message, details = null) {
          super(message, "AuthImplicitGrantRedirectError", 500, void 0);
          this.details = null;
          this.details = details;
        }
        toJSON() {
          return {
            name: this.name,
            message: this.message,
            status: this.status,
            details: this.details
          };
        }
      };
      AuthPKCEGrantCodeExchangeError = class extends CustomAuthError {
        constructor(message, details = null) {
          super(message, "AuthPKCEGrantCodeExchangeError", 500, void 0);
          this.details = null;
          this.details = details;
        }
        toJSON() {
          return {
            name: this.name,
            message: this.message,
            status: this.status,
            details: this.details
          };
        }
      };
      AuthPKCECodeVerifierMissingError = class extends CustomAuthError {
        constructor() {
          super("PKCE code verifier not found in storage. This can happen if the auth flow was initiated in a different browser or device, or if the storage was cleared. For SSR frameworks (Next.js, SvelteKit, etc.), use @supabase/ssr on both the server and client to store the code verifier in cookies.", "AuthPKCECodeVerifierMissingError", 400, "pkce_code_verifier_not_found");
        }
      };
      AuthRetryableFetchError = class extends CustomAuthError {
        constructor(message, status) {
          super(message, "AuthRetryableFetchError", status, void 0);
        }
      };
      AuthWeakPasswordError = class extends CustomAuthError {
        constructor(message, status, reasons) {
          super(message, "AuthWeakPasswordError", status, "weak_password");
          this.reasons = reasons;
        }
      };
      AuthInvalidJwtError = class extends CustomAuthError {
        constructor(message) {
          super(message, "AuthInvalidJwtError", 400, "invalid_jwt");
        }
      };
    }
  });

  // ../../node_modules/@supabase/auth-js/dist/module/lib/base64url.js
  function byteToBase64URL(byte, state, emit) {
    if (byte !== null) {
      state.queue = state.queue << 8 | byte;
      state.queuedBits += 8;
      while (state.queuedBits >= 6) {
        const pos = state.queue >> state.queuedBits - 6 & 63;
        emit(TO_BASE64URL[pos]);
        state.queuedBits -= 6;
      }
    } else if (state.queuedBits > 0) {
      state.queue = state.queue << 6 - state.queuedBits;
      state.queuedBits = 6;
      while (state.queuedBits >= 6) {
        const pos = state.queue >> state.queuedBits - 6 & 63;
        emit(TO_BASE64URL[pos]);
        state.queuedBits -= 6;
      }
    }
  }
  function byteFromBase64URL(charCode, state, emit) {
    const bits = FROM_BASE64URL[charCode];
    if (bits > -1) {
      state.queue = state.queue << 6 | bits;
      state.queuedBits += 6;
      while (state.queuedBits >= 8) {
        emit(state.queue >> state.queuedBits - 8 & 255);
        state.queuedBits -= 8;
      }
    } else if (bits === -2) {
      return;
    } else {
      throw new Error(`Invalid Base64-URL character "${String.fromCharCode(charCode)}"`);
    }
  }
  function stringFromBase64URL(str) {
    const conv = [];
    const utf8Emit = (codepoint) => {
      conv.push(String.fromCodePoint(codepoint));
    };
    const utf8State = {
      utf8seq: 0,
      codepoint: 0
    };
    const b64State = { queue: 0, queuedBits: 0 };
    const byteEmit = (byte) => {
      stringFromUTF8(byte, utf8State, utf8Emit);
    };
    for (let i = 0; i < str.length; i += 1) {
      byteFromBase64URL(str.charCodeAt(i), b64State, byteEmit);
    }
    return conv.join("");
  }
  function codepointToUTF8(codepoint, emit) {
    if (codepoint <= 127) {
      emit(codepoint);
      return;
    } else if (codepoint <= 2047) {
      emit(192 | codepoint >> 6);
      emit(128 | codepoint & 63);
      return;
    } else if (codepoint <= 65535) {
      emit(224 | codepoint >> 12);
      emit(128 | codepoint >> 6 & 63);
      emit(128 | codepoint & 63);
      return;
    } else if (codepoint <= 1114111) {
      emit(240 | codepoint >> 18);
      emit(128 | codepoint >> 12 & 63);
      emit(128 | codepoint >> 6 & 63);
      emit(128 | codepoint & 63);
      return;
    }
    throw new Error(`Unrecognized Unicode codepoint: ${codepoint.toString(16)}`);
  }
  function stringToUTF8(str, emit) {
    for (let i = 0; i < str.length; i += 1) {
      let codepoint = str.charCodeAt(i);
      if (codepoint > 55295 && codepoint <= 56319) {
        const highSurrogate = (codepoint - 55296) * 1024 & 65535;
        const lowSurrogate = str.charCodeAt(i + 1) - 56320 & 65535;
        codepoint = (lowSurrogate | highSurrogate) + 65536;
        i += 1;
      }
      codepointToUTF8(codepoint, emit);
    }
  }
  function stringFromUTF8(byte, state, emit) {
    if (state.utf8seq === 0) {
      if (byte <= 127) {
        emit(byte);
        return;
      }
      for (let leadingBit = 1; leadingBit < 6; leadingBit += 1) {
        if ((byte >> 7 - leadingBit & 1) === 0) {
          state.utf8seq = leadingBit;
          break;
        }
      }
      if (state.utf8seq === 2) {
        state.codepoint = byte & 31;
      } else if (state.utf8seq === 3) {
        state.codepoint = byte & 15;
      } else if (state.utf8seq === 4) {
        state.codepoint = byte & 7;
      } else {
        throw new Error("Invalid UTF-8 sequence");
      }
      state.utf8seq -= 1;
    } else if (state.utf8seq > 0) {
      if (byte <= 127) {
        throw new Error("Invalid UTF-8 sequence");
      }
      state.codepoint = state.codepoint << 6 | byte & 63;
      state.utf8seq -= 1;
      if (state.utf8seq === 0) {
        emit(state.codepoint);
      }
    }
  }
  function base64UrlToUint8Array(str) {
    const result = [];
    const state = { queue: 0, queuedBits: 0 };
    const onByte = (byte) => {
      result.push(byte);
    };
    for (let i = 0; i < str.length; i += 1) {
      byteFromBase64URL(str.charCodeAt(i), state, onByte);
    }
    return new Uint8Array(result);
  }
  function stringToUint8Array(str) {
    const result = [];
    stringToUTF8(str, (byte) => result.push(byte));
    return new Uint8Array(result);
  }
  function bytesToBase64URL(bytes) {
    const result = [];
    const state = { queue: 0, queuedBits: 0 };
    const onChar = (char) => {
      result.push(char);
    };
    bytes.forEach((byte) => byteToBase64URL(byte, state, onChar));
    byteToBase64URL(null, state, onChar);
    return result.join("");
  }
  var TO_BASE64URL, IGNORE_BASE64URL, FROM_BASE64URL;
  var init_base64url = __esm({
    "../../node_modules/@supabase/auth-js/dist/module/lib/base64url.js"() {
      TO_BASE64URL = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_".split("");
      IGNORE_BASE64URL = " 	\n\r=".split("");
      FROM_BASE64URL = (() => {
        const charMap = new Array(128);
        for (let i = 0; i < charMap.length; i += 1) {
          charMap[i] = -1;
        }
        for (let i = 0; i < IGNORE_BASE64URL.length; i += 1) {
          charMap[IGNORE_BASE64URL[i].charCodeAt(0)] = -2;
        }
        for (let i = 0; i < TO_BASE64URL.length; i += 1) {
          charMap[TO_BASE64URL[i].charCodeAt(0)] = i;
        }
        return charMap;
      })();
    }
  });

  // ../../node_modules/@supabase/auth-js/dist/module/lib/helpers.js
  function expiresAt(expiresIn) {
    const timeNow = Math.round(Date.now() / 1e3);
    return timeNow + expiresIn;
  }
  function generateCallbackId() {
    return Symbol("auth-callback");
  }
  function parseParametersFromURL(href) {
    const result = {};
    const url = new URL(href);
    if (url.hash && url.hash[0] === "#") {
      try {
        const hashSearchParams = new URLSearchParams(url.hash.substring(1));
        hashSearchParams.forEach((value, key) => {
          result[key] = value;
        });
      } catch (e) {
      }
    }
    url.searchParams.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }
  function decodeJWT(token) {
    const parts = token.split(".");
    if (parts.length !== 3) {
      throw new AuthInvalidJwtError("Invalid JWT structure");
    }
    for (let i = 0; i < parts.length; i++) {
      if (!BASE64URL_REGEX.test(parts[i])) {
        throw new AuthInvalidJwtError("JWT not in base64url format");
      }
    }
    const data = {
      // using base64url lib
      header: JSON.parse(stringFromBase64URL(parts[0])),
      payload: JSON.parse(stringFromBase64URL(parts[1])),
      signature: base64UrlToUint8Array(parts[2]),
      raw: {
        header: parts[0],
        payload: parts[1]
      }
    };
    return data;
  }
  async function sleep(time) {
    return await new Promise((accept) => {
      setTimeout(() => accept(null), time);
    });
  }
  function retryable(fn, isRetryable) {
    const promise = new Promise((accept, reject) => {
      ;
      (async () => {
        for (let attempt = 0; attempt < Infinity; attempt++) {
          try {
            const result = await fn(attempt);
            if (!isRetryable(attempt, null, result)) {
              accept(result);
              return;
            }
          } catch (e) {
            if (!isRetryable(attempt, e)) {
              reject(e);
              return;
            }
          }
        }
      })();
    });
    return promise;
  }
  function dec2hex(dec) {
    return ("0" + dec.toString(16)).substr(-2);
  }
  function generatePKCEVerifier() {
    const verifierLength = 56;
    const array = new Uint32Array(verifierLength);
    if (typeof crypto === "undefined") {
      const charSet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
      const charSetLen = charSet.length;
      let verifier = "";
      for (let i = 0; i < verifierLength; i++) {
        verifier += charSet.charAt(Math.floor(Math.random() * charSetLen));
      }
      return verifier;
    }
    crypto.getRandomValues(array);
    return Array.from(array, dec2hex).join("");
  }
  async function sha256(randomString) {
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(randomString);
    const hash = await crypto.subtle.digest("SHA-256", encodedData);
    const bytes = new Uint8Array(hash);
    return Array.from(bytes).map((c) => String.fromCharCode(c)).join("");
  }
  async function generatePKCEChallenge(verifier) {
    const hasCryptoSupport = typeof crypto !== "undefined" && typeof crypto.subtle !== "undefined" && typeof TextEncoder !== "undefined";
    if (!hasCryptoSupport) {
      console.warn("WebCrypto API is not supported. Code challenge method will default to use plain instead of sha256.");
      return verifier;
    }
    const hashed = await sha256(verifier);
    return btoa(hashed).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  async function getCodeChallengeAndMethod(storage, storageKey, isPasswordRecovery = false) {
    const codeVerifier = generatePKCEVerifier();
    let storedCodeVerifier = codeVerifier;
    if (isPasswordRecovery) {
      storedCodeVerifier += "/PASSWORD_RECOVERY";
    }
    await setItemAsync(storage, `${storageKey}-code-verifier`, storedCodeVerifier);
    const codeChallenge = await generatePKCEChallenge(codeVerifier);
    const codeChallengeMethod = codeVerifier === codeChallenge ? "plain" : "s256";
    return [codeChallenge, codeChallengeMethod];
  }
  function parseResponseAPIVersion(response) {
    const apiVersion = response.headers.get(API_VERSION_HEADER_NAME);
    if (!apiVersion) {
      return null;
    }
    if (!apiVersion.match(API_VERSION_REGEX)) {
      return null;
    }
    try {
      const date = /* @__PURE__ */ new Date(`${apiVersion}T00:00:00.0Z`);
      return date;
    } catch (e) {
      return null;
    }
  }
  function validateExp(exp) {
    if (!exp) {
      throw new Error("Missing exp claim");
    }
    const timeNow = Math.floor(Date.now() / 1e3);
    if (exp <= timeNow) {
      throw new Error("JWT has expired");
    }
  }
  function getAlgorithm(alg) {
    switch (alg) {
      case "RS256":
        return {
          name: "RSASSA-PKCS1-v1_5",
          hash: { name: "SHA-256" }
        };
      case "ES256":
        return {
          name: "ECDSA",
          namedCurve: "P-256",
          hash: { name: "SHA-256" }
        };
      default:
        throw new Error("Invalid alg claim");
    }
  }
  function validateUUID(str) {
    if (!UUID_REGEX.test(str)) {
      throw new Error("@supabase/auth-js: Expected parameter to be UUID but is not");
    }
  }
  function userNotAvailableProxy() {
    const proxyTarget = {};
    return new Proxy(proxyTarget, {
      get: (target, prop) => {
        if (prop === "__isUserNotAvailableProxy") {
          return true;
        }
        if (typeof prop === "symbol") {
          const sProp = prop.toString();
          if (sProp === "Symbol(Symbol.toPrimitive)" || sProp === "Symbol(Symbol.toStringTag)" || sProp === "Symbol(util.inspect.custom)") {
            return void 0;
          }
        }
        throw new Error(`@supabase/auth-js: client was created with userStorage option and there was no user stored in the user storage. Accessing the "${prop}" property of the session object is not supported. Please use getUser() instead.`);
      },
      set: (_target, prop) => {
        throw new Error(`@supabase/auth-js: client was created with userStorage option and there was no user stored in the user storage. Setting the "${prop}" property of the session object is not supported. Please use getUser() to fetch a user object you can manipulate.`);
      },
      deleteProperty: (_target, prop) => {
        throw new Error(`@supabase/auth-js: client was created with userStorage option and there was no user stored in the user storage. Deleting the "${prop}" property of the session object is not supported. Please use getUser() to fetch a user object you can manipulate.`);
      }
    });
  }
  function insecureUserWarningProxy(user, suppressWarningRef) {
    return new Proxy(user, {
      get: (target, prop, receiver) => {
        if (prop === "__isInsecureUserWarningProxy") {
          return true;
        }
        if (typeof prop === "symbol") {
          const sProp = prop.toString();
          if (sProp === "Symbol(Symbol.toPrimitive)" || sProp === "Symbol(Symbol.toStringTag)" || sProp === "Symbol(util.inspect.custom)" || sProp === "Symbol(nodejs.util.inspect.custom)") {
            return Reflect.get(target, prop, receiver);
          }
        }
        if (!suppressWarningRef.value && typeof prop === "string") {
          console.warn("Using the user object as returned from supabase.auth.getSession() or from some supabase.auth.onAuthStateChange() events could be insecure! This value comes directly from the storage medium (usually cookies on the server) and may not be authentic. Use supabase.auth.getUser() instead which authenticates the data by contacting the Supabase Auth server.");
          suppressWarningRef.value = true;
        }
        return Reflect.get(target, prop, receiver);
      }
    });
  }
  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }
  var isBrowser, localStorageWriteTests, supportsLocalStorage, resolveFetch3, looksLikeFetchResponse, setItemAsync, getItemAsync, removeItemAsync, Deferred, API_VERSION_REGEX, UUID_REGEX;
  var init_helpers = __esm({
    "../../node_modules/@supabase/auth-js/dist/module/lib/helpers.js"() {
      init_constants2();
      init_errors();
      init_base64url();
      isBrowser = () => typeof window !== "undefined" && typeof document !== "undefined";
      localStorageWriteTests = {
        tested: false,
        writable: false
      };
      supportsLocalStorage = () => {
        if (!isBrowser()) {
          return false;
        }
        try {
          if (typeof globalThis.localStorage !== "object") {
            return false;
          }
        } catch (e) {
          return false;
        }
        if (localStorageWriteTests.tested) {
          return localStorageWriteTests.writable;
        }
        const randomKey = `lswt-${Math.random()}${Math.random()}`;
        try {
          globalThis.localStorage.setItem(randomKey, randomKey);
          globalThis.localStorage.removeItem(randomKey);
          localStorageWriteTests.tested = true;
          localStorageWriteTests.writable = true;
        } catch (e) {
          localStorageWriteTests.tested = true;
          localStorageWriteTests.writable = false;
        }
        return localStorageWriteTests.writable;
      };
      resolveFetch3 = (customFetch) => {
        if (customFetch) {
          return (...args) => customFetch(...args);
        }
        return (...args) => fetch(...args);
      };
      looksLikeFetchResponse = (maybeResponse) => {
        return typeof maybeResponse === "object" && maybeResponse !== null && "status" in maybeResponse && "ok" in maybeResponse && "json" in maybeResponse && typeof maybeResponse.json === "function";
      };
      setItemAsync = async (storage, key, data) => {
        await storage.setItem(key, JSON.stringify(data));
      };
      getItemAsync = async (storage, key) => {
        const value = await storage.getItem(key);
        if (!value) {
          return null;
        }
        try {
          return JSON.parse(value);
        } catch (_a) {
          return value;
        }
      };
      removeItemAsync = async (storage, key) => {
        await storage.removeItem(key);
      };
      Deferred = class _Deferred {
        constructor() {
          ;
          this.promise = new _Deferred.promiseConstructor((res, rej) => {
            ;
            this.resolve = res;
            this.reject = rej;
          });
        }
      };
      Deferred.promiseConstructor = Promise;
      API_VERSION_REGEX = /^2[0-9]{3}-(0[1-9]|1[0-2])-(0[1-9]|1[0-9]|2[0-9]|3[0-1])$/i;
      UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
    }
  });

  // ../../node_modules/@supabase/auth-js/dist/module/lib/fetch.js
  async function handleError2(error) {
    var _a;
    if (!looksLikeFetchResponse(error)) {
      throw new AuthRetryableFetchError(_getErrorMessage2(error), 0);
    }
    if (NETWORK_ERROR_CODES.includes(error.status)) {
      throw new AuthRetryableFetchError(_getErrorMessage2(error), error.status);
    }
    let data;
    try {
      data = await error.json();
    } catch (e) {
      throw new AuthUnknownError(_getErrorMessage2(e), e);
    }
    let errorCode = void 0;
    const responseAPIVersion = parseResponseAPIVersion(error);
    if (responseAPIVersion && responseAPIVersion.getTime() >= API_VERSIONS["2024-01-01"].timestamp && typeof data === "object" && data && typeof data.code === "string") {
      errorCode = data.code;
    } else if (typeof data === "object" && data && typeof data.error_code === "string") {
      errorCode = data.error_code;
    }
    if (!errorCode) {
      if (typeof data === "object" && data && typeof data.weak_password === "object" && data.weak_password && Array.isArray(data.weak_password.reasons) && data.weak_password.reasons.length && data.weak_password.reasons.reduce((a, i) => a && typeof i === "string", true)) {
        throw new AuthWeakPasswordError(_getErrorMessage2(data), error.status, data.weak_password.reasons);
      }
    } else if (errorCode === "weak_password") {
      throw new AuthWeakPasswordError(_getErrorMessage2(data), error.status, ((_a = data.weak_password) === null || _a === void 0 ? void 0 : _a.reasons) || []);
    } else if (errorCode === "session_not_found") {
      throw new AuthSessionMissingError();
    }
    throw new AuthApiError(_getErrorMessage2(data), error.status || 500, errorCode);
  }
  async function _request(fetcher, method, url, options) {
    var _a;
    const headers = Object.assign({}, options === null || options === void 0 ? void 0 : options.headers);
    if (!headers[API_VERSION_HEADER_NAME]) {
      headers[API_VERSION_HEADER_NAME] = API_VERSIONS["2024-01-01"].name;
    }
    if (options === null || options === void 0 ? void 0 : options.jwt) {
      headers["Authorization"] = `Bearer ${options.jwt}`;
    }
    const qs = (_a = options === null || options === void 0 ? void 0 : options.query) !== null && _a !== void 0 ? _a : {};
    if (options === null || options === void 0 ? void 0 : options.redirectTo) {
      qs["redirect_to"] = options.redirectTo;
    }
    const queryString = Object.keys(qs).length ? "?" + new URLSearchParams(qs).toString() : "";
    const data = await _handleRequest2(fetcher, method, url + queryString, {
      headers,
      noResolveJson: options === null || options === void 0 ? void 0 : options.noResolveJson
    }, {}, options === null || options === void 0 ? void 0 : options.body);
    return (options === null || options === void 0 ? void 0 : options.xform) ? options === null || options === void 0 ? void 0 : options.xform(data) : { data: Object.assign({}, data), error: null };
  }
  async function _handleRequest2(fetcher, method, url, options, parameters, body) {
    const requestParams = _getRequestParams2(method, options, parameters, body);
    let result;
    try {
      result = await fetcher(url, Object.assign({}, requestParams));
    } catch (e) {
      console.error(e);
      throw new AuthRetryableFetchError(_getErrorMessage2(e), 0);
    }
    if (!result.ok) {
      await handleError2(result);
    }
    if (options === null || options === void 0 ? void 0 : options.noResolveJson) {
      return result;
    }
    try {
      return await result.json();
    } catch (e) {
      await handleError2(e);
    }
  }
  function _sessionResponse(data) {
    var _a;
    let session = null;
    if (hasSession(data)) {
      session = Object.assign({}, data);
      if (!data.expires_at) {
        session.expires_at = expiresAt(data.expires_in);
      }
    }
    const user = (_a = data.user) !== null && _a !== void 0 ? _a : data;
    return { data: { session, user }, error: null };
  }
  function _sessionResponsePassword(data) {
    const response = _sessionResponse(data);
    if (!response.error && data.weak_password && typeof data.weak_password === "object" && Array.isArray(data.weak_password.reasons) && data.weak_password.reasons.length && data.weak_password.message && typeof data.weak_password.message === "string" && data.weak_password.reasons.reduce((a, i) => a && typeof i === "string", true)) {
      response.data.weak_password = data.weak_password;
    }
    return response;
  }
  function _userResponse(data) {
    var _a;
    const user = (_a = data.user) !== null && _a !== void 0 ? _a : data;
    return { data: { user }, error: null };
  }
  function _ssoResponse(data) {
    return { data, error: null };
  }
  function _generateLinkResponse(data) {
    const { action_link, email_otp, hashed_token, redirect_to, verification_type } = data, rest = __rest(data, ["action_link", "email_otp", "hashed_token", "redirect_to", "verification_type"]);
    const properties = {
      action_link,
      email_otp,
      hashed_token,
      redirect_to,
      verification_type
    };
    const user = Object.assign({}, rest);
    return {
      data: {
        properties,
        user
      },
      error: null
    };
  }
  function _noResolveJsonResponse(data) {
    return data;
  }
  function hasSession(data) {
    return data.access_token && data.refresh_token && data.expires_in;
  }
  var _getErrorMessage2, NETWORK_ERROR_CODES, _getRequestParams2;
  var init_fetch = __esm({
    "../../node_modules/@supabase/auth-js/dist/module/lib/fetch.js"() {
      init_tslib_es6();
      init_constants2();
      init_helpers();
      init_errors();
      _getErrorMessage2 = (err) => err.msg || err.message || err.error_description || err.error || JSON.stringify(err);
      NETWORK_ERROR_CODES = [502, 503, 504];
      _getRequestParams2 = (method, options, parameters, body) => {
        const params = { method, headers: (options === null || options === void 0 ? void 0 : options.headers) || {} };
        if (method === "GET") {
          return params;
        }
        params.headers = Object.assign({ "Content-Type": "application/json;charset=UTF-8" }, options === null || options === void 0 ? void 0 : options.headers);
        params.body = JSON.stringify(body);
        return Object.assign(Object.assign({}, params), parameters);
      };
    }
  });

  // ../../node_modules/@supabase/auth-js/dist/module/lib/types.js
  var SIGN_OUT_SCOPES;
  var init_types2 = __esm({
    "../../node_modules/@supabase/auth-js/dist/module/lib/types.js"() {
      SIGN_OUT_SCOPES = ["global", "local", "others"];
    }
  });

  // ../../node_modules/@supabase/auth-js/dist/module/GoTrueAdminApi.js
  var GoTrueAdminApi;
  var init_GoTrueAdminApi = __esm({
    "../../node_modules/@supabase/auth-js/dist/module/GoTrueAdminApi.js"() {
      init_tslib_es6();
      init_fetch();
      init_helpers();
      init_types2();
      init_errors();
      GoTrueAdminApi = class {
        /**
         * Creates an admin API client that can be used to manage users and OAuth clients.
         *
         * @example
         * ```ts
         * import { GoTrueAdminApi } from '@supabase/auth-js'
         *
         * const admin = new GoTrueAdminApi({
         *   url: 'https://xyzcompany.supabase.co/auth/v1',
         *   headers: { Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` },
         * })
         * ```
         */
        constructor({ url = "", headers = {}, fetch: fetch2 }) {
          this.url = url;
          this.headers = headers;
          this.fetch = resolveFetch3(fetch2);
          this.mfa = {
            listFactors: this._listFactors.bind(this),
            deleteFactor: this._deleteFactor.bind(this)
          };
          this.oauth = {
            listClients: this._listOAuthClients.bind(this),
            createClient: this._createOAuthClient.bind(this),
            getClient: this._getOAuthClient.bind(this),
            updateClient: this._updateOAuthClient.bind(this),
            deleteClient: this._deleteOAuthClient.bind(this),
            regenerateClientSecret: this._regenerateOAuthClientSecret.bind(this)
          };
        }
        /**
         * Removes a logged-in session.
         * @param jwt A valid, logged-in JWT.
         * @param scope The logout sope.
         */
        async signOut(jwt, scope = SIGN_OUT_SCOPES[0]) {
          if (SIGN_OUT_SCOPES.indexOf(scope) < 0) {
            throw new Error(`@supabase/auth-js: Parameter scope must be one of ${SIGN_OUT_SCOPES.join(", ")}`);
          }
          try {
            await _request(this.fetch, "POST", `${this.url}/logout?scope=${scope}`, {
              headers: this.headers,
              jwt,
              noResolveJson: true
            });
            return { data: null, error: null };
          } catch (error) {
            if (isAuthError(error)) {
              return { data: null, error };
            }
            throw error;
          }
        }
        /**
         * Sends an invite link to an email address.
         * @param email The email address of the user.
         * @param options Additional options to be included when inviting.
         */
        async inviteUserByEmail(email, options = {}) {
          try {
            return await _request(this.fetch, "POST", `${this.url}/invite`, {
              body: { email, data: options.data },
              headers: this.headers,
              redirectTo: options.redirectTo,
              xform: _userResponse
            });
          } catch (error) {
            if (isAuthError(error)) {
              return { data: { user: null }, error };
            }
            throw error;
          }
        }
        /**
         * Generates email links and OTPs to be sent via a custom email provider.
         * @param email The user's email.
         * @param options.password User password. For signup only.
         * @param options.data Optional user metadata. For signup only.
         * @param options.redirectTo The redirect url which should be appended to the generated link
         */
        async generateLink(params) {
          try {
            const { options } = params, rest = __rest(params, ["options"]);
            const body = Object.assign(Object.assign({}, rest), options);
            if ("newEmail" in rest) {
              body.new_email = rest === null || rest === void 0 ? void 0 : rest.newEmail;
              delete body["newEmail"];
            }
            return await _request(this.fetch, "POST", `${this.url}/admin/generate_link`, {
              body,
              headers: this.headers,
              xform: _generateLinkResponse,
              redirectTo: options === null || options === void 0 ? void 0 : options.redirectTo
            });
          } catch (error) {
            if (isAuthError(error)) {
              return {
                data: {
                  properties: null,
                  user: null
                },
                error
              };
            }
            throw error;
          }
        }
        // User Admin API
        /**
         * Creates a new user.
         * This function should only be called on a server. Never expose your `service_role` key in the browser.
         */
        async createUser(attributes) {
          try {
            return await _request(this.fetch, "POST", `${this.url}/admin/users`, {
              body: attributes,
              headers: this.headers,
              xform: _userResponse
            });
          } catch (error) {
            if (isAuthError(error)) {
              return { data: { user: null }, error };
            }
            throw error;
          }
        }
        /**
         * Get a list of users.
         *
         * This function should only be called on a server. Never expose your `service_role` key in the browser.
         * @param params An object which supports `page` and `perPage` as numbers, to alter the paginated results.
         */
        async listUsers(params) {
          var _a, _b, _c, _d, _e, _f, _g;
          try {
            const pagination = { nextPage: null, lastPage: 0, total: 0 };
            const response = await _request(this.fetch, "GET", `${this.url}/admin/users`, {
              headers: this.headers,
              noResolveJson: true,
              query: {
                page: (_b = (_a = params === null || params === void 0 ? void 0 : params.page) === null || _a === void 0 ? void 0 : _a.toString()) !== null && _b !== void 0 ? _b : "",
                per_page: (_d = (_c = params === null || params === void 0 ? void 0 : params.perPage) === null || _c === void 0 ? void 0 : _c.toString()) !== null && _d !== void 0 ? _d : ""
              },
              xform: _noResolveJsonResponse
            });
            if (response.error)
              throw response.error;
            const users = await response.json();
            const total = (_e = response.headers.get("x-total-count")) !== null && _e !== void 0 ? _e : 0;
            const links = (_g = (_f = response.headers.get("link")) === null || _f === void 0 ? void 0 : _f.split(",")) !== null && _g !== void 0 ? _g : [];
            if (links.length > 0) {
              links.forEach((link) => {
                const page = parseInt(link.split(";")[0].split("=")[1].substring(0, 1));
                const rel = JSON.parse(link.split(";")[1].split("=")[1]);
                pagination[`${rel}Page`] = page;
              });
              pagination.total = parseInt(total);
            }
            return { data: Object.assign(Object.assign({}, users), pagination), error: null };
          } catch (error) {
            if (isAuthError(error)) {
              return { data: { users: [] }, error };
            }
            throw error;
          }
        }
        /**
         * Get user by id.
         *
         * @param uid The user's unique identifier
         *
         * This function should only be called on a server. Never expose your `service_role` key in the browser.
         */
        async getUserById(uid) {
          validateUUID(uid);
          try {
            return await _request(this.fetch, "GET", `${this.url}/admin/users/${uid}`, {
              headers: this.headers,
              xform: _userResponse
            });
          } catch (error) {
            if (isAuthError(error)) {
              return { data: { user: null }, error };
            }
            throw error;
          }
        }
        /**
         * Updates the user data. Changes are applied directly without confirmation flows.
         *
         * @param attributes The data you want to update.
         *
         * This function should only be called on a server. Never expose your `service_role` key in the browser.
         */
        async updateUserById(uid, attributes) {
          validateUUID(uid);
          try {
            return await _request(this.fetch, "PUT", `${this.url}/admin/users/${uid}`, {
              body: attributes,
              headers: this.headers,
              xform: _userResponse
            });
          } catch (error) {
            if (isAuthError(error)) {
              return { data: { user: null }, error };
            }
            throw error;
          }
        }
        /**
         * Delete a user. Requires a `service_role` key.
         *
         * @param id The user id you want to remove.
         * @param shouldSoftDelete If true, then the user will be soft-deleted from the auth schema. Soft deletion allows user identification from the hashed user ID but is not reversible.
         * Defaults to false for backward compatibility.
         *
         * This function should only be called on a server. Never expose your `service_role` key in the browser.
         */
        async deleteUser(id, shouldSoftDelete = false) {
          validateUUID(id);
          try {
            return await _request(this.fetch, "DELETE", `${this.url}/admin/users/${id}`, {
              headers: this.headers,
              body: {
                should_soft_delete: shouldSoftDelete
              },
              xform: _userResponse
            });
          } catch (error) {
            if (isAuthError(error)) {
              return { data: { user: null }, error };
            }
            throw error;
          }
        }
        async _listFactors(params) {
          validateUUID(params.userId);
          try {
            const { data, error } = await _request(this.fetch, "GET", `${this.url}/admin/users/${params.userId}/factors`, {
              headers: this.headers,
              xform: (factors) => {
                return { data: { factors }, error: null };
              }
            });
            return { data, error };
          } catch (error) {
            if (isAuthError(error)) {
              return { data: null, error };
            }
            throw error;
          }
        }
        async _deleteFactor(params) {
          validateUUID(params.userId);
          validateUUID(params.id);
          try {
            const data = await _request(this.fetch, "DELETE", `${this.url}/admin/users/${params.userId}/factors/${params.id}`, {
              headers: this.headers
            });
            return { data, error: null };
          } catch (error) {
            if (isAuthError(error)) {
              return { data: null, error };
            }
            throw error;
          }
        }
        /**
         * Lists all OAuth clients with optional pagination.
         * Only relevant when the OAuth 2.1 server is enabled in Supabase Auth.
         *
         * This function should only be called on a server. Never expose your `service_role` key in the browser.
         */
        async _listOAuthClients(params) {
          var _a, _b, _c, _d, _e, _f, _g;
          try {
            const pagination = { nextPage: null, lastPage: 0, total: 0 };
            const response = await _request(this.fetch, "GET", `${this.url}/admin/oauth/clients`, {
              headers: this.headers,
              noResolveJson: true,
              query: {
                page: (_b = (_a = params === null || params === void 0 ? void 0 : params.page) === null || _a === void 0 ? void 0 : _a.toString()) !== null && _b !== void 0 ? _b : "",
                per_page: (_d = (_c = params === null || params === void 0 ? void 0 : params.perPage) === null || _c === void 0 ? void 0 : _c.toString()) !== null && _d !== void 0 ? _d : ""
              },
              xform: _noResolveJsonResponse
            });
            if (response.error)
              throw response.error;
            const clients = await response.json();
            const total = (_e = response.headers.get("x-total-count")) !== null && _e !== void 0 ? _e : 0;
            const links = (_g = (_f = response.headers.get("link")) === null || _f === void 0 ? void 0 : _f.split(",")) !== null && _g !== void 0 ? _g : [];
            if (links.length > 0) {
              links.forEach((link) => {
                const page = parseInt(link.split(";")[0].split("=")[1].substring(0, 1));
                const rel = JSON.parse(link.split(";")[1].split("=")[1]);
                pagination[`${rel}Page`] = page;
              });
              pagination.total = parseInt(total);
            }
            return { data: Object.assign(Object.assign({}, clients), pagination), error: null };
          } catch (error) {
            if (isAuthError(error)) {
              return { data: { clients: [] }, error };
            }
            throw error;
          }
        }
        /**
         * Creates a new OAuth client.
         * Only relevant when the OAuth 2.1 server is enabled in Supabase Auth.
         *
         * This function should only be called on a server. Never expose your `service_role` key in the browser.
         */
        async _createOAuthClient(params) {
          try {
            return await _request(this.fetch, "POST", `${this.url}/admin/oauth/clients`, {
              body: params,
              headers: this.headers,
              xform: (client) => {
                return { data: client, error: null };
              }
            });
          } catch (error) {
            if (isAuthError(error)) {
              return { data: null, error };
            }
            throw error;
          }
        }
        /**
         * Gets details of a specific OAuth client.
         * Only relevant when the OAuth 2.1 server is enabled in Supabase Auth.
         *
         * This function should only be called on a server. Never expose your `service_role` key in the browser.
         */
        async _getOAuthClient(clientId) {
          try {
            return await _request(this.fetch, "GET", `${this.url}/admin/oauth/clients/${clientId}`, {
              headers: this.headers,
              xform: (client) => {
                return { data: client, error: null };
              }
            });
          } catch (error) {
            if (isAuthError(error)) {
              return { data: null, error };
            }
            throw error;
          }
        }
        /**
         * Updates an existing OAuth client.
         * Only relevant when the OAuth 2.1 server is enabled in Supabase Auth.
         *
         * This function should only be called on a server. Never expose your `service_role` key in the browser.
         */
        async _updateOAuthClient(clientId, params) {
          try {
            return await _request(this.fetch, "PUT", `${this.url}/admin/oauth/clients/${clientId}`, {
              body: params,
              headers: this.headers,
              xform: (client) => {
                return { data: client, error: null };
              }
            });
          } catch (error) {
            if (isAuthError(error)) {
              return { data: null, error };
            }
            throw error;
          }
        }
        /**
         * Deletes an OAuth client.
         * Only relevant when the OAuth 2.1 server is enabled in Supabase Auth.
         *
         * This function should only be called on a server. Never expose your `service_role` key in the browser.
         */
        async _deleteOAuthClient(clientId) {
          try {
            await _request(this.fetch, "DELETE", `${this.url}/admin/oauth/clients/${clientId}`, {
              headers: this.headers,
              noResolveJson: true
            });
            return { data: null, error: null };
          } catch (error) {
            if (isAuthError(error)) {
              return { data: null, error };
            }
            throw error;
          }
        }
        /**
         * Regenerates the secret for an OAuth client.
         * Only relevant when the OAuth 2.1 server is enabled in Supabase Auth.
         *
         * This function should only be called on a server. Never expose your `service_role` key in the browser.
         */
        async _regenerateOAuthClientSecret(clientId) {
          try {
            return await _request(this.fetch, "POST", `${this.url}/admin/oauth/clients/${clientId}/regenerate_secret`, {
              headers: this.headers,
              xform: (client) => {
                return { data: client, error: null };
              }
            });
          } catch (error) {
            if (isAuthError(error)) {
              return { data: null, error };
            }
            throw error;
          }
        }
      };
    }
  });

  // ../../node_modules/@supabase/auth-js/dist/module/lib/local-storage.js
  function memoryLocalStorageAdapter(store = {}) {
    return {
      getItem: (key) => {
        return store[key] || null;
      },
      setItem: (key, value) => {
        store[key] = value;
      },
      removeItem: (key) => {
        delete store[key];
      }
    };
  }
  var init_local_storage = __esm({
    "../../node_modules/@supabase/auth-js/dist/module/lib/local-storage.js"() {
    }
  });

  // ../../node_modules/@supabase/auth-js/dist/module/lib/locks.js
  async function navigatorLock(name, acquireTimeout, fn) {
    if (internals.debug) {
      console.log("@supabase/gotrue-js: navigatorLock: acquire lock", name, acquireTimeout);
    }
    const abortController = new globalThis.AbortController();
    if (acquireTimeout > 0) {
      setTimeout(() => {
        abortController.abort();
        if (internals.debug) {
          console.log("@supabase/gotrue-js: navigatorLock acquire timed out", name);
        }
      }, acquireTimeout);
    }
    return await Promise.resolve().then(() => globalThis.navigator.locks.request(name, acquireTimeout === 0 ? {
      mode: "exclusive",
      ifAvailable: true
    } : {
      mode: "exclusive",
      signal: abortController.signal
    }, async (lock) => {
      if (lock) {
        if (internals.debug) {
          console.log("@supabase/gotrue-js: navigatorLock: acquired", name, lock.name);
        }
        try {
          return await fn();
        } finally {
          if (internals.debug) {
            console.log("@supabase/gotrue-js: navigatorLock: released", name, lock.name);
          }
        }
      } else {
        if (acquireTimeout === 0) {
          if (internals.debug) {
            console.log("@supabase/gotrue-js: navigatorLock: not immediately available", name);
          }
          throw new NavigatorLockAcquireTimeoutError(`Acquiring an exclusive Navigator LockManager lock "${name}" immediately failed`);
        } else {
          if (internals.debug) {
            try {
              const result = await globalThis.navigator.locks.query();
              console.log("@supabase/gotrue-js: Navigator LockManager state", JSON.stringify(result, null, "  "));
            } catch (e) {
              console.warn("@supabase/gotrue-js: Error when querying Navigator LockManager state", e);
            }
          }
          console.warn("@supabase/gotrue-js: Navigator LockManager returned a null lock when using #request without ifAvailable set to true, it appears this browser is not following the LockManager spec https://developer.mozilla.org/en-US/docs/Web/API/LockManager/request");
          return await fn();
        }
      }
    }));
  }
  var internals, LockAcquireTimeoutError, NavigatorLockAcquireTimeoutError;
  var init_locks = __esm({
    "../../node_modules/@supabase/auth-js/dist/module/lib/locks.js"() {
      init_helpers();
      internals = {
        /**
         * @experimental
         */
        debug: !!(globalThis && supportsLocalStorage() && globalThis.localStorage && globalThis.localStorage.getItem("supabase.gotrue-js.locks.debug") === "true")
      };
      LockAcquireTimeoutError = class extends Error {
        constructor(message) {
          super(message);
          this.isAcquireTimeout = true;
        }
      };
      NavigatorLockAcquireTimeoutError = class extends LockAcquireTimeoutError {
      };
    }
  });

  // ../../node_modules/@supabase/auth-js/dist/module/lib/polyfills.js
  function polyfillGlobalThis() {
    if (typeof globalThis === "object")
      return;
    try {
      Object.defineProperty(Object.prototype, "__magic__", {
        get: function() {
          return this;
        },
        configurable: true
      });
      __magic__.globalThis = __magic__;
      delete Object.prototype.__magic__;
    } catch (e) {
      if (typeof self !== "undefined") {
        self.globalThis = self;
      }
    }
  }
  var init_polyfills = __esm({
    "../../node_modules/@supabase/auth-js/dist/module/lib/polyfills.js"() {
    }
  });

  // ../../node_modules/@supabase/auth-js/dist/module/lib/web3/ethereum.js
  function getAddress(address) {
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      throw new Error(`@supabase/auth-js: Address "${address}" is invalid.`);
    }
    return address.toLowerCase();
  }
  function fromHex(hex) {
    return parseInt(hex, 16);
  }
  function toHex(value) {
    const bytes = new TextEncoder().encode(value);
    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
    return "0x" + hex;
  }
  function createSiweMessage(parameters) {
    var _a;
    const { chainId, domain, expirationTime, issuedAt = /* @__PURE__ */ new Date(), nonce, notBefore, requestId, resources, scheme, uri, version: version5 } = parameters;
    {
      if (!Number.isInteger(chainId))
        throw new Error(`@supabase/auth-js: Invalid SIWE message field "chainId". Chain ID must be a EIP-155 chain ID. Provided value: ${chainId}`);
      if (!domain)
        throw new Error(`@supabase/auth-js: Invalid SIWE message field "domain". Domain must be provided.`);
      if (nonce && nonce.length < 8)
        throw new Error(`@supabase/auth-js: Invalid SIWE message field "nonce". Nonce must be at least 8 characters. Provided value: ${nonce}`);
      if (!uri)
        throw new Error(`@supabase/auth-js: Invalid SIWE message field "uri". URI must be provided.`);
      if (version5 !== "1")
        throw new Error(`@supabase/auth-js: Invalid SIWE message field "version". Version must be '1'. Provided value: ${version5}`);
      if ((_a = parameters.statement) === null || _a === void 0 ? void 0 : _a.includes("\n"))
        throw new Error(`@supabase/auth-js: Invalid SIWE message field "statement". Statement must not include '\\n'. Provided value: ${parameters.statement}`);
    }
    const address = getAddress(parameters.address);
    const origin = scheme ? `${scheme}://${domain}` : domain;
    const statement = parameters.statement ? `${parameters.statement}
` : "";
    const prefix = `${origin} wants you to sign in with your Ethereum account:
${address}

${statement}`;
    let suffix = `URI: ${uri}
Version: ${version5}
Chain ID: ${chainId}${nonce ? `
Nonce: ${nonce}` : ""}
Issued At: ${issuedAt.toISOString()}`;
    if (expirationTime)
      suffix += `
Expiration Time: ${expirationTime.toISOString()}`;
    if (notBefore)
      suffix += `
Not Before: ${notBefore.toISOString()}`;
    if (requestId)
      suffix += `
Request ID: ${requestId}`;
    if (resources) {
      let content = "\nResources:";
      for (const resource of resources) {
        if (!resource || typeof resource !== "string")
          throw new Error(`@supabase/auth-js: Invalid SIWE message field "resources". Every resource must be a valid string. Provided value: ${resource}`);
        content += `
- ${resource}`;
      }
      suffix += content;
    }
    return `${prefix}
${suffix}`;
  }
  var init_ethereum = __esm({
    "../../node_modules/@supabase/auth-js/dist/module/lib/web3/ethereum.js"() {
    }
  });

  // ../../node_modules/@supabase/auth-js/dist/module/lib/webauthn.errors.js
  function identifyRegistrationError({ error, options }) {
    var _a, _b, _c;
    const { publicKey } = options;
    if (!publicKey) {
      throw Error("options was missing required publicKey property");
    }
    if (error.name === "AbortError") {
      if (options.signal instanceof AbortSignal) {
        return new WebAuthnError({
          message: "Registration ceremony was sent an abort signal",
          code: "ERROR_CEREMONY_ABORTED",
          cause: error
        });
      }
    } else if (error.name === "ConstraintError") {
      if (((_a = publicKey.authenticatorSelection) === null || _a === void 0 ? void 0 : _a.requireResidentKey) === true) {
        return new WebAuthnError({
          message: "Discoverable credentials were required but no available authenticator supported it",
          code: "ERROR_AUTHENTICATOR_MISSING_DISCOVERABLE_CREDENTIAL_SUPPORT",
          cause: error
        });
      } else if (
        // @ts-ignore: `mediation` doesn't yet exist on CredentialCreationOptions but it's possible as of Sept 2024
        options.mediation === "conditional" && ((_b = publicKey.authenticatorSelection) === null || _b === void 0 ? void 0 : _b.userVerification) === "required"
      ) {
        return new WebAuthnError({
          message: "User verification was required during automatic registration but it could not be performed",
          code: "ERROR_AUTO_REGISTER_USER_VERIFICATION_FAILURE",
          cause: error
        });
      } else if (((_c = publicKey.authenticatorSelection) === null || _c === void 0 ? void 0 : _c.userVerification) === "required") {
        return new WebAuthnError({
          message: "User verification was required but no available authenticator supported it",
          code: "ERROR_AUTHENTICATOR_MISSING_USER_VERIFICATION_SUPPORT",
          cause: error
        });
      }
    } else if (error.name === "InvalidStateError") {
      return new WebAuthnError({
        message: "The authenticator was previously registered",
        code: "ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED",
        cause: error
      });
    } else if (error.name === "NotAllowedError") {
      return new WebAuthnError({
        message: error.message,
        code: "ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY",
        cause: error
      });
    } else if (error.name === "NotSupportedError") {
      const validPubKeyCredParams = publicKey.pubKeyCredParams.filter((param) => param.type === "public-key");
      if (validPubKeyCredParams.length === 0) {
        return new WebAuthnError({
          message: 'No entry in pubKeyCredParams was of type "public-key"',
          code: "ERROR_MALFORMED_PUBKEYCREDPARAMS",
          cause: error
        });
      }
      return new WebAuthnError({
        message: "No available authenticator supported any of the specified pubKeyCredParams algorithms",
        code: "ERROR_AUTHENTICATOR_NO_SUPPORTED_PUBKEYCREDPARAMS_ALG",
        cause: error
      });
    } else if (error.name === "SecurityError") {
      const effectiveDomain = window.location.hostname;
      if (!isValidDomain(effectiveDomain)) {
        return new WebAuthnError({
          message: `${window.location.hostname} is an invalid domain`,
          code: "ERROR_INVALID_DOMAIN",
          cause: error
        });
      } else if (publicKey.rp.id !== effectiveDomain) {
        return new WebAuthnError({
          message: `The RP ID "${publicKey.rp.id}" is invalid for this domain`,
          code: "ERROR_INVALID_RP_ID",
          cause: error
        });
      }
    } else if (error.name === "TypeError") {
      if (publicKey.user.id.byteLength < 1 || publicKey.user.id.byteLength > 64) {
        return new WebAuthnError({
          message: "User ID was not between 1 and 64 characters",
          code: "ERROR_INVALID_USER_ID_LENGTH",
          cause: error
        });
      }
    } else if (error.name === "UnknownError") {
      return new WebAuthnError({
        message: "The authenticator was unable to process the specified options, or could not create a new credential",
        code: "ERROR_AUTHENTICATOR_GENERAL_ERROR",
        cause: error
      });
    }
    return new WebAuthnError({
      message: "a Non-Webauthn related error has occurred",
      code: "ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY",
      cause: error
    });
  }
  function identifyAuthenticationError({ error, options }) {
    const { publicKey } = options;
    if (!publicKey) {
      throw Error("options was missing required publicKey property");
    }
    if (error.name === "AbortError") {
      if (options.signal instanceof AbortSignal) {
        return new WebAuthnError({
          message: "Authentication ceremony was sent an abort signal",
          code: "ERROR_CEREMONY_ABORTED",
          cause: error
        });
      }
    } else if (error.name === "NotAllowedError") {
      return new WebAuthnError({
        message: error.message,
        code: "ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY",
        cause: error
      });
    } else if (error.name === "SecurityError") {
      const effectiveDomain = window.location.hostname;
      if (!isValidDomain(effectiveDomain)) {
        return new WebAuthnError({
          message: `${window.location.hostname} is an invalid domain`,
          code: "ERROR_INVALID_DOMAIN",
          cause: error
        });
      } else if (publicKey.rpId !== effectiveDomain) {
        return new WebAuthnError({
          message: `The RP ID "${publicKey.rpId}" is invalid for this domain`,
          code: "ERROR_INVALID_RP_ID",
          cause: error
        });
      }
    } else if (error.name === "UnknownError") {
      return new WebAuthnError({
        message: "The authenticator was unable to process the specified options, or could not create a new assertion signature",
        code: "ERROR_AUTHENTICATOR_GENERAL_ERROR",
        cause: error
      });
    }
    return new WebAuthnError({
      message: "a Non-Webauthn related error has occurred",
      code: "ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY",
      cause: error
    });
  }
  var WebAuthnError, WebAuthnUnknownError;
  var init_webauthn_errors = __esm({
    "../../node_modules/@supabase/auth-js/dist/module/lib/webauthn.errors.js"() {
      init_webauthn();
      WebAuthnError = class extends Error {
        constructor({ message, code, cause, name }) {
          var _a;
          super(message, { cause });
          this.__isWebAuthnError = true;
          this.name = (_a = name !== null && name !== void 0 ? name : cause instanceof Error ? cause.name : void 0) !== null && _a !== void 0 ? _a : "Unknown Error";
          this.code = code;
        }
      };
      WebAuthnUnknownError = class extends WebAuthnError {
        constructor(message, originalError) {
          super({
            code: "ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY",
            cause: originalError,
            message
          });
          this.name = "WebAuthnUnknownError";
          this.originalError = originalError;
        }
      };
    }
  });

  // ../../node_modules/@supabase/auth-js/dist/module/lib/webauthn.js
  function deserializeCredentialCreationOptions(options) {
    if (!options) {
      throw new Error("Credential creation options are required");
    }
    if (typeof PublicKeyCredential !== "undefined" && "parseCreationOptionsFromJSON" in PublicKeyCredential && typeof PublicKeyCredential.parseCreationOptionsFromJSON === "function") {
      return PublicKeyCredential.parseCreationOptionsFromJSON(
        /** we assert the options here as typescript still doesn't know about future webauthn types */
        options
      );
    }
    const { challenge: challengeStr, user: userOpts, excludeCredentials } = options, restOptions = __rest(
      options,
      ["challenge", "user", "excludeCredentials"]
    );
    const challenge = base64UrlToUint8Array(challengeStr).buffer;
    const user = Object.assign(Object.assign({}, userOpts), { id: base64UrlToUint8Array(userOpts.id).buffer });
    const result = Object.assign(Object.assign({}, restOptions), {
      challenge,
      user
    });
    if (excludeCredentials && excludeCredentials.length > 0) {
      result.excludeCredentials = new Array(excludeCredentials.length);
      for (let i = 0; i < excludeCredentials.length; i++) {
        const cred = excludeCredentials[i];
        result.excludeCredentials[i] = Object.assign(Object.assign({}, cred), {
          id: base64UrlToUint8Array(cred.id).buffer,
          type: cred.type || "public-key",
          // Cast transports to handle future transport types like "cable"
          transports: cred.transports
        });
      }
    }
    return result;
  }
  function deserializeCredentialRequestOptions(options) {
    if (!options) {
      throw new Error("Credential request options are required");
    }
    if (typeof PublicKeyCredential !== "undefined" && "parseRequestOptionsFromJSON" in PublicKeyCredential && typeof PublicKeyCredential.parseRequestOptionsFromJSON === "function") {
      return PublicKeyCredential.parseRequestOptionsFromJSON(options);
    }
    const { challenge: challengeStr, allowCredentials } = options, restOptions = __rest(
      options,
      ["challenge", "allowCredentials"]
    );
    const challenge = base64UrlToUint8Array(challengeStr).buffer;
    const result = Object.assign(Object.assign({}, restOptions), { challenge });
    if (allowCredentials && allowCredentials.length > 0) {
      result.allowCredentials = new Array(allowCredentials.length);
      for (let i = 0; i < allowCredentials.length; i++) {
        const cred = allowCredentials[i];
        result.allowCredentials[i] = Object.assign(Object.assign({}, cred), {
          id: base64UrlToUint8Array(cred.id).buffer,
          type: cred.type || "public-key",
          // Cast transports to handle future transport types like "cable"
          transports: cred.transports
        });
      }
    }
    return result;
  }
  function serializeCredentialCreationResponse(credential) {
    var _a;
    if ("toJSON" in credential && typeof credential.toJSON === "function") {
      return credential.toJSON();
    }
    const credentialWithAttachment = credential;
    return {
      id: credential.id,
      rawId: credential.id,
      response: {
        attestationObject: bytesToBase64URL(new Uint8Array(credential.response.attestationObject)),
        clientDataJSON: bytesToBase64URL(new Uint8Array(credential.response.clientDataJSON))
      },
      type: "public-key",
      clientExtensionResults: credential.getClientExtensionResults(),
      // Convert null to undefined and cast to AuthenticatorAttachment type
      authenticatorAttachment: (_a = credentialWithAttachment.authenticatorAttachment) !== null && _a !== void 0 ? _a : void 0
    };
  }
  function serializeCredentialRequestResponse(credential) {
    var _a;
    if ("toJSON" in credential && typeof credential.toJSON === "function") {
      return credential.toJSON();
    }
    const credentialWithAttachment = credential;
    const clientExtensionResults = credential.getClientExtensionResults();
    const assertionResponse = credential.response;
    return {
      id: credential.id,
      rawId: credential.id,
      // W3C spec expects rawId to match id for JSON format
      response: {
        authenticatorData: bytesToBase64URL(new Uint8Array(assertionResponse.authenticatorData)),
        clientDataJSON: bytesToBase64URL(new Uint8Array(assertionResponse.clientDataJSON)),
        signature: bytesToBase64URL(new Uint8Array(assertionResponse.signature)),
        userHandle: assertionResponse.userHandle ? bytesToBase64URL(new Uint8Array(assertionResponse.userHandle)) : void 0
      },
      type: "public-key",
      clientExtensionResults,
      // Convert null to undefined and cast to AuthenticatorAttachment type
      authenticatorAttachment: (_a = credentialWithAttachment.authenticatorAttachment) !== null && _a !== void 0 ? _a : void 0
    };
  }
  function isValidDomain(hostname) {
    return (
      // Consider localhost valid as well since it's okay wrt Secure Contexts
      hostname === "localhost" || /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i.test(hostname)
    );
  }
  function browserSupportsWebAuthn() {
    var _a, _b;
    return !!(isBrowser() && "PublicKeyCredential" in window && window.PublicKeyCredential && "credentials" in navigator && typeof ((_a = navigator === null || navigator === void 0 ? void 0 : navigator.credentials) === null || _a === void 0 ? void 0 : _a.create) === "function" && typeof ((_b = navigator === null || navigator === void 0 ? void 0 : navigator.credentials) === null || _b === void 0 ? void 0 : _b.get) === "function");
  }
  async function createCredential(options) {
    try {
      const response = await navigator.credentials.create(
        /** we assert the type here until typescript types are updated */
        options
      );
      if (!response) {
        return {
          data: null,
          error: new WebAuthnUnknownError("Empty credential response", response)
        };
      }
      if (!(response instanceof PublicKeyCredential)) {
        return {
          data: null,
          error: new WebAuthnUnknownError("Browser returned unexpected credential type", response)
        };
      }
      return { data: response, error: null };
    } catch (err) {
      return {
        data: null,
        error: identifyRegistrationError({
          error: err,
          options
        })
      };
    }
  }
  async function getCredential(options) {
    try {
      const response = await navigator.credentials.get(
        /** we assert the type here until typescript types are updated */
        options
      );
      if (!response) {
        return {
          data: null,
          error: new WebAuthnUnknownError("Empty credential response", response)
        };
      }
      if (!(response instanceof PublicKeyCredential)) {
        return {
          data: null,
          error: new WebAuthnUnknownError("Browser returned unexpected credential type", response)
        };
      }
      return { data: response, error: null };
    } catch (err) {
      return {
        data: null,
        error: identifyAuthenticationError({
          error: err,
          options
        })
      };
    }
  }
  function deepMerge(...sources) {
    const isObject = (val) => val !== null && typeof val === "object" && !Array.isArray(val);
    const isArrayBufferLike = (val) => val instanceof ArrayBuffer || ArrayBuffer.isView(val);
    const result = {};
    for (const source of sources) {
      if (!source)
        continue;
      for (const key in source) {
        const value = source[key];
        if (value === void 0)
          continue;
        if (Array.isArray(value)) {
          result[key] = value;
        } else if (isArrayBufferLike(value)) {
          result[key] = value;
        } else if (isObject(value)) {
          const existing = result[key];
          if (isObject(existing)) {
            result[key] = deepMerge(existing, value);
          } else {
            result[key] = deepMerge(value);
          }
        } else {
          result[key] = value;
        }
      }
    }
    return result;
  }
  function mergeCredentialCreationOptions(baseOptions, overrides) {
    return deepMerge(DEFAULT_CREATION_OPTIONS, baseOptions, overrides || {});
  }
  function mergeCredentialRequestOptions(baseOptions, overrides) {
    return deepMerge(DEFAULT_REQUEST_OPTIONS, baseOptions, overrides || {});
  }
  var WebAuthnAbortService, webAuthnAbortService, DEFAULT_CREATION_OPTIONS, DEFAULT_REQUEST_OPTIONS, WebAuthnApi;
  var init_webauthn = __esm({
    "../../node_modules/@supabase/auth-js/dist/module/lib/webauthn.js"() {
      init_tslib_es6();
      init_base64url();
      init_errors();
      init_helpers();
      init_webauthn_errors();
      WebAuthnAbortService = class {
        /**
         * Create an abort signal for a new WebAuthn operation.
         * Automatically cancels any existing operation.
         *
         * @returns {AbortSignal} Signal to pass to navigator.credentials.create() or .get()
         * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal MDN - AbortSignal}
         */
        createNewAbortSignal() {
          if (this.controller) {
            const abortError = new Error("Cancelling existing WebAuthn API call for new one");
            abortError.name = "AbortError";
            this.controller.abort(abortError);
          }
          const newController = new AbortController();
          this.controller = newController;
          return newController.signal;
        }
        /**
         * Manually cancel the current WebAuthn operation.
         * Useful for cleaning up when user cancels or navigates away.
         *
         * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/AbortController/abort MDN - AbortController.abort}
         */
        cancelCeremony() {
          if (this.controller) {
            const abortError = new Error("Manually cancelling existing WebAuthn API call");
            abortError.name = "AbortError";
            this.controller.abort(abortError);
            this.controller = void 0;
          }
        }
      };
      webAuthnAbortService = new WebAuthnAbortService();
      DEFAULT_CREATION_OPTIONS = {
        hints: ["security-key"],
        authenticatorSelection: {
          authenticatorAttachment: "cross-platform",
          requireResidentKey: false,
          /** set to preferred because older yubikeys don't have PIN/Biometric */
          userVerification: "preferred",
          residentKey: "discouraged"
        },
        attestation: "direct"
      };
      DEFAULT_REQUEST_OPTIONS = {
        /** set to preferred because older yubikeys don't have PIN/Biometric */
        userVerification: "preferred",
        hints: ["security-key"],
        attestation: "direct"
      };
      WebAuthnApi = class {
        constructor(client) {
          this.client = client;
          this.enroll = this._enroll.bind(this);
          this.challenge = this._challenge.bind(this);
          this.verify = this._verify.bind(this);
          this.authenticate = this._authenticate.bind(this);
          this.register = this._register.bind(this);
        }
        /**
         * Enroll a new WebAuthn factor.
         * Creates an unverified WebAuthn factor that must be verified with a credential.
         *
         * @experimental This method is experimental and may change in future releases
         * @param {Omit<MFAEnrollWebauthnParams, 'factorType'>} params - Enrollment parameters (friendlyName required)
         * @returns {Promise<AuthMFAEnrollWebauthnResponse>} Enrolled factor details or error
         * @see {@link https://w3c.github.io/webauthn/#sctn-registering-a-new-credential W3C WebAuthn Spec - Registering a New Credential}
         */
        async _enroll(params) {
          return this.client.mfa.enroll(Object.assign(Object.assign({}, params), { factorType: "webauthn" }));
        }
        /**
         * Challenge for WebAuthn credential creation or authentication.
         * Combines server challenge with browser credential operations.
         * Handles both registration (create) and authentication (request) flows.
         *
         * @experimental This method is experimental and may change in future releases
         * @param {MFAChallengeWebauthnParams & { friendlyName?: string; signal?: AbortSignal }} params - Challenge parameters including factorId
         * @param {Object} overrides - Allows you to override the parameters passed to navigator.credentials
         * @param {PublicKeyCredentialCreationOptionsFuture} overrides.create - Override options for credential creation
         * @param {PublicKeyCredentialRequestOptionsFuture} overrides.request - Override options for credential request
         * @returns {Promise<RequestResult>} Challenge response with credential or error
         * @see {@link https://w3c.github.io/webauthn/#sctn-credential-creation W3C WebAuthn Spec - Credential Creation}
         * @see {@link https://w3c.github.io/webauthn/#sctn-verifying-assertion W3C WebAuthn Spec - Verifying Assertion}
         */
        async _challenge({ factorId, webauthn, friendlyName, signal }, overrides) {
          var _a;
          try {
            const { data: challengeResponse, error: challengeError } = await this.client.mfa.challenge({
              factorId,
              webauthn
            });
            if (!challengeResponse) {
              return { data: null, error: challengeError };
            }
            const abortSignal = signal !== null && signal !== void 0 ? signal : webAuthnAbortService.createNewAbortSignal();
            if (challengeResponse.webauthn.type === "create") {
              const { user } = challengeResponse.webauthn.credential_options.publicKey;
              if (!user.name) {
                const nameToUse = friendlyName;
                if (!nameToUse) {
                  const currentUser = await this.client.getUser();
                  const userData = currentUser.data.user;
                  const fallbackName = ((_a = userData === null || userData === void 0 ? void 0 : userData.user_metadata) === null || _a === void 0 ? void 0 : _a.name) || (userData === null || userData === void 0 ? void 0 : userData.email) || (userData === null || userData === void 0 ? void 0 : userData.id) || "User";
                  user.name = `${user.id}:${fallbackName}`;
                } else {
                  user.name = `${user.id}:${nameToUse}`;
                }
              }
              if (!user.displayName) {
                user.displayName = user.name;
              }
            }
            switch (challengeResponse.webauthn.type) {
              case "create": {
                const options = mergeCredentialCreationOptions(challengeResponse.webauthn.credential_options.publicKey, overrides === null || overrides === void 0 ? void 0 : overrides.create);
                const { data, error } = await createCredential({
                  publicKey: options,
                  signal: abortSignal
                });
                if (data) {
                  return {
                    data: {
                      factorId,
                      challengeId: challengeResponse.id,
                      webauthn: {
                        type: challengeResponse.webauthn.type,
                        credential_response: data
                      }
                    },
                    error: null
                  };
                }
                return { data: null, error };
              }
              case "request": {
                const options = mergeCredentialRequestOptions(challengeResponse.webauthn.credential_options.publicKey, overrides === null || overrides === void 0 ? void 0 : overrides.request);
                const { data, error } = await getCredential(Object.assign(Object.assign({}, challengeResponse.webauthn.credential_options), { publicKey: options, signal: abortSignal }));
                if (data) {
                  return {
                    data: {
                      factorId,
                      challengeId: challengeResponse.id,
                      webauthn: {
                        type: challengeResponse.webauthn.type,
                        credential_response: data
                      }
                    },
                    error: null
                  };
                }
                return { data: null, error };
              }
            }
          } catch (error) {
            if (isAuthError(error)) {
              return { data: null, error };
            }
            return {
              data: null,
              error: new AuthUnknownError("Unexpected error in challenge", error)
            };
          }
        }
        /**
         * Verify a WebAuthn credential with the server.
         * Completes the WebAuthn ceremony by sending the credential to the server for verification.
         *
         * @experimental This method is experimental and may change in future releases
         * @param {Object} params - Verification parameters
         * @param {string} params.challengeId - ID of the challenge being verified
         * @param {string} params.factorId - ID of the WebAuthn factor
         * @param {MFAVerifyWebauthnParams<T>['webauthn']} params.webauthn - WebAuthn credential response
         * @returns {Promise<AuthMFAVerifyResponse>} Verification result with session or error
         * @see {@link https://w3c.github.io/webauthn/#sctn-verifying-assertion W3C WebAuthn Spec - Verifying an Authentication Assertion}
         * */
        async _verify({ challengeId, factorId, webauthn }) {
          return this.client.mfa.verify({
            factorId,
            challengeId,
            webauthn
          });
        }
        /**
         * Complete WebAuthn authentication flow.
         * Performs challenge and verification in a single operation for existing credentials.
         *
         * @experimental This method is experimental and may change in future releases
         * @param {Object} params - Authentication parameters
         * @param {string} params.factorId - ID of the WebAuthn factor to authenticate with
         * @param {Object} params.webauthn - WebAuthn configuration
         * @param {string} params.webauthn.rpId - Relying Party ID (defaults to current hostname)
         * @param {string[]} params.webauthn.rpOrigins - Allowed origins (defaults to current origin)
         * @param {AbortSignal} params.webauthn.signal - Optional abort signal
         * @param {PublicKeyCredentialRequestOptionsFuture} overrides - Override options for navigator.credentials.get
         * @returns {Promise<RequestResult<AuthMFAVerifyResponseData, WebAuthnError | AuthError>>} Authentication result
         * @see {@link https://w3c.github.io/webauthn/#sctn-authentication W3C WebAuthn Spec - Authentication Ceremony}
         * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/PublicKeyCredentialRequestOptions MDN - PublicKeyCredentialRequestOptions}
         */
        async _authenticate({ factorId, webauthn: { rpId = typeof window !== "undefined" ? window.location.hostname : void 0, rpOrigins = typeof window !== "undefined" ? [window.location.origin] : void 0, signal } = {} }, overrides) {
          if (!rpId) {
            return {
              data: null,
              error: new AuthError("rpId is required for WebAuthn authentication")
            };
          }
          try {
            if (!browserSupportsWebAuthn()) {
              return {
                data: null,
                error: new AuthUnknownError("Browser does not support WebAuthn", null)
              };
            }
            const { data: challengeResponse, error: challengeError } = await this.challenge({
              factorId,
              webauthn: { rpId, rpOrigins },
              signal
            }, { request: overrides });
            if (!challengeResponse) {
              return { data: null, error: challengeError };
            }
            const { webauthn } = challengeResponse;
            return this._verify({
              factorId,
              challengeId: challengeResponse.challengeId,
              webauthn: {
                type: webauthn.type,
                rpId,
                rpOrigins,
                credential_response: webauthn.credential_response
              }
            });
          } catch (error) {
            if (isAuthError(error)) {
              return { data: null, error };
            }
            return {
              data: null,
              error: new AuthUnknownError("Unexpected error in authenticate", error)
            };
          }
        }
        /**
         * Complete WebAuthn registration flow.
         * Performs enrollment, challenge, and verification in a single operation for new credentials.
         *
         * @experimental This method is experimental and may change in future releases
         * @param {Object} params - Registration parameters
         * @param {string} params.friendlyName - User-friendly name for the credential
         * @param {string} params.rpId - Relying Party ID (defaults to current hostname)
         * @param {string[]} params.rpOrigins - Allowed origins (defaults to current origin)
         * @param {AbortSignal} params.signal - Optional abort signal
         * @param {PublicKeyCredentialCreationOptionsFuture} overrides - Override options for navigator.credentials.create
         * @returns {Promise<RequestResult<AuthMFAVerifyResponseData, WebAuthnError | AuthError>>} Registration result
         * @see {@link https://w3c.github.io/webauthn/#sctn-registering-a-new-credential W3C WebAuthn Spec - Registration Ceremony}
         * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/PublicKeyCredentialCreationOptions MDN - PublicKeyCredentialCreationOptions}
         */
        async _register({ friendlyName, webauthn: { rpId = typeof window !== "undefined" ? window.location.hostname : void 0, rpOrigins = typeof window !== "undefined" ? [window.location.origin] : void 0, signal } = {} }, overrides) {
          if (!rpId) {
            return {
              data: null,
              error: new AuthError("rpId is required for WebAuthn registration")
            };
          }
          try {
            if (!browserSupportsWebAuthn()) {
              return {
                data: null,
                error: new AuthUnknownError("Browser does not support WebAuthn", null)
              };
            }
            const { data: factor, error: enrollError } = await this._enroll({
              friendlyName
            });
            if (!factor) {
              await this.client.mfa.listFactors().then((factors) => {
                var _a;
                return (_a = factors.data) === null || _a === void 0 ? void 0 : _a.all.find((v) => v.factor_type === "webauthn" && v.friendly_name === friendlyName && v.status !== "unverified");
              }).then((factor2) => factor2 ? this.client.mfa.unenroll({ factorId: factor2 === null || factor2 === void 0 ? void 0 : factor2.id }) : void 0);
              return { data: null, error: enrollError };
            }
            const { data: challengeResponse, error: challengeError } = await this._challenge({
              factorId: factor.id,
              friendlyName: factor.friendly_name,
              webauthn: { rpId, rpOrigins },
              signal
            }, {
              create: overrides
            });
            if (!challengeResponse) {
              return { data: null, error: challengeError };
            }
            return this._verify({
              factorId: factor.id,
              challengeId: challengeResponse.challengeId,
              webauthn: {
                rpId,
                rpOrigins,
                type: challengeResponse.webauthn.type,
                credential_response: challengeResponse.webauthn.credential_response
              }
            });
          } catch (error) {
            if (isAuthError(error)) {
              return { data: null, error };
            }
            return {
              data: null,
              error: new AuthUnknownError("Unexpected error in register", error)
            };
          }
        }
      };
    }
  });

  // ../../node_modules/@supabase/auth-js/dist/module/GoTrueClient.js
  async function lockNoOp(name, acquireTimeout, fn) {
    return await fn();
  }
  var DEFAULT_OPTIONS, GLOBAL_JWKS, GoTrueClient, GoTrueClient_default;
  var init_GoTrueClient = __esm({
    "../../node_modules/@supabase/auth-js/dist/module/GoTrueClient.js"() {
      init_GoTrueAdminApi();
      init_constants2();
      init_errors();
      init_fetch();
      init_helpers();
      init_local_storage();
      init_locks();
      init_polyfills();
      init_version2();
      init_base64url();
      init_ethereum();
      init_webauthn();
      polyfillGlobalThis();
      DEFAULT_OPTIONS = {
        url: GOTRUE_URL,
        storageKey: STORAGE_KEY,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        headers: DEFAULT_HEADERS2,
        flowType: "implicit",
        debug: false,
        hasCustomAuthorizationHeader: false,
        throwOnError: false,
        lockAcquireTimeout: 1e4
        // 10 seconds
      };
      GLOBAL_JWKS = {};
      GoTrueClient = class _GoTrueClient {
        /**
         * The JWKS used for verifying asymmetric JWTs
         */
        get jwks() {
          var _a, _b;
          return (_b = (_a = GLOBAL_JWKS[this.storageKey]) === null || _a === void 0 ? void 0 : _a.jwks) !== null && _b !== void 0 ? _b : { keys: [] };
        }
        set jwks(value) {
          GLOBAL_JWKS[this.storageKey] = Object.assign(Object.assign({}, GLOBAL_JWKS[this.storageKey]), { jwks: value });
        }
        get jwks_cached_at() {
          var _a, _b;
          return (_b = (_a = GLOBAL_JWKS[this.storageKey]) === null || _a === void 0 ? void 0 : _a.cachedAt) !== null && _b !== void 0 ? _b : Number.MIN_SAFE_INTEGER;
        }
        set jwks_cached_at(value) {
          GLOBAL_JWKS[this.storageKey] = Object.assign(Object.assign({}, GLOBAL_JWKS[this.storageKey]), { cachedAt: value });
        }
        /**
         * Create a new client for use in the browser.
         *
         * @example
         * ```ts
         * import { GoTrueClient } from '@supabase/auth-js'
         *
         * const auth = new GoTrueClient({
         *   url: 'https://xyzcompany.supabase.co/auth/v1',
         *   headers: { apikey: 'public-anon-key' },
         *   storageKey: 'supabase-auth',
         * })
         * ```
         */
        constructor(options) {
          var _a, _b, _c;
          this.userStorage = null;
          this.memoryStorage = null;
          this.stateChangeEmitters = /* @__PURE__ */ new Map();
          this.autoRefreshTicker = null;
          this.autoRefreshTickTimeout = null;
          this.visibilityChangedCallback = null;
          this.refreshingDeferred = null;
          this.initializePromise = null;
          this.detectSessionInUrl = true;
          this.hasCustomAuthorizationHeader = false;
          this.suppressGetSessionWarning = false;
          this.lockAcquired = false;
          this.pendingInLock = [];
          this.broadcastChannel = null;
          this.logger = console.log;
          const settings = Object.assign(Object.assign({}, DEFAULT_OPTIONS), options);
          this.storageKey = settings.storageKey;
          this.instanceID = (_a = _GoTrueClient.nextInstanceID[this.storageKey]) !== null && _a !== void 0 ? _a : 0;
          _GoTrueClient.nextInstanceID[this.storageKey] = this.instanceID + 1;
          this.logDebugMessages = !!settings.debug;
          if (typeof settings.debug === "function") {
            this.logger = settings.debug;
          }
          if (this.instanceID > 0 && isBrowser()) {
            const message = `${this._logPrefix()} Multiple GoTrueClient instances detected in the same browser context. It is not an error, but this should be avoided as it may produce undefined behavior when used concurrently under the same storage key.`;
            console.warn(message);
            if (this.logDebugMessages) {
              console.trace(message);
            }
          }
          this.persistSession = settings.persistSession;
          this.autoRefreshToken = settings.autoRefreshToken;
          this.admin = new GoTrueAdminApi({
            url: settings.url,
            headers: settings.headers,
            fetch: settings.fetch
          });
          this.url = settings.url;
          this.headers = settings.headers;
          this.fetch = resolveFetch3(settings.fetch);
          this.lock = settings.lock || lockNoOp;
          this.detectSessionInUrl = settings.detectSessionInUrl;
          this.flowType = settings.flowType;
          this.hasCustomAuthorizationHeader = settings.hasCustomAuthorizationHeader;
          this.throwOnError = settings.throwOnError;
          this.lockAcquireTimeout = settings.lockAcquireTimeout;
          if (settings.lock) {
            this.lock = settings.lock;
          } else if (this.persistSession && isBrowser() && ((_b = globalThis === null || globalThis === void 0 ? void 0 : globalThis.navigator) === null || _b === void 0 ? void 0 : _b.locks)) {
            this.lock = navigatorLock;
          } else {
            this.lock = lockNoOp;
          }
          if (!this.jwks) {
            this.jwks = { keys: [] };
            this.jwks_cached_at = Number.MIN_SAFE_INTEGER;
          }
          this.mfa = {
            verify: this._verify.bind(this),
            enroll: this._enroll.bind(this),
            unenroll: this._unenroll.bind(this),
            challenge: this._challenge.bind(this),
            listFactors: this._listFactors.bind(this),
            challengeAndVerify: this._challengeAndVerify.bind(this),
            getAuthenticatorAssuranceLevel: this._getAuthenticatorAssuranceLevel.bind(this),
            webauthn: new WebAuthnApi(this)
          };
          this.oauth = {
            getAuthorizationDetails: this._getAuthorizationDetails.bind(this),
            approveAuthorization: this._approveAuthorization.bind(this),
            denyAuthorization: this._denyAuthorization.bind(this),
            listGrants: this._listOAuthGrants.bind(this),
            revokeGrant: this._revokeOAuthGrant.bind(this)
          };
          if (this.persistSession) {
            if (settings.storage) {
              this.storage = settings.storage;
            } else {
              if (supportsLocalStorage()) {
                this.storage = globalThis.localStorage;
              } else {
                this.memoryStorage = {};
                this.storage = memoryLocalStorageAdapter(this.memoryStorage);
              }
            }
            if (settings.userStorage) {
              this.userStorage = settings.userStorage;
            }
          } else {
            this.memoryStorage = {};
            this.storage = memoryLocalStorageAdapter(this.memoryStorage);
          }
          if (isBrowser() && globalThis.BroadcastChannel && this.persistSession && this.storageKey) {
            try {
              this.broadcastChannel = new globalThis.BroadcastChannel(this.storageKey);
            } catch (e) {
              console.error("Failed to create a new BroadcastChannel, multi-tab state changes will not be available", e);
            }
            (_c = this.broadcastChannel) === null || _c === void 0 ? void 0 : _c.addEventListener("message", async (event) => {
              this._debug("received broadcast notification from other tab or client", event);
              try {
                await this._notifyAllSubscribers(event.data.event, event.data.session, false);
              } catch (error) {
                this._debug("#broadcastChannel", "error", error);
              }
            });
          }
          this.initialize().catch((error) => {
            this._debug("#initialize()", "error", error);
          });
        }
        /**
         * Returns whether error throwing mode is enabled for this client.
         */
        isThrowOnErrorEnabled() {
          return this.throwOnError;
        }
        /**
         * Centralizes return handling with optional error throwing. When `throwOnError` is enabled
         * and the provided result contains a non-nullish error, the error is thrown instead of
         * being returned. This ensures consistent behavior across all public API methods.
         */
        _returnResult(result) {
          if (this.throwOnError && result && result.error) {
            throw result.error;
          }
          return result;
        }
        _logPrefix() {
          return `GoTrueClient@${this.storageKey}:${this.instanceID} (${version3}) ${(/* @__PURE__ */ new Date()).toISOString()}`;
        }
        _debug(...args) {
          if (this.logDebugMessages) {
            this.logger(this._logPrefix(), ...args);
          }
          return this;
        }
        /**
         * Initializes the client session either from the url or from storage.
         * This method is automatically called when instantiating the client, but should also be called
         * manually when checking for an error from an auth redirect (oauth, magiclink, password recovery, etc).
         */
        async initialize() {
          if (this.initializePromise) {
            return await this.initializePromise;
          }
          this.initializePromise = (async () => {
            return await this._acquireLock(this.lockAcquireTimeout, async () => {
              return await this._initialize();
            });
          })();
          return await this.initializePromise;
        }
        /**
         * IMPORTANT:
         * 1. Never throw in this method, as it is called from the constructor
         * 2. Never return a session from this method as it would be cached over
         *    the whole lifetime of the client
         */
        async _initialize() {
          var _a;
          try {
            let params = {};
            let callbackUrlType = "none";
            if (isBrowser()) {
              params = parseParametersFromURL(window.location.href);
              if (this._isImplicitGrantCallback(params)) {
                callbackUrlType = "implicit";
              } else if (await this._isPKCECallback(params)) {
                callbackUrlType = "pkce";
              }
            }
            if (isBrowser() && this.detectSessionInUrl && callbackUrlType !== "none") {
              const { data, error } = await this._getSessionFromURL(params, callbackUrlType);
              if (error) {
                this._debug("#_initialize()", "error detecting session from URL", error);
                if (isAuthImplicitGrantRedirectError(error)) {
                  const errorCode = (_a = error.details) === null || _a === void 0 ? void 0 : _a.code;
                  if (errorCode === "identity_already_exists" || errorCode === "identity_not_found" || errorCode === "single_identity_not_deletable") {
                    return { error };
                  }
                }
                return { error };
              }
              const { session, redirectType } = data;
              this._debug("#_initialize()", "detected session in URL", session, "redirect type", redirectType);
              await this._saveSession(session);
              setTimeout(async () => {
                if (redirectType === "recovery") {
                  await this._notifyAllSubscribers("PASSWORD_RECOVERY", session);
                } else {
                  await this._notifyAllSubscribers("SIGNED_IN", session);
                }
              }, 0);
              return { error: null };
            }
            await this._recoverAndRefresh();
            return { error: null };
          } catch (error) {
            if (isAuthError(error)) {
              return this._returnResult({ error });
            }
            return this._returnResult({
              error: new AuthUnknownError("Unexpected error during initialization", error)
            });
          } finally {
            await this._handleVisibilityChange();
            this._debug("#_initialize()", "end");
          }
        }
        /**
         * Creates a new anonymous user.
         *
         * @returns A session where the is_anonymous claim in the access token JWT set to true
         */
        async signInAnonymously(credentials) {
          var _a, _b, _c;
          try {
            const res = await _request(this.fetch, "POST", `${this.url}/signup`, {
              headers: this.headers,
              body: {
                data: (_b = (_a = credentials === null || credentials === void 0 ? void 0 : credentials.options) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {},
                gotrue_meta_security: { captcha_token: (_c = credentials === null || credentials === void 0 ? void 0 : credentials.options) === null || _c === void 0 ? void 0 : _c.captchaToken }
              },
              xform: _sessionResponse
            });
            const { data, error } = res;
            if (error || !data) {
              return this._returnResult({ data: { user: null, session: null }, error });
            }
            const session = data.session;
            const user = data.user;
            if (data.session) {
              await this._saveSession(data.session);
              await this._notifyAllSubscribers("SIGNED_IN", session);
            }
            return this._returnResult({ data: { user, session }, error: null });
          } catch (error) {
            if (isAuthError(error)) {
              return this._returnResult({ data: { user: null, session: null }, error });
            }
            throw error;
          }
        }
        /**
         * Creates a new user.
         *
         * Be aware that if a user account exists in the system you may get back an
         * error message that attempts to hide this information from the user.
         * This method has support for PKCE via email signups. The PKCE flow cannot be used when autoconfirm is enabled.
         *
         * @returns A logged-in session if the server has "autoconfirm" ON
         * @returns A user if the server has "autoconfirm" OFF
         */
        async signUp(credentials) {
          var _a, _b, _c;
          try {
            let res;
            if ("email" in credentials) {
              const { email, password, options } = credentials;
              let codeChallenge = null;
              let codeChallengeMethod = null;
              if (this.flowType === "pkce") {
                ;
                [codeChallenge, codeChallengeMethod] = await getCodeChallengeAndMethod(this.storage, this.storageKey);
              }
              res = await _request(this.fetch, "POST", `${this.url}/signup`, {
                headers: this.headers,
                redirectTo: options === null || options === void 0 ? void 0 : options.emailRedirectTo,
                body: {
                  email,
                  password,
                  data: (_a = options === null || options === void 0 ? void 0 : options.data) !== null && _a !== void 0 ? _a : {},
                  gotrue_meta_security: { captcha_token: options === null || options === void 0 ? void 0 : options.captchaToken },
                  code_challenge: codeChallenge,
                  code_challenge_method: codeChallengeMethod
                },
                xform: _sessionResponse
              });
            } else if ("phone" in credentials) {
              const { phone, password, options } = credentials;
              res = await _request(this.fetch, "POST", `${this.url}/signup`, {
                headers: this.headers,
                body: {
                  phone,
                  password,
                  data: (_b = options === null || options === void 0 ? void 0 : options.data) !== null && _b !== void 0 ? _b : {},
                  channel: (_c = options === null || options === void 0 ? void 0 : options.channel) !== null && _c !== void 0 ? _c : "sms",
                  gotrue_meta_security: { captcha_token: options === null || options === void 0 ? void 0 : options.captchaToken }
                },
                xform: _sessionResponse
              });
            } else {
              throw new AuthInvalidCredentialsError("You must provide either an email or phone number and a password");
            }
            const { data, error } = res;
            if (error || !data) {
              await removeItemAsync(this.storage, `${this.storageKey}-code-verifier`);
              return this._returnResult({ data: { user: null, session: null }, error });
            }
            const session = data.session;
            const user = data.user;
            if (data.session) {
              await this._saveSession(data.session);
              await this._notifyAllSubscribers("SIGNED_IN", session);
            }
            return this._returnResult({ data: { user, session }, error: null });
          } catch (error) {
            await removeItemAsync(this.storage, `${this.storageKey}-code-verifier`);
            if (isAuthError(error)) {
              return this._returnResult({ data: { user: null, session: null }, error });
            }
            throw error;
          }
        }
        /**
         * Log in an existing user with an email and password or phone and password.
         *
         * Be aware that you may get back an error message that will not distinguish
         * between the cases where the account does not exist or that the
         * email/phone and password combination is wrong or that the account can only
         * be accessed via social login.
         */
        async signInWithPassword(credentials) {
          try {
            let res;
            if ("email" in credentials) {
              const { email, password, options } = credentials;
              res = await _request(this.fetch, "POST", `${this.url}/token?grant_type=password`, {
                headers: this.headers,
                body: {
                  email,
                  password,
                  gotrue_meta_security: { captcha_token: options === null || options === void 0 ? void 0 : options.captchaToken }
                },
                xform: _sessionResponsePassword
              });
            } else if ("phone" in credentials) {
              const { phone, password, options } = credentials;
              res = await _request(this.fetch, "POST", `${this.url}/token?grant_type=password`, {
                headers: this.headers,
                body: {
                  phone,
                  password,
                  gotrue_meta_security: { captcha_token: options === null || options === void 0 ? void 0 : options.captchaToken }
                },
                xform: _sessionResponsePassword
              });
            } else {
              throw new AuthInvalidCredentialsError("You must provide either an email or phone number and a password");
            }
            const { data, error } = res;
            if (error) {
              return this._returnResult({ data: { user: null, session: null }, error });
            } else if (!data || !data.session || !data.user) {
              const invalidTokenError = new AuthInvalidTokenResponseError();
              return this._returnResult({ data: { user: null, session: null }, error: invalidTokenError });
            }
            if (data.session) {
              await this._saveSession(data.session);
              await this._notifyAllSubscribers("SIGNED_IN", data.session);
            }
            return this._returnResult({
              data: Object.assign({ user: data.user, session: data.session }, data.weak_password ? { weakPassword: data.weak_password } : null),
              error
            });
          } catch (error) {
            if (isAuthError(error)) {
              return this._returnResult({ data: { user: null, session: null }, error });
            }
            throw error;
          }
        }
        /**
         * Log in an existing user via a third-party provider.
         * This method supports the PKCE flow.
         */
        async signInWithOAuth(credentials) {
          var _a, _b, _c, _d;
          return await this._handleProviderSignIn(credentials.provider, {
            redirectTo: (_a = credentials.options) === null || _a === void 0 ? void 0 : _a.redirectTo,
            scopes: (_b = credentials.options) === null || _b === void 0 ? void 0 : _b.scopes,
            queryParams: (_c = credentials.options) === null || _c === void 0 ? void 0 : _c.queryParams,
            skipBrowserRedirect: (_d = credentials.options) === null || _d === void 0 ? void 0 : _d.skipBrowserRedirect
          });
        }
        /**
         * Log in an existing user by exchanging an Auth Code issued during the PKCE flow.
         */
        async exchangeCodeForSession(authCode) {
          await this.initializePromise;
          return this._acquireLock(this.lockAcquireTimeout, async () => {
            return this._exchangeCodeForSession(authCode);
          });
        }
        /**
         * Signs in a user by verifying a message signed by the user's private key.
         * Supports Ethereum (via Sign-In-With-Ethereum) & Solana (Sign-In-With-Solana) standards,
         * both of which derive from the EIP-4361 standard
         * With slight variation on Solana's side.
         * @reference https://eips.ethereum.org/EIPS/eip-4361
         */
        async signInWithWeb3(credentials) {
          const { chain } = credentials;
          switch (chain) {
            case "ethereum":
              return await this.signInWithEthereum(credentials);
            case "solana":
              return await this.signInWithSolana(credentials);
            default:
              throw new Error(`@supabase/auth-js: Unsupported chain "${chain}"`);
          }
        }
        async signInWithEthereum(credentials) {
          var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
          let message;
          let signature;
          if ("message" in credentials) {
            message = credentials.message;
            signature = credentials.signature;
          } else {
            const { chain, wallet, statement, options } = credentials;
            let resolvedWallet;
            if (!isBrowser()) {
              if (typeof wallet !== "object" || !(options === null || options === void 0 ? void 0 : options.url)) {
                throw new Error("@supabase/auth-js: Both wallet and url must be specified in non-browser environments.");
              }
              resolvedWallet = wallet;
            } else if (typeof wallet === "object") {
              resolvedWallet = wallet;
            } else {
              const windowAny = window;
              if ("ethereum" in windowAny && typeof windowAny.ethereum === "object" && "request" in windowAny.ethereum && typeof windowAny.ethereum.request === "function") {
                resolvedWallet = windowAny.ethereum;
              } else {
                throw new Error(`@supabase/auth-js: No compatible Ethereum wallet interface on the window object (window.ethereum) detected. Make sure the user already has a wallet installed and connected for this app. Prefer passing the wallet interface object directly to signInWithWeb3({ chain: 'ethereum', wallet: resolvedUserWallet }) instead.`);
              }
            }
            const url = new URL((_a = options === null || options === void 0 ? void 0 : options.url) !== null && _a !== void 0 ? _a : window.location.href);
            const accounts = await resolvedWallet.request({
              method: "eth_requestAccounts"
            }).then((accs) => accs).catch(() => {
              throw new Error(`@supabase/auth-js: Wallet method eth_requestAccounts is missing or invalid`);
            });
            if (!accounts || accounts.length === 0) {
              throw new Error(`@supabase/auth-js: No accounts available. Please ensure the wallet is connected.`);
            }
            const address = getAddress(accounts[0]);
            let chainId = (_b = options === null || options === void 0 ? void 0 : options.signInWithEthereum) === null || _b === void 0 ? void 0 : _b.chainId;
            if (!chainId) {
              const chainIdHex = await resolvedWallet.request({
                method: "eth_chainId"
              });
              chainId = fromHex(chainIdHex);
            }
            const siweMessage = {
              domain: url.host,
              address,
              statement,
              uri: url.href,
              version: "1",
              chainId,
              nonce: (_c = options === null || options === void 0 ? void 0 : options.signInWithEthereum) === null || _c === void 0 ? void 0 : _c.nonce,
              issuedAt: (_e = (_d = options === null || options === void 0 ? void 0 : options.signInWithEthereum) === null || _d === void 0 ? void 0 : _d.issuedAt) !== null && _e !== void 0 ? _e : /* @__PURE__ */ new Date(),
              expirationTime: (_f = options === null || options === void 0 ? void 0 : options.signInWithEthereum) === null || _f === void 0 ? void 0 : _f.expirationTime,
              notBefore: (_g = options === null || options === void 0 ? void 0 : options.signInWithEthereum) === null || _g === void 0 ? void 0 : _g.notBefore,
              requestId: (_h = options === null || options === void 0 ? void 0 : options.signInWithEthereum) === null || _h === void 0 ? void 0 : _h.requestId,
              resources: (_j = options === null || options === void 0 ? void 0 : options.signInWithEthereum) === null || _j === void 0 ? void 0 : _j.resources
            };
            message = createSiweMessage(siweMessage);
            signature = await resolvedWallet.request({
              method: "personal_sign",
              params: [toHex(message), address]
            });
          }
          try {
            const { data, error } = await _request(this.fetch, "POST", `${this.url}/token?grant_type=web3`, {
              headers: this.headers,
              body: Object.assign({
                chain: "ethereum",
                message,
                signature
              }, ((_k = credentials.options) === null || _k === void 0 ? void 0 : _k.captchaToken) ? { gotrue_meta_security: { captcha_token: (_l = credentials.options) === null || _l === void 0 ? void 0 : _l.captchaToken } } : null),
              xform: _sessionResponse
            });
            if (error) {
              throw error;
            }
            if (!data || !data.session || !data.user) {
              const invalidTokenError = new AuthInvalidTokenResponseError();
              return this._returnResult({ data: { user: null, session: null }, error: invalidTokenError });
            }
            if (data.session) {
              await this._saveSession(data.session);
              await this._notifyAllSubscribers("SIGNED_IN", data.session);
            }
            return this._returnResult({ data: Object.assign({}, data), error });
          } catch (error) {
            if (isAuthError(error)) {
              return this._returnResult({ data: { user: null, session: null }, error });
            }
            throw error;
          }
        }
        async signInWithSolana(credentials) {
          var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
          let message;
          let signature;
          if ("message" in credentials) {
            message = credentials.message;
            signature = credentials.signature;
          } else {
            const { chain, wallet, statement, options } = credentials;
            let resolvedWallet;
            if (!isBrowser()) {
              if (typeof wallet !== "object" || !(options === null || options === void 0 ? void 0 : options.url)) {
                throw new Error("@supabase/auth-js: Both wallet and url must be specified in non-browser environments.");
              }
              resolvedWallet = wallet;
            } else if (typeof wallet === "object") {
              resolvedWallet = wallet;
            } else {
              const windowAny = window;
              if ("solana" in windowAny && typeof windowAny.solana === "object" && ("signIn" in windowAny.solana && typeof windowAny.solana.signIn === "function" || "signMessage" in windowAny.solana && typeof windowAny.solana.signMessage === "function")) {
                resolvedWallet = windowAny.solana;
              } else {
                throw new Error(`@supabase/auth-js: No compatible Solana wallet interface on the window object (window.solana) detected. Make sure the user already has a wallet installed and connected for this app. Prefer passing the wallet interface object directly to signInWithWeb3({ chain: 'solana', wallet: resolvedUserWallet }) instead.`);
              }
            }
            const url = new URL((_a = options === null || options === void 0 ? void 0 : options.url) !== null && _a !== void 0 ? _a : window.location.href);
            if ("signIn" in resolvedWallet && resolvedWallet.signIn) {
              const output = await resolvedWallet.signIn(Object.assign(Object.assign(Object.assign({ issuedAt: (/* @__PURE__ */ new Date()).toISOString() }, options === null || options === void 0 ? void 0 : options.signInWithSolana), {
                // non-overridable properties
                version: "1",
                domain: url.host,
                uri: url.href
              }), statement ? { statement } : null));
              let outputToProcess;
              if (Array.isArray(output) && output[0] && typeof output[0] === "object") {
                outputToProcess = output[0];
              } else if (output && typeof output === "object" && "signedMessage" in output && "signature" in output) {
                outputToProcess = output;
              } else {
                throw new Error("@supabase/auth-js: Wallet method signIn() returned unrecognized value");
              }
              if ("signedMessage" in outputToProcess && "signature" in outputToProcess && (typeof outputToProcess.signedMessage === "string" || outputToProcess.signedMessage instanceof Uint8Array) && outputToProcess.signature instanceof Uint8Array) {
                message = typeof outputToProcess.signedMessage === "string" ? outputToProcess.signedMessage : new TextDecoder().decode(outputToProcess.signedMessage);
                signature = outputToProcess.signature;
              } else {
                throw new Error("@supabase/auth-js: Wallet method signIn() API returned object without signedMessage and signature fields");
              }
            } else {
              if (!("signMessage" in resolvedWallet) || typeof resolvedWallet.signMessage !== "function" || !("publicKey" in resolvedWallet) || typeof resolvedWallet !== "object" || !resolvedWallet.publicKey || !("toBase58" in resolvedWallet.publicKey) || typeof resolvedWallet.publicKey.toBase58 !== "function") {
                throw new Error("@supabase/auth-js: Wallet does not have a compatible signMessage() and publicKey.toBase58() API");
              }
              message = [
                `${url.host} wants you to sign in with your Solana account:`,
                resolvedWallet.publicKey.toBase58(),
                ...statement ? ["", statement, ""] : [""],
                "Version: 1",
                `URI: ${url.href}`,
                `Issued At: ${(_c = (_b = options === null || options === void 0 ? void 0 : options.signInWithSolana) === null || _b === void 0 ? void 0 : _b.issuedAt) !== null && _c !== void 0 ? _c : (/* @__PURE__ */ new Date()).toISOString()}`,
                ...((_d = options === null || options === void 0 ? void 0 : options.signInWithSolana) === null || _d === void 0 ? void 0 : _d.notBefore) ? [`Not Before: ${options.signInWithSolana.notBefore}`] : [],
                ...((_e = options === null || options === void 0 ? void 0 : options.signInWithSolana) === null || _e === void 0 ? void 0 : _e.expirationTime) ? [`Expiration Time: ${options.signInWithSolana.expirationTime}`] : [],
                ...((_f = options === null || options === void 0 ? void 0 : options.signInWithSolana) === null || _f === void 0 ? void 0 : _f.chainId) ? [`Chain ID: ${options.signInWithSolana.chainId}`] : [],
                ...((_g = options === null || options === void 0 ? void 0 : options.signInWithSolana) === null || _g === void 0 ? void 0 : _g.nonce) ? [`Nonce: ${options.signInWithSolana.nonce}`] : [],
                ...((_h = options === null || options === void 0 ? void 0 : options.signInWithSolana) === null || _h === void 0 ? void 0 : _h.requestId) ? [`Request ID: ${options.signInWithSolana.requestId}`] : [],
                ...((_k = (_j = options === null || options === void 0 ? void 0 : options.signInWithSolana) === null || _j === void 0 ? void 0 : _j.resources) === null || _k === void 0 ? void 0 : _k.length) ? [
                  "Resources",
                  ...options.signInWithSolana.resources.map((resource) => `- ${resource}`)
                ] : []
              ].join("\n");
              const maybeSignature = await resolvedWallet.signMessage(new TextEncoder().encode(message), "utf8");
              if (!maybeSignature || !(maybeSignature instanceof Uint8Array)) {
                throw new Error("@supabase/auth-js: Wallet signMessage() API returned an recognized value");
              }
              signature = maybeSignature;
            }
          }
          try {
            const { data, error } = await _request(this.fetch, "POST", `${this.url}/token?grant_type=web3`, {
              headers: this.headers,
              body: Object.assign({ chain: "solana", message, signature: bytesToBase64URL(signature) }, ((_l = credentials.options) === null || _l === void 0 ? void 0 : _l.captchaToken) ? { gotrue_meta_security: { captcha_token: (_m = credentials.options) === null || _m === void 0 ? void 0 : _m.captchaToken } } : null),
              xform: _sessionResponse
            });
            if (error) {
              throw error;
            }
            if (!data || !data.session || !data.user) {
              const invalidTokenError = new AuthInvalidTokenResponseError();
              return this._returnResult({ data: { user: null, session: null }, error: invalidTokenError });
            }
            if (data.session) {
              await this._saveSession(data.session);
              await this._notifyAllSubscribers("SIGNED_IN", data.session);
            }
            return this._returnResult({ data: Object.assign({}, data), error });
          } catch (error) {
            if (isAuthError(error)) {
              return this._returnResult({ data: { user: null, session: null }, error });
            }
            throw error;
          }
        }
        async _exchangeCodeForSession(authCode) {
          const storageItem = await getItemAsync(this.storage, `${this.storageKey}-code-verifier`);
          const [codeVerifier, redirectType] = (storageItem !== null && storageItem !== void 0 ? storageItem : "").split("/");
          try {
            if (!codeVerifier && this.flowType === "pkce") {
              throw new AuthPKCECodeVerifierMissingError();
            }
            const { data, error } = await _request(this.fetch, "POST", `${this.url}/token?grant_type=pkce`, {
              headers: this.headers,
              body: {
                auth_code: authCode,
                code_verifier: codeVerifier
              },
              xform: _sessionResponse
            });
            await removeItemAsync(this.storage, `${this.storageKey}-code-verifier`);
            if (error) {
              throw error;
            }
            if (!data || !data.session || !data.user) {
              const invalidTokenError = new AuthInvalidTokenResponseError();
              return this._returnResult({
                data: { user: null, session: null, redirectType: null },
                error: invalidTokenError
              });
            }
            if (data.session) {
              await this._saveSession(data.session);
              await this._notifyAllSubscribers("SIGNED_IN", data.session);
            }
            return this._returnResult({ data: Object.assign(Object.assign({}, data), { redirectType: redirectType !== null && redirectType !== void 0 ? redirectType : null }), error });
          } catch (error) {
            await removeItemAsync(this.storage, `${this.storageKey}-code-verifier`);
            if (isAuthError(error)) {
              return this._returnResult({
                data: { user: null, session: null, redirectType: null },
                error
              });
            }
            throw error;
          }
        }
        /**
         * Allows signing in with an OIDC ID token. The authentication provider used
         * should be enabled and configured.
         */
        async signInWithIdToken(credentials) {
          try {
            const { options, provider, token, access_token, nonce } = credentials;
            const res = await _request(this.fetch, "POST", `${this.url}/token?grant_type=id_token`, {
              headers: this.headers,
              body: {
                provider,
                id_token: token,
                access_token,
                nonce,
                gotrue_meta_security: { captcha_token: options === null || options === void 0 ? void 0 : options.captchaToken }
              },
              xform: _sessionResponse
            });
            const { data, error } = res;
            if (error) {
              return this._returnResult({ data: { user: null, session: null }, error });
            } else if (!data || !data.session || !data.user) {
              const invalidTokenError = new AuthInvalidTokenResponseError();
              return this._returnResult({ data: { user: null, session: null }, error: invalidTokenError });
            }
            if (data.session) {
              await this._saveSession(data.session);
              await this._notifyAllSubscribers("SIGNED_IN", data.session);
            }
            return this._returnResult({ data, error });
          } catch (error) {
            if (isAuthError(error)) {
              return this._returnResult({ data: { user: null, session: null }, error });
            }
            throw error;
          }
        }
        /**
         * Log in a user using magiclink or a one-time password (OTP).
         *
         * If the `{{ .ConfirmationURL }}` variable is specified in the email template, a magiclink will be sent.
         * If the `{{ .Token }}` variable is specified in the email template, an OTP will be sent.
         * If you're using phone sign-ins, only an OTP will be sent. You won't be able to send a magiclink for phone sign-ins.
         *
         * Be aware that you may get back an error message that will not distinguish
         * between the cases where the account does not exist or, that the account
         * can only be accessed via social login.
         *
         * Do note that you will need to configure a Whatsapp sender on Twilio
         * if you are using phone sign in with the 'whatsapp' channel. The whatsapp
         * channel is not supported on other providers
         * at this time.
         * This method supports PKCE when an email is passed.
         */
        async signInWithOtp(credentials) {
          var _a, _b, _c, _d, _e;
          try {
            if ("email" in credentials) {
              const { email, options } = credentials;
              let codeChallenge = null;
              let codeChallengeMethod = null;
              if (this.flowType === "pkce") {
                ;
                [codeChallenge, codeChallengeMethod] = await getCodeChallengeAndMethod(this.storage, this.storageKey);
              }
              const { error } = await _request(this.fetch, "POST", `${this.url}/otp`, {
                headers: this.headers,
                body: {
                  email,
                  data: (_a = options === null || options === void 0 ? void 0 : options.data) !== null && _a !== void 0 ? _a : {},
                  create_user: (_b = options === null || options === void 0 ? void 0 : options.shouldCreateUser) !== null && _b !== void 0 ? _b : true,
                  gotrue_meta_security: { captcha_token: options === null || options === void 0 ? void 0 : options.captchaToken },
                  code_challenge: codeChallenge,
                  code_challenge_method: codeChallengeMethod
                },
                redirectTo: options === null || options === void 0 ? void 0 : options.emailRedirectTo
              });
              return this._returnResult({ data: { user: null, session: null }, error });
            }
            if ("phone" in credentials) {
              const { phone, options } = credentials;
              const { data, error } = await _request(this.fetch, "POST", `${this.url}/otp`, {
                headers: this.headers,
                body: {
                  phone,
                  data: (_c = options === null || options === void 0 ? void 0 : options.data) !== null && _c !== void 0 ? _c : {},
                  create_user: (_d = options === null || options === void 0 ? void 0 : options.shouldCreateUser) !== null && _d !== void 0 ? _d : true,
                  gotrue_meta_security: { captcha_token: options === null || options === void 0 ? void 0 : options.captchaToken },
                  channel: (_e = options === null || options === void 0 ? void 0 : options.channel) !== null && _e !== void 0 ? _e : "sms"
                }
              });
              return this._returnResult({
                data: { user: null, session: null, messageId: data === null || data === void 0 ? void 0 : data.message_id },
                error
              });
            }
            throw new AuthInvalidCredentialsError("You must provide either an email or phone number.");
          } catch (error) {
            await removeItemAsync(this.storage, `${this.storageKey}-code-verifier`);
            if (isAuthError(error)) {
              return this._returnResult({ data: { user: null, session: null }, error });
            }
            throw error;
          }
        }
        /**
         * Log in a user given a User supplied OTP or TokenHash received through mobile or email.
         */
        async verifyOtp(params) {
          var _a, _b;
          try {
            let redirectTo = void 0;
            let captchaToken = void 0;
            if ("options" in params) {
              redirectTo = (_a = params.options) === null || _a === void 0 ? void 0 : _a.redirectTo;
              captchaToken = (_b = params.options) === null || _b === void 0 ? void 0 : _b.captchaToken;
            }
            const { data, error } = await _request(this.fetch, "POST", `${this.url}/verify`, {
              headers: this.headers,
              body: Object.assign(Object.assign({}, params), { gotrue_meta_security: { captcha_token: captchaToken } }),
              redirectTo,
              xform: _sessionResponse
            });
            if (error) {
              throw error;
            }
            if (!data) {
              const tokenVerificationError = new Error("An error occurred on token verification.");
              throw tokenVerificationError;
            }
            const session = data.session;
            const user = data.user;
            if (session === null || session === void 0 ? void 0 : session.access_token) {
              await this._saveSession(session);
              await this._notifyAllSubscribers(params.type == "recovery" ? "PASSWORD_RECOVERY" : "SIGNED_IN", session);
            }
            return this._returnResult({ data: { user, session }, error: null });
          } catch (error) {
            if (isAuthError(error)) {
              return this._returnResult({ data: { user: null, session: null }, error });
            }
            throw error;
          }
        }
        /**
         * Attempts a single-sign on using an enterprise Identity Provider. A
         * successful SSO attempt will redirect the current page to the identity
         * provider authorization page. The redirect URL is implementation and SSO
         * protocol specific.
         *
         * You can use it by providing a SSO domain. Typically you can extract this
         * domain by asking users for their email address. If this domain is
         * registered on the Auth instance the redirect will use that organization's
         * currently active SSO Identity Provider for the login.
         *
         * If you have built an organization-specific login page, you can use the
         * organization's SSO Identity Provider UUID directly instead.
         */
        async signInWithSSO(params) {
          var _a, _b, _c, _d, _e;
          try {
            let codeChallenge = null;
            let codeChallengeMethod = null;
            if (this.flowType === "pkce") {
              ;
              [codeChallenge, codeChallengeMethod] = await getCodeChallengeAndMethod(this.storage, this.storageKey);
            }
            const result = await _request(this.fetch, "POST", `${this.url}/sso`, {
              body: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, "providerId" in params ? { provider_id: params.providerId } : null), "domain" in params ? { domain: params.domain } : null), { redirect_to: (_b = (_a = params.options) === null || _a === void 0 ? void 0 : _a.redirectTo) !== null && _b !== void 0 ? _b : void 0 }), ((_c = params === null || params === void 0 ? void 0 : params.options) === null || _c === void 0 ? void 0 : _c.captchaToken) ? { gotrue_meta_security: { captcha_token: params.options.captchaToken } } : null), { skip_http_redirect: true, code_challenge: codeChallenge, code_challenge_method: codeChallengeMethod }),
              headers: this.headers,
              xform: _ssoResponse
            });
            if (((_d = result.data) === null || _d === void 0 ? void 0 : _d.url) && isBrowser() && !((_e = params.options) === null || _e === void 0 ? void 0 : _e.skipBrowserRedirect)) {
              window.location.assign(result.data.url);
            }
            return this._returnResult(result);
          } catch (error) {
            await removeItemAsync(this.storage, `${this.storageKey}-code-verifier`);
            if (isAuthError(error)) {
              return this._returnResult({ data: null, error });
            }
            throw error;
          }
        }
        /**
         * Sends a reauthentication OTP to the user's email or phone number.
         * Requires the user to be signed-in.
         */
        async reauthenticate() {
          await this.initializePromise;
          return await this._acquireLock(this.lockAcquireTimeout, async () => {
            return await this._reauthenticate();
          });
        }
        async _reauthenticate() {
          try {
            return await this._useSession(async (result) => {
              const { data: { session }, error: sessionError } = result;
              if (sessionError)
                throw sessionError;
              if (!session)
                throw new AuthSessionMissingError();
              const { error } = await _request(this.fetch, "GET", `${this.url}/reauthenticate`, {
                headers: this.headers,
                jwt: session.access_token
              });
              return this._returnResult({ data: { user: null, session: null }, error });
            });
          } catch (error) {
            if (isAuthError(error)) {
              return this._returnResult({ data: { user: null, session: null }, error });
            }
            throw error;
          }
        }
        /**
         * Resends an existing signup confirmation email, email change email, SMS OTP or phone change OTP.
         */
        async resend(credentials) {
          try {
            const endpoint = `${this.url}/resend`;
            if ("email" in credentials) {
              const { email, type, options } = credentials;
              const { error } = await _request(this.fetch, "POST", endpoint, {
                headers: this.headers,
                body: {
                  email,
                  type,
                  gotrue_meta_security: { captcha_token: options === null || options === void 0 ? void 0 : options.captchaToken }
                },
                redirectTo: options === null || options === void 0 ? void 0 : options.emailRedirectTo
              });
              return this._returnResult({ data: { user: null, session: null }, error });
            } else if ("phone" in credentials) {
              const { phone, type, options } = credentials;
              const { data, error } = await _request(this.fetch, "POST", endpoint, {
                headers: this.headers,
                body: {
                  phone,
                  type,
                  gotrue_meta_security: { captcha_token: options === null || options === void 0 ? void 0 : options.captchaToken }
                }
              });
              return this._returnResult({
                data: { user: null, session: null, messageId: data === null || data === void 0 ? void 0 : data.message_id },
                error
              });
            }
            throw new AuthInvalidCredentialsError("You must provide either an email or phone number and a type");
          } catch (error) {
            if (isAuthError(error)) {
              return this._returnResult({ data: { user: null, session: null }, error });
            }
            throw error;
          }
        }
        /**
         * Returns the session, refreshing it if necessary.
         *
         * The session returned can be null if the session is not detected which can happen in the event a user is not signed-in or has logged out.
         *
         * **IMPORTANT:** This method loads values directly from the storage attached
         * to the client. If that storage is based on request cookies for example,
         * the values in it may not be authentic and therefore it's strongly advised
         * against using this method and its results in such circumstances. A warning
         * will be emitted if this is detected. Use {@link #getUser()} instead.
         */
        async getSession() {
          await this.initializePromise;
          const result = await this._acquireLock(this.lockAcquireTimeout, async () => {
            return this._useSession(async (result2) => {
              return result2;
            });
          });
          return result;
        }
        /**
         * Acquires a global lock based on the storage key.
         */
        async _acquireLock(acquireTimeout, fn) {
          this._debug("#_acquireLock", "begin", acquireTimeout);
          try {
            if (this.lockAcquired) {
              const last = this.pendingInLock.length ? this.pendingInLock[this.pendingInLock.length - 1] : Promise.resolve();
              const result = (async () => {
                await last;
                return await fn();
              })();
              this.pendingInLock.push((async () => {
                try {
                  await result;
                } catch (e) {
                }
              })());
              return result;
            }
            return await this.lock(`lock:${this.storageKey}`, acquireTimeout, async () => {
              this._debug("#_acquireLock", "lock acquired for storage key", this.storageKey);
              try {
                this.lockAcquired = true;
                const result = fn();
                this.pendingInLock.push((async () => {
                  try {
                    await result;
                  } catch (e) {
                  }
                })());
                await result;
                while (this.pendingInLock.length) {
                  const waitOn = [...this.pendingInLock];
                  await Promise.all(waitOn);
                  this.pendingInLock.splice(0, waitOn.length);
                }
                return await result;
              } finally {
                this._debug("#_acquireLock", "lock released for storage key", this.storageKey);
                this.lockAcquired = false;
              }
            });
          } finally {
            this._debug("#_acquireLock", "end");
          }
        }
        /**
         * Use instead of {@link #getSession} inside the library. It is
         * semantically usually what you want, as getting a session involves some
         * processing afterwards that requires only one client operating on the
         * session at once across multiple tabs or processes.
         */
        async _useSession(fn) {
          this._debug("#_useSession", "begin");
          try {
            const result = await this.__loadSession();
            return await fn(result);
          } finally {
            this._debug("#_useSession", "end");
          }
        }
        /**
         * NEVER USE DIRECTLY!
         *
         * Always use {@link #_useSession}.
         */
        async __loadSession() {
          this._debug("#__loadSession()", "begin");
          if (!this.lockAcquired) {
            this._debug("#__loadSession()", "used outside of an acquired lock!", new Error().stack);
          }
          try {
            let currentSession = null;
            const maybeSession = await getItemAsync(this.storage, this.storageKey);
            this._debug("#getSession()", "session from storage", maybeSession);
            if (maybeSession !== null) {
              if (this._isValidSession(maybeSession)) {
                currentSession = maybeSession;
              } else {
                this._debug("#getSession()", "session from storage is not valid");
                await this._removeSession();
              }
            }
            if (!currentSession) {
              return { data: { session: null }, error: null };
            }
            const hasExpired = currentSession.expires_at ? currentSession.expires_at * 1e3 - Date.now() < EXPIRY_MARGIN_MS : false;
            this._debug("#__loadSession()", `session has${hasExpired ? "" : " not"} expired`, "expires_at", currentSession.expires_at);
            if (!hasExpired) {
              if (this.userStorage) {
                const maybeUser = await getItemAsync(this.userStorage, this.storageKey + "-user");
                if (maybeUser === null || maybeUser === void 0 ? void 0 : maybeUser.user) {
                  currentSession.user = maybeUser.user;
                } else {
                  currentSession.user = userNotAvailableProxy();
                }
              }
              if (this.storage.isServer && currentSession.user && !currentSession.user.__isUserNotAvailableProxy) {
                const suppressWarningRef = { value: this.suppressGetSessionWarning };
                currentSession.user = insecureUserWarningProxy(currentSession.user, suppressWarningRef);
                if (suppressWarningRef.value) {
                  this.suppressGetSessionWarning = true;
                }
              }
              return { data: { session: currentSession }, error: null };
            }
            const { data: session, error } = await this._callRefreshToken(currentSession.refresh_token);
            if (error) {
              return this._returnResult({ data: { session: null }, error });
            }
            return this._returnResult({ data: { session }, error: null });
          } finally {
            this._debug("#__loadSession()", "end");
          }
        }
        /**
         * Gets the current user details if there is an existing session. This method
         * performs a network request to the Supabase Auth server, so the returned
         * value is authentic and can be used to base authorization rules on.
         *
         * @param jwt Takes in an optional access token JWT. If no JWT is provided, the JWT from the current session is used.
         */
        async getUser(jwt) {
          if (jwt) {
            return await this._getUser(jwt);
          }
          await this.initializePromise;
          const result = await this._acquireLock(this.lockAcquireTimeout, async () => {
            return await this._getUser();
          });
          if (result.data.user) {
            this.suppressGetSessionWarning = true;
          }
          return result;
        }
        async _getUser(jwt) {
          try {
            if (jwt) {
              return await _request(this.fetch, "GET", `${this.url}/user`, {
                headers: this.headers,
                jwt,
                xform: _userResponse
              });
            }
            return await this._useSession(async (result) => {
              var _a, _b, _c;
              const { data, error } = result;
              if (error) {
                throw error;
              }
              if (!((_a = data.session) === null || _a === void 0 ? void 0 : _a.access_token) && !this.hasCustomAuthorizationHeader) {
                return { data: { user: null }, error: new AuthSessionMissingError() };
              }
              return await _request(this.fetch, "GET", `${this.url}/user`, {
                headers: this.headers,
                jwt: (_c = (_b = data.session) === null || _b === void 0 ? void 0 : _b.access_token) !== null && _c !== void 0 ? _c : void 0,
                xform: _userResponse
              });
            });
          } catch (error) {
            if (isAuthError(error)) {
              if (isAuthSessionMissingError(error)) {
                await this._removeSession();
                await removeItemAsync(this.storage, `${this.storageKey}-code-verifier`);
              }
              return this._returnResult({ data: { user: null }, error });
            }
            throw error;
          }
        }
        /**
         * Updates user data for a logged in user.
         */
        async updateUser(attributes, options = {}) {
          await this.initializePromise;
          return await this._acquireLock(this.lockAcquireTimeout, async () => {
            return await this._updateUser(attributes, options);
          });
        }
        async _updateUser(attributes, options = {}) {
          try {
            return await this._useSession(async (result) => {
              const { data: sessionData, error: sessionError } = result;
              if (sessionError) {
                throw sessionError;
              }
              if (!sessionData.session) {
                throw new AuthSessionMissingError();
              }
              const session = sessionData.session;
              let codeChallenge = null;
              let codeChallengeMethod = null;
              if (this.flowType === "pkce" && attributes.email != null) {
                ;
                [codeChallenge, codeChallengeMethod] = await getCodeChallengeAndMethod(this.storage, this.storageKey);
              }
              const { data, error: userError } = await _request(this.fetch, "PUT", `${this.url}/user`, {
                headers: this.headers,
                redirectTo: options === null || options === void 0 ? void 0 : options.emailRedirectTo,
                body: Object.assign(Object.assign({}, attributes), { code_challenge: codeChallenge, code_challenge_method: codeChallengeMethod }),
                jwt: session.access_token,
                xform: _userResponse
              });
              if (userError) {
                throw userError;
              }
              session.user = data.user;
              await this._saveSession(session);
              await this._notifyAllSubscribers("USER_UPDATED", session);
              return this._returnResult({ data: { user: session.user }, error: null });
            });
          } catch (error) {
            await removeItemAsync(this.storage, `${this.storageKey}-code-verifier`);
            if (isAuthError(error)) {
              return this._returnResult({ data: { user: null }, error });
            }
            throw error;
          }
        }
        /**
         * Sets the session data from the current session. If the current session is expired, setSession will take care of refreshing it to obtain a new session.
         * If the refresh token or access token in the current session is invalid, an error will be thrown.
         * @param currentSession The current session that minimally contains an access token and refresh token.
         */
        async setSession(currentSession) {
          await this.initializePromise;
          return await this._acquireLock(this.lockAcquireTimeout, async () => {
            return await this._setSession(currentSession);
          });
        }
        async _setSession(currentSession) {
          try {
            if (!currentSession.access_token || !currentSession.refresh_token) {
              throw new AuthSessionMissingError();
            }
            const timeNow = Date.now() / 1e3;
            let expiresAt2 = timeNow;
            let hasExpired = true;
            let session = null;
            const { payload } = decodeJWT(currentSession.access_token);
            if (payload.exp) {
              expiresAt2 = payload.exp;
              hasExpired = expiresAt2 <= timeNow;
            }
            if (hasExpired) {
              const { data: refreshedSession, error } = await this._callRefreshToken(currentSession.refresh_token);
              if (error) {
                return this._returnResult({ data: { user: null, session: null }, error });
              }
              if (!refreshedSession) {
                return { data: { user: null, session: null }, error: null };
              }
              session = refreshedSession;
            } else {
              const { data, error } = await this._getUser(currentSession.access_token);
              if (error) {
                return this._returnResult({ data: { user: null, session: null }, error });
              }
              session = {
                access_token: currentSession.access_token,
                refresh_token: currentSession.refresh_token,
                user: data.user,
                token_type: "bearer",
                expires_in: expiresAt2 - timeNow,
                expires_at: expiresAt2
              };
              await this._saveSession(session);
              await this._notifyAllSubscribers("SIGNED_IN", session);
            }
            return this._returnResult({ data: { user: session.user, session }, error: null });
          } catch (error) {
            if (isAuthError(error)) {
              return this._returnResult({ data: { session: null, user: null }, error });
            }
            throw error;
          }
        }
        /**
         * Returns a new session, regardless of expiry status.
         * Takes in an optional current session. If not passed in, then refreshSession() will attempt to retrieve it from getSession().
         * If the current session's refresh token is invalid, an error will be thrown.
         * @param currentSession The current session. If passed in, it must contain a refresh token.
         */
        async refreshSession(currentSession) {
          await this.initializePromise;
          return await this._acquireLock(this.lockAcquireTimeout, async () => {
            return await this._refreshSession(currentSession);
          });
        }
        async _refreshSession(currentSession) {
          try {
            return await this._useSession(async (result) => {
              var _a;
              if (!currentSession) {
                const { data, error: error2 } = result;
                if (error2) {
                  throw error2;
                }
                currentSession = (_a = data.session) !== null && _a !== void 0 ? _a : void 0;
              }
              if (!(currentSession === null || currentSession === void 0 ? void 0 : currentSession.refresh_token)) {
                throw new AuthSessionMissingError();
              }
              const { data: session, error } = await this._callRefreshToken(currentSession.refresh_token);
              if (error) {
                return this._returnResult({ data: { user: null, session: null }, error });
              }
              if (!session) {
                return this._returnResult({ data: { user: null, session: null }, error: null });
              }
              return this._returnResult({ data: { user: session.user, session }, error: null });
            });
          } catch (error) {
            if (isAuthError(error)) {
              return this._returnResult({ data: { user: null, session: null }, error });
            }
            throw error;
          }
        }
        /**
         * Gets the session data from a URL string
         */
        async _getSessionFromURL(params, callbackUrlType) {
          try {
            if (!isBrowser())
              throw new AuthImplicitGrantRedirectError("No browser detected.");
            if (params.error || params.error_description || params.error_code) {
              throw new AuthImplicitGrantRedirectError(params.error_description || "Error in URL with unspecified error_description", {
                error: params.error || "unspecified_error",
                code: params.error_code || "unspecified_code"
              });
            }
            switch (callbackUrlType) {
              case "implicit":
                if (this.flowType === "pkce") {
                  throw new AuthPKCEGrantCodeExchangeError("Not a valid PKCE flow url.");
                }
                break;
              case "pkce":
                if (this.flowType === "implicit") {
                  throw new AuthImplicitGrantRedirectError("Not a valid implicit grant flow url.");
                }
                break;
              default:
            }
            if (callbackUrlType === "pkce") {
              this._debug("#_initialize()", "begin", "is PKCE flow", true);
              if (!params.code)
                throw new AuthPKCEGrantCodeExchangeError("No code detected.");
              const { data: data2, error: error2 } = await this._exchangeCodeForSession(params.code);
              if (error2)
                throw error2;
              const url = new URL(window.location.href);
              url.searchParams.delete("code");
              window.history.replaceState(window.history.state, "", url.toString());
              return { data: { session: data2.session, redirectType: null }, error: null };
            }
            const { provider_token, provider_refresh_token, access_token, refresh_token, expires_in, expires_at, token_type } = params;
            if (!access_token || !expires_in || !refresh_token || !token_type) {
              throw new AuthImplicitGrantRedirectError("No session defined in URL");
            }
            const timeNow = Math.round(Date.now() / 1e3);
            const expiresIn = parseInt(expires_in);
            let expiresAt2 = timeNow + expiresIn;
            if (expires_at) {
              expiresAt2 = parseInt(expires_at);
            }
            const actuallyExpiresIn = expiresAt2 - timeNow;
            if (actuallyExpiresIn * 1e3 <= AUTO_REFRESH_TICK_DURATION_MS) {
              console.warn(`@supabase/gotrue-js: Session as retrieved from URL expires in ${actuallyExpiresIn}s, should have been closer to ${expiresIn}s`);
            }
            const issuedAt = expiresAt2 - expiresIn;
            if (timeNow - issuedAt >= 120) {
              console.warn("@supabase/gotrue-js: Session as retrieved from URL was issued over 120s ago, URL could be stale", issuedAt, expiresAt2, timeNow);
            } else if (timeNow - issuedAt < 0) {
              console.warn("@supabase/gotrue-js: Session as retrieved from URL was issued in the future? Check the device clock for skew", issuedAt, expiresAt2, timeNow);
            }
            const { data, error } = await this._getUser(access_token);
            if (error)
              throw error;
            const session = {
              provider_token,
              provider_refresh_token,
              access_token,
              expires_in: expiresIn,
              expires_at: expiresAt2,
              refresh_token,
              token_type,
              user: data.user
            };
            window.location.hash = "";
            this._debug("#_getSessionFromURL()", "clearing window.location.hash");
            return this._returnResult({ data: { session, redirectType: params.type }, error: null });
          } catch (error) {
            if (isAuthError(error)) {
              return this._returnResult({ data: { session: null, redirectType: null }, error });
            }
            throw error;
          }
        }
        /**
         * Checks if the current URL contains parameters given by an implicit oauth grant flow (https://www.rfc-editor.org/rfc/rfc6749.html#section-4.2)
         *
         * If `detectSessionInUrl` is a function, it will be called with the URL and params to determine
         * if the URL should be processed as a Supabase auth callback. This allows users to exclude
         * URLs from other OAuth providers (e.g., Facebook Login) that also return access_token in the fragment.
         */
        _isImplicitGrantCallback(params) {
          if (typeof this.detectSessionInUrl === "function") {
            return this.detectSessionInUrl(new URL(window.location.href), params);
          }
          return Boolean(params.access_token || params.error_description);
        }
        /**
         * Checks if the current URL and backing storage contain parameters given by a PKCE flow
         */
        async _isPKCECallback(params) {
          const currentStorageContent = await getItemAsync(this.storage, `${this.storageKey}-code-verifier`);
          return !!(params.code && currentStorageContent);
        }
        /**
         * Inside a browser context, `signOut()` will remove the logged in user from the browser session and log them out - removing all items from localstorage and then trigger a `"SIGNED_OUT"` event.
         *
         * For server-side management, you can revoke all refresh tokens for a user by passing a user's JWT through to `auth.api.signOut(JWT: string)`.
         * There is no way to revoke a user's access token jwt until it expires. It is recommended to set a shorter expiry on the jwt for this reason.
         *
         * If using `others` scope, no `SIGNED_OUT` event is fired!
         */
        async signOut(options = { scope: "global" }) {
          await this.initializePromise;
          return await this._acquireLock(this.lockAcquireTimeout, async () => {
            return await this._signOut(options);
          });
        }
        async _signOut({ scope } = { scope: "global" }) {
          return await this._useSession(async (result) => {
            var _a;
            const { data, error: sessionError } = result;
            if (sessionError && !isAuthSessionMissingError(sessionError)) {
              return this._returnResult({ error: sessionError });
            }
            const accessToken = (_a = data.session) === null || _a === void 0 ? void 0 : _a.access_token;
            if (accessToken) {
              const { error } = await this.admin.signOut(accessToken, scope);
              if (error) {
                if (!(isAuthApiError(error) && (error.status === 404 || error.status === 401 || error.status === 403) || isAuthSessionMissingError(error))) {
                  return this._returnResult({ error });
                }
              }
            }
            if (scope !== "others") {
              await this._removeSession();
              await removeItemAsync(this.storage, `${this.storageKey}-code-verifier`);
            }
            return this._returnResult({ error: null });
          });
        }
        onAuthStateChange(callback) {
          const id = generateCallbackId();
          const subscription = {
            id,
            callback,
            unsubscribe: () => {
              this._debug("#unsubscribe()", "state change callback with id removed", id);
              this.stateChangeEmitters.delete(id);
            }
          };
          this._debug("#onAuthStateChange()", "registered callback with id", id);
          this.stateChangeEmitters.set(id, subscription);
          (async () => {
            await this.initializePromise;
            await this._acquireLock(this.lockAcquireTimeout, async () => {
              this._emitInitialSession(id);
            });
          })();
          return { data: { subscription } };
        }
        async _emitInitialSession(id) {
          return await this._useSession(async (result) => {
            var _a, _b;
            try {
              const { data: { session }, error } = result;
              if (error)
                throw error;
              await ((_a = this.stateChangeEmitters.get(id)) === null || _a === void 0 ? void 0 : _a.callback("INITIAL_SESSION", session));
              this._debug("INITIAL_SESSION", "callback id", id, "session", session);
            } catch (err) {
              await ((_b = this.stateChangeEmitters.get(id)) === null || _b === void 0 ? void 0 : _b.callback("INITIAL_SESSION", null));
              this._debug("INITIAL_SESSION", "callback id", id, "error", err);
              console.error(err);
            }
          });
        }
        /**
         * Sends a password reset request to an email address. This method supports the PKCE flow.
         *
         * @param email The email address of the user.
         * @param options.redirectTo The URL to send the user to after they click the password reset link.
         * @param options.captchaToken Verification token received when the user completes the captcha on the site.
         */
        async resetPasswordForEmail(email, options = {}) {
          let codeChallenge = null;
          let codeChallengeMethod = null;
          if (this.flowType === "pkce") {
            ;
            [codeChallenge, codeChallengeMethod] = await getCodeChallengeAndMethod(
              this.storage,
              this.storageKey,
              true
              // isPasswordRecovery
            );
          }
          try {
            return await _request(this.fetch, "POST", `${this.url}/recover`, {
              body: {
                email,
                code_challenge: codeChallenge,
                code_challenge_method: codeChallengeMethod,
                gotrue_meta_security: { captcha_token: options.captchaToken }
              },
              headers: this.headers,
              redirectTo: options.redirectTo
            });
          } catch (error) {
            await removeItemAsync(this.storage, `${this.storageKey}-code-verifier`);
            if (isAuthError(error)) {
              return this._returnResult({ data: null, error });
            }
            throw error;
          }
        }
        /**
         * Gets all the identities linked to a user.
         */
        async getUserIdentities() {
          var _a;
          try {
            const { data, error } = await this.getUser();
            if (error)
              throw error;
            return this._returnResult({ data: { identities: (_a = data.user.identities) !== null && _a !== void 0 ? _a : [] }, error: null });
          } catch (error) {
            if (isAuthError(error)) {
              return this._returnResult({ data: null, error });
            }
            throw error;
          }
        }
        async linkIdentity(credentials) {
          if ("token" in credentials) {
            return this.linkIdentityIdToken(credentials);
          }
          return this.linkIdentityOAuth(credentials);
        }
        async linkIdentityOAuth(credentials) {
          var _a;
          try {
            const { data, error } = await this._useSession(async (result) => {
              var _a2, _b, _c, _d, _e;
              const { data: data2, error: error2 } = result;
              if (error2)
                throw error2;
              const url = await this._getUrlForProvider(`${this.url}/user/identities/authorize`, credentials.provider, {
                redirectTo: (_a2 = credentials.options) === null || _a2 === void 0 ? void 0 : _a2.redirectTo,
                scopes: (_b = credentials.options) === null || _b === void 0 ? void 0 : _b.scopes,
                queryParams: (_c = credentials.options) === null || _c === void 0 ? void 0 : _c.queryParams,
                skipBrowserRedirect: true
              });
              return await _request(this.fetch, "GET", url, {
                headers: this.headers,
                jwt: (_e = (_d = data2.session) === null || _d === void 0 ? void 0 : _d.access_token) !== null && _e !== void 0 ? _e : void 0
              });
            });
            if (error)
              throw error;
            if (isBrowser() && !((_a = credentials.options) === null || _a === void 0 ? void 0 : _a.skipBrowserRedirect)) {
              window.location.assign(data === null || data === void 0 ? void 0 : data.url);
            }
            return this._returnResult({
              data: { provider: credentials.provider, url: data === null || data === void 0 ? void 0 : data.url },
              error: null
            });
          } catch (error) {
            if (isAuthError(error)) {
              return this._returnResult({ data: { provider: credentials.provider, url: null }, error });
            }
            throw error;
          }
        }
        async linkIdentityIdToken(credentials) {
          return await this._useSession(async (result) => {
            var _a;
            try {
              const { error: sessionError, data: { session } } = result;
              if (sessionError)
                throw sessionError;
              const { options, provider, token, access_token, nonce } = credentials;
              const res = await _request(this.fetch, "POST", `${this.url}/token?grant_type=id_token`, {
                headers: this.headers,
                jwt: (_a = session === null || session === void 0 ? void 0 : session.access_token) !== null && _a !== void 0 ? _a : void 0,
                body: {
                  provider,
                  id_token: token,
                  access_token,
                  nonce,
                  link_identity: true,
                  gotrue_meta_security: { captcha_token: options === null || options === void 0 ? void 0 : options.captchaToken }
                },
                xform: _sessionResponse
              });
              const { data, error } = res;
              if (error) {
                return this._returnResult({ data: { user: null, session: null }, error });
              } else if (!data || !data.session || !data.user) {
                return this._returnResult({
                  data: { user: null, session: null },
                  error: new AuthInvalidTokenResponseError()
                });
              }
              if (data.session) {
                await this._saveSession(data.session);
                await this._notifyAllSubscribers("USER_UPDATED", data.session);
              }
              return this._returnResult({ data, error });
            } catch (error) {
              await removeItemAsync(this.storage, `${this.storageKey}-code-verifier`);
              if (isAuthError(error)) {
                return this._returnResult({ data: { user: null, session: null }, error });
              }
              throw error;
            }
          });
        }
        /**
         * Unlinks an identity from a user by deleting it. The user will no longer be able to sign in with that identity once it's unlinked.
         */
        async unlinkIdentity(identity) {
          try {
            return await this._useSession(async (result) => {
              var _a, _b;
              const { data, error } = result;
              if (error) {
                throw error;
              }
              return await _request(this.fetch, "DELETE", `${this.url}/user/identities/${identity.identity_id}`, {
                headers: this.headers,
                jwt: (_b = (_a = data.session) === null || _a === void 0 ? void 0 : _a.access_token) !== null && _b !== void 0 ? _b : void 0
              });
            });
          } catch (error) {
            if (isAuthError(error)) {
              return this._returnResult({ data: null, error });
            }
            throw error;
          }
        }
        /**
         * Generates a new JWT.
         * @param refreshToken A valid refresh token that was returned on login.
         */
        async _refreshAccessToken(refreshToken) {
          const debugName = `#_refreshAccessToken(${refreshToken.substring(0, 5)}...)`;
          this._debug(debugName, "begin");
          try {
            const startedAt = Date.now();
            return await retryable(async (attempt) => {
              if (attempt > 0) {
                await sleep(200 * Math.pow(2, attempt - 1));
              }
              this._debug(debugName, "refreshing attempt", attempt);
              return await _request(this.fetch, "POST", `${this.url}/token?grant_type=refresh_token`, {
                body: { refresh_token: refreshToken },
                headers: this.headers,
                xform: _sessionResponse
              });
            }, (attempt, error) => {
              const nextBackOffInterval = 200 * Math.pow(2, attempt);
              return error && isAuthRetryableFetchError(error) && // retryable only if the request can be sent before the backoff overflows the tick duration
              Date.now() + nextBackOffInterval - startedAt < AUTO_REFRESH_TICK_DURATION_MS;
            });
          } catch (error) {
            this._debug(debugName, "error", error);
            if (isAuthError(error)) {
              return this._returnResult({ data: { session: null, user: null }, error });
            }
            throw error;
          } finally {
            this._debug(debugName, "end");
          }
        }
        _isValidSession(maybeSession) {
          const isValidSession = typeof maybeSession === "object" && maybeSession !== null && "access_token" in maybeSession && "refresh_token" in maybeSession && "expires_at" in maybeSession;
          return isValidSession;
        }
        async _handleProviderSignIn(provider, options) {
          const url = await this._getUrlForProvider(`${this.url}/authorize`, provider, {
            redirectTo: options.redirectTo,
            scopes: options.scopes,
            queryParams: options.queryParams
          });
          this._debug("#_handleProviderSignIn()", "provider", provider, "options", options, "url", url);
          if (isBrowser() && !options.skipBrowserRedirect) {
            window.location.assign(url);
          }
          return { data: { provider, url }, error: null };
        }
        /**
         * Recovers the session from LocalStorage and refreshes the token
         * Note: this method is async to accommodate for AsyncStorage e.g. in React native.
         */
        async _recoverAndRefresh() {
          var _a, _b;
          const debugName = "#_recoverAndRefresh()";
          this._debug(debugName, "begin");
          try {
            const currentSession = await getItemAsync(this.storage, this.storageKey);
            if (currentSession && this.userStorage) {
              let maybeUser = await getItemAsync(this.userStorage, this.storageKey + "-user");
              if (!this.storage.isServer && Object.is(this.storage, this.userStorage) && !maybeUser) {
                maybeUser = { user: currentSession.user };
                await setItemAsync(this.userStorage, this.storageKey + "-user", maybeUser);
              }
              currentSession.user = (_a = maybeUser === null || maybeUser === void 0 ? void 0 : maybeUser.user) !== null && _a !== void 0 ? _a : userNotAvailableProxy();
            } else if (currentSession && !currentSession.user) {
              if (!currentSession.user) {
                const separateUser = await getItemAsync(this.storage, this.storageKey + "-user");
                if (separateUser && (separateUser === null || separateUser === void 0 ? void 0 : separateUser.user)) {
                  currentSession.user = separateUser.user;
                  await removeItemAsync(this.storage, this.storageKey + "-user");
                  await setItemAsync(this.storage, this.storageKey, currentSession);
                } else {
                  currentSession.user = userNotAvailableProxy();
                }
              }
            }
            this._debug(debugName, "session from storage", currentSession);
            if (!this._isValidSession(currentSession)) {
              this._debug(debugName, "session is not valid");
              if (currentSession !== null) {
                await this._removeSession();
              }
              return;
            }
            const expiresWithMargin = ((_b = currentSession.expires_at) !== null && _b !== void 0 ? _b : Infinity) * 1e3 - Date.now() < EXPIRY_MARGIN_MS;
            this._debug(debugName, `session has${expiresWithMargin ? "" : " not"} expired with margin of ${EXPIRY_MARGIN_MS}s`);
            if (expiresWithMargin) {
              if (this.autoRefreshToken && currentSession.refresh_token) {
                const { error } = await this._callRefreshToken(currentSession.refresh_token);
                if (error) {
                  console.error(error);
                  if (!isAuthRetryableFetchError(error)) {
                    this._debug(debugName, "refresh failed with a non-retryable error, removing the session", error);
                    await this._removeSession();
                  }
                }
              }
            } else if (currentSession.user && currentSession.user.__isUserNotAvailableProxy === true) {
              try {
                const { data, error: userError } = await this._getUser(currentSession.access_token);
                if (!userError && (data === null || data === void 0 ? void 0 : data.user)) {
                  currentSession.user = data.user;
                  await this._saveSession(currentSession);
                  await this._notifyAllSubscribers("SIGNED_IN", currentSession);
                } else {
                  this._debug(debugName, "could not get user data, skipping SIGNED_IN notification");
                }
              } catch (getUserError) {
                console.error("Error getting user data:", getUserError);
                this._debug(debugName, "error getting user data, skipping SIGNED_IN notification", getUserError);
              }
            } else {
              await this._notifyAllSubscribers("SIGNED_IN", currentSession);
            }
          } catch (err) {
            this._debug(debugName, "error", err);
            console.error(err);
            return;
          } finally {
            this._debug(debugName, "end");
          }
        }
        async _callRefreshToken(refreshToken) {
          var _a, _b;
          if (!refreshToken) {
            throw new AuthSessionMissingError();
          }
          if (this.refreshingDeferred) {
            return this.refreshingDeferred.promise;
          }
          const debugName = `#_callRefreshToken(${refreshToken.substring(0, 5)}...)`;
          this._debug(debugName, "begin");
          try {
            this.refreshingDeferred = new Deferred();
            const { data, error } = await this._refreshAccessToken(refreshToken);
            if (error)
              throw error;
            if (!data.session)
              throw new AuthSessionMissingError();
            await this._saveSession(data.session);
            await this._notifyAllSubscribers("TOKEN_REFRESHED", data.session);
            const result = { data: data.session, error: null };
            this.refreshingDeferred.resolve(result);
            return result;
          } catch (error) {
            this._debug(debugName, "error", error);
            if (isAuthError(error)) {
              const result = { data: null, error };
              if (!isAuthRetryableFetchError(error)) {
                await this._removeSession();
              }
              (_a = this.refreshingDeferred) === null || _a === void 0 ? void 0 : _a.resolve(result);
              return result;
            }
            (_b = this.refreshingDeferred) === null || _b === void 0 ? void 0 : _b.reject(error);
            throw error;
          } finally {
            this.refreshingDeferred = null;
            this._debug(debugName, "end");
          }
        }
        async _notifyAllSubscribers(event, session, broadcast = true) {
          const debugName = `#_notifyAllSubscribers(${event})`;
          this._debug(debugName, "begin", session, `broadcast = ${broadcast}`);
          try {
            if (this.broadcastChannel && broadcast) {
              this.broadcastChannel.postMessage({ event, session });
            }
            const errors = [];
            const promises = Array.from(this.stateChangeEmitters.values()).map(async (x) => {
              try {
                await x.callback(event, session);
              } catch (e) {
                errors.push(e);
              }
            });
            await Promise.all(promises);
            if (errors.length > 0) {
              for (let i = 0; i < errors.length; i += 1) {
                console.error(errors[i]);
              }
              throw errors[0];
            }
          } finally {
            this._debug(debugName, "end");
          }
        }
        /**
         * set currentSession and currentUser
         * process to _startAutoRefreshToken if possible
         */
        async _saveSession(session) {
          this._debug("#_saveSession()", session);
          this.suppressGetSessionWarning = true;
          await removeItemAsync(this.storage, `${this.storageKey}-code-verifier`);
          const sessionToProcess = Object.assign({}, session);
          const userIsProxy = sessionToProcess.user && sessionToProcess.user.__isUserNotAvailableProxy === true;
          if (this.userStorage) {
            if (!userIsProxy && sessionToProcess.user) {
              await setItemAsync(this.userStorage, this.storageKey + "-user", {
                user: sessionToProcess.user
              });
            } else if (userIsProxy) {
            }
            const mainSessionData = Object.assign({}, sessionToProcess);
            delete mainSessionData.user;
            const clonedMainSessionData = deepClone(mainSessionData);
            await setItemAsync(this.storage, this.storageKey, clonedMainSessionData);
          } else {
            const clonedSession = deepClone(sessionToProcess);
            await setItemAsync(this.storage, this.storageKey, clonedSession);
          }
        }
        async _removeSession() {
          this._debug("#_removeSession()");
          this.suppressGetSessionWarning = false;
          await removeItemAsync(this.storage, this.storageKey);
          await removeItemAsync(this.storage, this.storageKey + "-code-verifier");
          await removeItemAsync(this.storage, this.storageKey + "-user");
          if (this.userStorage) {
            await removeItemAsync(this.userStorage, this.storageKey + "-user");
          }
          await this._notifyAllSubscribers("SIGNED_OUT", null);
        }
        /**
         * Removes any registered visibilitychange callback.
         *
         * {@see #startAutoRefresh}
         * {@see #stopAutoRefresh}
         */
        _removeVisibilityChangedCallback() {
          this._debug("#_removeVisibilityChangedCallback()");
          const callback = this.visibilityChangedCallback;
          this.visibilityChangedCallback = null;
          try {
            if (callback && isBrowser() && (window === null || window === void 0 ? void 0 : window.removeEventListener)) {
              window.removeEventListener("visibilitychange", callback);
            }
          } catch (e) {
            console.error("removing visibilitychange callback failed", e);
          }
        }
        /**
         * This is the private implementation of {@link #startAutoRefresh}. Use this
         * within the library.
         */
        async _startAutoRefresh() {
          await this._stopAutoRefresh();
          this._debug("#_startAutoRefresh()");
          const ticker = setInterval(() => this._autoRefreshTokenTick(), AUTO_REFRESH_TICK_DURATION_MS);
          this.autoRefreshTicker = ticker;
          if (ticker && typeof ticker === "object" && typeof ticker.unref === "function") {
            ticker.unref();
          } else if (typeof Deno !== "undefined" && typeof Deno.unrefTimer === "function") {
            Deno.unrefTimer(ticker);
          }
          const timeout = setTimeout(async () => {
            await this.initializePromise;
            await this._autoRefreshTokenTick();
          }, 0);
          this.autoRefreshTickTimeout = timeout;
          if (timeout && typeof timeout === "object" && typeof timeout.unref === "function") {
            timeout.unref();
          } else if (typeof Deno !== "undefined" && typeof Deno.unrefTimer === "function") {
            Deno.unrefTimer(timeout);
          }
        }
        /**
         * This is the private implementation of {@link #stopAutoRefresh}. Use this
         * within the library.
         */
        async _stopAutoRefresh() {
          this._debug("#_stopAutoRefresh()");
          const ticker = this.autoRefreshTicker;
          this.autoRefreshTicker = null;
          if (ticker) {
            clearInterval(ticker);
          }
          const timeout = this.autoRefreshTickTimeout;
          this.autoRefreshTickTimeout = null;
          if (timeout) {
            clearTimeout(timeout);
          }
        }
        /**
         * Starts an auto-refresh process in the background. The session is checked
         * every few seconds. Close to the time of expiration a process is started to
         * refresh the session. If refreshing fails it will be retried for as long as
         * necessary.
         *
         * If you set the {@link GoTrueClientOptions#autoRefreshToken} you don't need
         * to call this function, it will be called for you.
         *
         * On browsers the refresh process works only when the tab/window is in the
         * foreground to conserve resources as well as prevent race conditions and
         * flooding auth with requests. If you call this method any managed
         * visibility change callback will be removed and you must manage visibility
         * changes on your own.
         *
         * On non-browser platforms the refresh process works *continuously* in the
         * background, which may not be desirable. You should hook into your
         * platform's foreground indication mechanism and call these methods
         * appropriately to conserve resources.
         *
         * {@see #stopAutoRefresh}
         */
        async startAutoRefresh() {
          this._removeVisibilityChangedCallback();
          await this._startAutoRefresh();
        }
        /**
         * Stops an active auto refresh process running in the background (if any).
         *
         * If you call this method any managed visibility change callback will be
         * removed and you must manage visibility changes on your own.
         *
         * See {@link #startAutoRefresh} for more details.
         */
        async stopAutoRefresh() {
          this._removeVisibilityChangedCallback();
          await this._stopAutoRefresh();
        }
        /**
         * Runs the auto refresh token tick.
         */
        async _autoRefreshTokenTick() {
          this._debug("#_autoRefreshTokenTick()", "begin");
          try {
            await this._acquireLock(0, async () => {
              try {
                const now = Date.now();
                try {
                  return await this._useSession(async (result) => {
                    const { data: { session } } = result;
                    if (!session || !session.refresh_token || !session.expires_at) {
                      this._debug("#_autoRefreshTokenTick()", "no session");
                      return;
                    }
                    const expiresInTicks = Math.floor((session.expires_at * 1e3 - now) / AUTO_REFRESH_TICK_DURATION_MS);
                    this._debug("#_autoRefreshTokenTick()", `access token expires in ${expiresInTicks} ticks, a tick lasts ${AUTO_REFRESH_TICK_DURATION_MS}ms, refresh threshold is ${AUTO_REFRESH_TICK_THRESHOLD} ticks`);
                    if (expiresInTicks <= AUTO_REFRESH_TICK_THRESHOLD) {
                      await this._callRefreshToken(session.refresh_token);
                    }
                  });
                } catch (e) {
                  console.error("Auto refresh tick failed with error. This is likely a transient error.", e);
                }
              } finally {
                this._debug("#_autoRefreshTokenTick()", "end");
              }
            });
          } catch (e) {
            if (e.isAcquireTimeout || e instanceof LockAcquireTimeoutError) {
              this._debug("auto refresh token tick lock not available");
            } else {
              throw e;
            }
          }
        }
        /**
         * Registers callbacks on the browser / platform, which in-turn run
         * algorithms when the browser window/tab are in foreground. On non-browser
         * platforms it assumes always foreground.
         */
        async _handleVisibilityChange() {
          this._debug("#_handleVisibilityChange()");
          if (!isBrowser() || !(window === null || window === void 0 ? void 0 : window.addEventListener)) {
            if (this.autoRefreshToken) {
              this.startAutoRefresh();
            }
            return false;
          }
          try {
            this.visibilityChangedCallback = async () => {
              try {
                await this._onVisibilityChanged(false);
              } catch (error) {
                this._debug("#visibilityChangedCallback", "error", error);
              }
            };
            window === null || window === void 0 ? void 0 : window.addEventListener("visibilitychange", this.visibilityChangedCallback);
            await this._onVisibilityChanged(true);
          } catch (error) {
            console.error("_handleVisibilityChange", error);
          }
        }
        /**
         * Callback registered with `window.addEventListener('visibilitychange')`.
         */
        async _onVisibilityChanged(calledFromInitialize) {
          const methodName = `#_onVisibilityChanged(${calledFromInitialize})`;
          this._debug(methodName, "visibilityState", document.visibilityState);
          if (document.visibilityState === "visible") {
            if (this.autoRefreshToken) {
              this._startAutoRefresh();
            }
            if (!calledFromInitialize) {
              await this.initializePromise;
              await this._acquireLock(this.lockAcquireTimeout, async () => {
                if (document.visibilityState !== "visible") {
                  this._debug(methodName, "acquired the lock to recover the session, but the browser visibilityState is no longer visible, aborting");
                  return;
                }
                await this._recoverAndRefresh();
              });
            }
          } else if (document.visibilityState === "hidden") {
            if (this.autoRefreshToken) {
              this._stopAutoRefresh();
            }
          }
        }
        /**
         * Generates the relevant login URL for a third-party provider.
         * @param options.redirectTo A URL or mobile address to send the user to after they are confirmed.
         * @param options.scopes A space-separated list of scopes granted to the OAuth application.
         * @param options.queryParams An object of key-value pairs containing query parameters granted to the OAuth application.
         */
        async _getUrlForProvider(url, provider, options) {
          const urlParams = [`provider=${encodeURIComponent(provider)}`];
          if (options === null || options === void 0 ? void 0 : options.redirectTo) {
            urlParams.push(`redirect_to=${encodeURIComponent(options.redirectTo)}`);
          }
          if (options === null || options === void 0 ? void 0 : options.scopes) {
            urlParams.push(`scopes=${encodeURIComponent(options.scopes)}`);
          }
          if (this.flowType === "pkce") {
            const [codeChallenge, codeChallengeMethod] = await getCodeChallengeAndMethod(this.storage, this.storageKey);
            const flowParams = new URLSearchParams({
              code_challenge: `${encodeURIComponent(codeChallenge)}`,
              code_challenge_method: `${encodeURIComponent(codeChallengeMethod)}`
            });
            urlParams.push(flowParams.toString());
          }
          if (options === null || options === void 0 ? void 0 : options.queryParams) {
            const query = new URLSearchParams(options.queryParams);
            urlParams.push(query.toString());
          }
          if (options === null || options === void 0 ? void 0 : options.skipBrowserRedirect) {
            urlParams.push(`skip_http_redirect=${options.skipBrowserRedirect}`);
          }
          return `${url}?${urlParams.join("&")}`;
        }
        async _unenroll(params) {
          try {
            return await this._useSession(async (result) => {
              var _a;
              const { data: sessionData, error: sessionError } = result;
              if (sessionError) {
                return this._returnResult({ data: null, error: sessionError });
              }
              return await _request(this.fetch, "DELETE", `${this.url}/factors/${params.factorId}`, {
                headers: this.headers,
                jwt: (_a = sessionData === null || sessionData === void 0 ? void 0 : sessionData.session) === null || _a === void 0 ? void 0 : _a.access_token
              });
            });
          } catch (error) {
            if (isAuthError(error)) {
              return this._returnResult({ data: null, error });
            }
            throw error;
          }
        }
        async _enroll(params) {
          try {
            return await this._useSession(async (result) => {
              var _a, _b;
              const { data: sessionData, error: sessionError } = result;
              if (sessionError) {
                return this._returnResult({ data: null, error: sessionError });
              }
              const body = Object.assign({ friendly_name: params.friendlyName, factor_type: params.factorType }, params.factorType === "phone" ? { phone: params.phone } : params.factorType === "totp" ? { issuer: params.issuer } : {});
              const { data, error } = await _request(this.fetch, "POST", `${this.url}/factors`, {
                body,
                headers: this.headers,
                jwt: (_a = sessionData === null || sessionData === void 0 ? void 0 : sessionData.session) === null || _a === void 0 ? void 0 : _a.access_token
              });
              if (error) {
                return this._returnResult({ data: null, error });
              }
              if (params.factorType === "totp" && data.type === "totp" && ((_b = data === null || data === void 0 ? void 0 : data.totp) === null || _b === void 0 ? void 0 : _b.qr_code)) {
                data.totp.qr_code = `data:image/svg+xml;utf-8,${data.totp.qr_code}`;
              }
              return this._returnResult({ data, error: null });
            });
          } catch (error) {
            if (isAuthError(error)) {
              return this._returnResult({ data: null, error });
            }
            throw error;
          }
        }
        async _verify(params) {
          return this._acquireLock(this.lockAcquireTimeout, async () => {
            try {
              return await this._useSession(async (result) => {
                var _a;
                const { data: sessionData, error: sessionError } = result;
                if (sessionError) {
                  return this._returnResult({ data: null, error: sessionError });
                }
                const body = Object.assign({ challenge_id: params.challengeId }, "webauthn" in params ? {
                  webauthn: Object.assign(Object.assign({}, params.webauthn), { credential_response: params.webauthn.type === "create" ? serializeCredentialCreationResponse(params.webauthn.credential_response) : serializeCredentialRequestResponse(params.webauthn.credential_response) })
                } : { code: params.code });
                const { data, error } = await _request(this.fetch, "POST", `${this.url}/factors/${params.factorId}/verify`, {
                  body,
                  headers: this.headers,
                  jwt: (_a = sessionData === null || sessionData === void 0 ? void 0 : sessionData.session) === null || _a === void 0 ? void 0 : _a.access_token
                });
                if (error) {
                  return this._returnResult({ data: null, error });
                }
                await this._saveSession(Object.assign({ expires_at: Math.round(Date.now() / 1e3) + data.expires_in }, data));
                await this._notifyAllSubscribers("MFA_CHALLENGE_VERIFIED", data);
                return this._returnResult({ data, error });
              });
            } catch (error) {
              if (isAuthError(error)) {
                return this._returnResult({ data: null, error });
              }
              throw error;
            }
          });
        }
        async _challenge(params) {
          return this._acquireLock(this.lockAcquireTimeout, async () => {
            try {
              return await this._useSession(async (result) => {
                var _a;
                const { data: sessionData, error: sessionError } = result;
                if (sessionError) {
                  return this._returnResult({ data: null, error: sessionError });
                }
                const response = await _request(this.fetch, "POST", `${this.url}/factors/${params.factorId}/challenge`, {
                  body: params,
                  headers: this.headers,
                  jwt: (_a = sessionData === null || sessionData === void 0 ? void 0 : sessionData.session) === null || _a === void 0 ? void 0 : _a.access_token
                });
                if (response.error) {
                  return response;
                }
                const { data } = response;
                if (data.type !== "webauthn") {
                  return { data, error: null };
                }
                switch (data.webauthn.type) {
                  case "create":
                    return {
                      data: Object.assign(Object.assign({}, data), { webauthn: Object.assign(Object.assign({}, data.webauthn), { credential_options: Object.assign(Object.assign({}, data.webauthn.credential_options), { publicKey: deserializeCredentialCreationOptions(data.webauthn.credential_options.publicKey) }) }) }),
                      error: null
                    };
                  case "request":
                    return {
                      data: Object.assign(Object.assign({}, data), { webauthn: Object.assign(Object.assign({}, data.webauthn), { credential_options: Object.assign(Object.assign({}, data.webauthn.credential_options), { publicKey: deserializeCredentialRequestOptions(data.webauthn.credential_options.publicKey) }) }) }),
                      error: null
                    };
                }
              });
            } catch (error) {
              if (isAuthError(error)) {
                return this._returnResult({ data: null, error });
              }
              throw error;
            }
          });
        }
        /**
         * {@see GoTrueMFAApi#challengeAndVerify}
         */
        async _challengeAndVerify(params) {
          const { data: challengeData, error: challengeError } = await this._challenge({
            factorId: params.factorId
          });
          if (challengeError) {
            return this._returnResult({ data: null, error: challengeError });
          }
          return await this._verify({
            factorId: params.factorId,
            challengeId: challengeData.id,
            code: params.code
          });
        }
        /**
         * {@see GoTrueMFAApi#listFactors}
         */
        async _listFactors() {
          var _a;
          const { data: { user }, error: userError } = await this.getUser();
          if (userError) {
            return { data: null, error: userError };
          }
          const data = {
            all: [],
            phone: [],
            totp: [],
            webauthn: []
          };
          for (const factor of (_a = user === null || user === void 0 ? void 0 : user.factors) !== null && _a !== void 0 ? _a : []) {
            data.all.push(factor);
            if (factor.status === "verified") {
              ;
              data[factor.factor_type].push(factor);
            }
          }
          return {
            data,
            error: null
          };
        }
        /**
         * {@see GoTrueMFAApi#getAuthenticatorAssuranceLevel}
         */
        async _getAuthenticatorAssuranceLevel(jwt) {
          var _a, _b, _c, _d;
          if (jwt) {
            try {
              const { payload: payload2 } = decodeJWT(jwt);
              let currentLevel2 = null;
              if (payload2.aal) {
                currentLevel2 = payload2.aal;
              }
              let nextLevel2 = currentLevel2;
              const { data: { user }, error: userError } = await this.getUser(jwt);
              if (userError) {
                return this._returnResult({ data: null, error: userError });
              }
              const verifiedFactors2 = (_b = (_a = user === null || user === void 0 ? void 0 : user.factors) === null || _a === void 0 ? void 0 : _a.filter((factor) => factor.status === "verified")) !== null && _b !== void 0 ? _b : [];
              if (verifiedFactors2.length > 0) {
                nextLevel2 = "aal2";
              }
              const currentAuthenticationMethods2 = payload2.amr || [];
              return { data: { currentLevel: currentLevel2, nextLevel: nextLevel2, currentAuthenticationMethods: currentAuthenticationMethods2 }, error: null };
            } catch (error) {
              if (isAuthError(error)) {
                return this._returnResult({ data: null, error });
              }
              throw error;
            }
          }
          const { data: { session }, error: sessionError } = await this.getSession();
          if (sessionError) {
            return this._returnResult({ data: null, error: sessionError });
          }
          if (!session) {
            return {
              data: { currentLevel: null, nextLevel: null, currentAuthenticationMethods: [] },
              error: null
            };
          }
          const { payload } = decodeJWT(session.access_token);
          let currentLevel = null;
          if (payload.aal) {
            currentLevel = payload.aal;
          }
          let nextLevel = currentLevel;
          const verifiedFactors = (_d = (_c = session.user.factors) === null || _c === void 0 ? void 0 : _c.filter((factor) => factor.status === "verified")) !== null && _d !== void 0 ? _d : [];
          if (verifiedFactors.length > 0) {
            nextLevel = "aal2";
          }
          const currentAuthenticationMethods = payload.amr || [];
          return { data: { currentLevel, nextLevel, currentAuthenticationMethods }, error: null };
        }
        /**
         * Retrieves details about an OAuth authorization request.
         * Only relevant when the OAuth 2.1 server is enabled in Supabase Auth.
         *
         * Returns authorization details including client info, scopes, and user information.
         * If the API returns a redirect_uri, it means consent was already given - the caller
         * should handle the redirect manually if needed.
         */
        async _getAuthorizationDetails(authorizationId) {
          try {
            return await this._useSession(async (result) => {
              const { data: { session }, error: sessionError } = result;
              if (sessionError) {
                return this._returnResult({ data: null, error: sessionError });
              }
              if (!session) {
                return this._returnResult({ data: null, error: new AuthSessionMissingError() });
              }
              return await _request(this.fetch, "GET", `${this.url}/oauth/authorizations/${authorizationId}`, {
                headers: this.headers,
                jwt: session.access_token,
                xform: (data) => ({ data, error: null })
              });
            });
          } catch (error) {
            if (isAuthError(error)) {
              return this._returnResult({ data: null, error });
            }
            throw error;
          }
        }
        /**
         * Approves an OAuth authorization request.
         * Only relevant when the OAuth 2.1 server is enabled in Supabase Auth.
         */
        async _approveAuthorization(authorizationId, options) {
          try {
            return await this._useSession(async (result) => {
              const { data: { session }, error: sessionError } = result;
              if (sessionError) {
                return this._returnResult({ data: null, error: sessionError });
              }
              if (!session) {
                return this._returnResult({ data: null, error: new AuthSessionMissingError() });
              }
              const response = await _request(this.fetch, "POST", `${this.url}/oauth/authorizations/${authorizationId}/consent`, {
                headers: this.headers,
                jwt: session.access_token,
                body: { action: "approve" },
                xform: (data) => ({ data, error: null })
              });
              if (response.data && response.data.redirect_url) {
                if (isBrowser() && !(options === null || options === void 0 ? void 0 : options.skipBrowserRedirect)) {
                  window.location.assign(response.data.redirect_url);
                }
              }
              return response;
            });
          } catch (error) {
            if (isAuthError(error)) {
              return this._returnResult({ data: null, error });
            }
            throw error;
          }
        }
        /**
         * Denies an OAuth authorization request.
         * Only relevant when the OAuth 2.1 server is enabled in Supabase Auth.
         */
        async _denyAuthorization(authorizationId, options) {
          try {
            return await this._useSession(async (result) => {
              const { data: { session }, error: sessionError } = result;
              if (sessionError) {
                return this._returnResult({ data: null, error: sessionError });
              }
              if (!session) {
                return this._returnResult({ data: null, error: new AuthSessionMissingError() });
              }
              const response = await _request(this.fetch, "POST", `${this.url}/oauth/authorizations/${authorizationId}/consent`, {
                headers: this.headers,
                jwt: session.access_token,
                body: { action: "deny" },
                xform: (data) => ({ data, error: null })
              });
              if (response.data && response.data.redirect_url) {
                if (isBrowser() && !(options === null || options === void 0 ? void 0 : options.skipBrowserRedirect)) {
                  window.location.assign(response.data.redirect_url);
                }
              }
              return response;
            });
          } catch (error) {
            if (isAuthError(error)) {
              return this._returnResult({ data: null, error });
            }
            throw error;
          }
        }
        /**
         * Lists all OAuth grants that the authenticated user has authorized.
         * Only relevant when the OAuth 2.1 server is enabled in Supabase Auth.
         */
        async _listOAuthGrants() {
          try {
            return await this._useSession(async (result) => {
              const { data: { session }, error: sessionError } = result;
              if (sessionError) {
                return this._returnResult({ data: null, error: sessionError });
              }
              if (!session) {
                return this._returnResult({ data: null, error: new AuthSessionMissingError() });
              }
              return await _request(this.fetch, "GET", `${this.url}/user/oauth/grants`, {
                headers: this.headers,
                jwt: session.access_token,
                xform: (data) => ({ data, error: null })
              });
            });
          } catch (error) {
            if (isAuthError(error)) {
              return this._returnResult({ data: null, error });
            }
            throw error;
          }
        }
        /**
         * Revokes a user's OAuth grant for a specific client.
         * Only relevant when the OAuth 2.1 server is enabled in Supabase Auth.
         */
        async _revokeOAuthGrant(options) {
          try {
            return await this._useSession(async (result) => {
              const { data: { session }, error: sessionError } = result;
              if (sessionError) {
                return this._returnResult({ data: null, error: sessionError });
              }
              if (!session) {
                return this._returnResult({ data: null, error: new AuthSessionMissingError() });
              }
              await _request(this.fetch, "DELETE", `${this.url}/user/oauth/grants`, {
                headers: this.headers,
                jwt: session.access_token,
                query: { client_id: options.clientId },
                noResolveJson: true
              });
              return { data: {}, error: null };
            });
          } catch (error) {
            if (isAuthError(error)) {
              return this._returnResult({ data: null, error });
            }
            throw error;
          }
        }
        async fetchJwk(kid, jwks = { keys: [] }) {
          let jwk = jwks.keys.find((key) => key.kid === kid);
          if (jwk) {
            return jwk;
          }
          const now = Date.now();
          jwk = this.jwks.keys.find((key) => key.kid === kid);
          if (jwk && this.jwks_cached_at + JWKS_TTL > now) {
            return jwk;
          }
          const { data, error } = await _request(this.fetch, "GET", `${this.url}/.well-known/jwks.json`, {
            headers: this.headers
          });
          if (error) {
            throw error;
          }
          if (!data.keys || data.keys.length === 0) {
            return null;
          }
          this.jwks = data;
          this.jwks_cached_at = now;
          jwk = data.keys.find((key) => key.kid === kid);
          if (!jwk) {
            return null;
          }
          return jwk;
        }
        /**
         * Extracts the JWT claims present in the access token by first verifying the
         * JWT against the server's JSON Web Key Set endpoint
         * `/.well-known/jwks.json` which is often cached, resulting in significantly
         * faster responses. Prefer this method over {@link #getUser} which always
         * sends a request to the Auth server for each JWT.
         *
         * If the project is not using an asymmetric JWT signing key (like ECC or
         * RSA) it always sends a request to the Auth server (similar to {@link
         * #getUser}) to verify the JWT.
         *
         * @param jwt An optional specific JWT you wish to verify, not the one you
         *            can obtain from {@link #getSession}.
         * @param options Various additional options that allow you to customize the
         *                behavior of this method.
         */
        async getClaims(jwt, options = {}) {
          try {
            let token = jwt;
            if (!token) {
              const { data, error } = await this.getSession();
              if (error || !data.session) {
                return this._returnResult({ data: null, error });
              }
              token = data.session.access_token;
            }
            const { header, payload, signature, raw: { header: rawHeader, payload: rawPayload } } = decodeJWT(token);
            if (!(options === null || options === void 0 ? void 0 : options.allowExpired)) {
              validateExp(payload.exp);
            }
            const signingKey = !header.alg || header.alg.startsWith("HS") || !header.kid || !("crypto" in globalThis && "subtle" in globalThis.crypto) ? null : await this.fetchJwk(header.kid, (options === null || options === void 0 ? void 0 : options.keys) ? { keys: options.keys } : options === null || options === void 0 ? void 0 : options.jwks);
            if (!signingKey) {
              const { error } = await this.getUser(token);
              if (error) {
                throw error;
              }
              return {
                data: {
                  claims: payload,
                  header,
                  signature
                },
                error: null
              };
            }
            const algorithm = getAlgorithm(header.alg);
            const publicKey = await crypto.subtle.importKey("jwk", signingKey, algorithm, true, [
              "verify"
            ]);
            const isValid = await crypto.subtle.verify(algorithm, publicKey, signature, stringToUint8Array(`${rawHeader}.${rawPayload}`));
            if (!isValid) {
              throw new AuthInvalidJwtError("Invalid JWT signature");
            }
            return {
              data: {
                claims: payload,
                header,
                signature
              },
              error: null
            };
          } catch (error) {
            if (isAuthError(error)) {
              return this._returnResult({ data: null, error });
            }
            throw error;
          }
        }
      };
      GoTrueClient.nextInstanceID = {};
      GoTrueClient_default = GoTrueClient;
    }
  });

  // ../../node_modules/@supabase/auth-js/dist/module/AuthAdminApi.js
  var init_AuthAdminApi = __esm({
    "../../node_modules/@supabase/auth-js/dist/module/AuthAdminApi.js"() {
      init_GoTrueAdminApi();
    }
  });

  // ../../node_modules/@supabase/auth-js/dist/module/AuthClient.js
  var AuthClient, AuthClient_default;
  var init_AuthClient = __esm({
    "../../node_modules/@supabase/auth-js/dist/module/AuthClient.js"() {
      init_GoTrueClient();
      AuthClient = GoTrueClient_default;
      AuthClient_default = AuthClient;
    }
  });

  // ../../node_modules/@supabase/auth-js/dist/module/index.js
  var init_module3 = __esm({
    "../../node_modules/@supabase/auth-js/dist/module/index.js"() {
      init_GoTrueAdminApi();
      init_GoTrueClient();
      init_AuthAdminApi();
      init_AuthClient();
      init_types2();
      init_errors();
      init_locks();
    }
  });

  // ../../node_modules/@supabase/supabase-js/dist/index.mjs
  function _typeof2(o) {
    "@babel/helpers - typeof";
    return _typeof2 = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o$1) {
      return typeof o$1;
    } : function(o$1) {
      return o$1 && "function" == typeof Symbol && o$1.constructor === Symbol && o$1 !== Symbol.prototype ? "symbol" : typeof o$1;
    }, _typeof2(o);
  }
  function toPrimitive2(t, r) {
    if ("object" != _typeof2(t) || !t)
      return t;
    var e = t[Symbol.toPrimitive];
    if (void 0 !== e) {
      var i = e.call(t, r || "default");
      if ("object" != _typeof2(i))
        return i;
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return ("string" === r ? String : Number)(t);
  }
  function toPropertyKey2(t) {
    var i = toPrimitive2(t, "string");
    return "symbol" == _typeof2(i) ? i : i + "";
  }
  function _defineProperty2(e, r, t) {
    return (r = toPropertyKey2(r)) in e ? Object.defineProperty(e, r, {
      value: t,
      enumerable: true,
      configurable: true,
      writable: true
    }) : e[r] = t, e;
  }
  function ownKeys2(e, r) {
    var t = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
      var o = Object.getOwnPropertySymbols(e);
      r && (o = o.filter(function(r$1) {
        return Object.getOwnPropertyDescriptor(e, r$1).enumerable;
      })), t.push.apply(t, o);
    }
    return t;
  }
  function _objectSpread22(e) {
    for (var r = 1; r < arguments.length; r++) {
      var t = null != arguments[r] ? arguments[r] : {};
      r % 2 ? ownKeys2(Object(t), true).forEach(function(r$1) {
        _defineProperty2(e, r$1, t[r$1]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys2(Object(t)).forEach(function(r$1) {
        Object.defineProperty(e, r$1, Object.getOwnPropertyDescriptor(t, r$1));
      });
    }
    return e;
  }
  function ensureTrailingSlash(url) {
    return url.endsWith("/") ? url : url + "/";
  }
  function applySettingDefaults(options, defaults) {
    var _DEFAULT_GLOBAL_OPTIO, _globalOptions$header;
    const { db: dbOptions, auth: authOptions, realtime: realtimeOptions, global: globalOptions } = options;
    const { db: DEFAULT_DB_OPTIONS$1, auth: DEFAULT_AUTH_OPTIONS$1, realtime: DEFAULT_REALTIME_OPTIONS$1, global: DEFAULT_GLOBAL_OPTIONS$1 } = defaults;
    const result = {
      db: _objectSpread22(_objectSpread22({}, DEFAULT_DB_OPTIONS$1), dbOptions),
      auth: _objectSpread22(_objectSpread22({}, DEFAULT_AUTH_OPTIONS$1), authOptions),
      realtime: _objectSpread22(_objectSpread22({}, DEFAULT_REALTIME_OPTIONS$1), realtimeOptions),
      storage: {},
      global: _objectSpread22(_objectSpread22(_objectSpread22({}, DEFAULT_GLOBAL_OPTIONS$1), globalOptions), {}, { headers: _objectSpread22(_objectSpread22({}, (_DEFAULT_GLOBAL_OPTIO = DEFAULT_GLOBAL_OPTIONS$1 === null || DEFAULT_GLOBAL_OPTIONS$1 === void 0 ? void 0 : DEFAULT_GLOBAL_OPTIONS$1.headers) !== null && _DEFAULT_GLOBAL_OPTIO !== void 0 ? _DEFAULT_GLOBAL_OPTIO : {}), (_globalOptions$header = globalOptions === null || globalOptions === void 0 ? void 0 : globalOptions.headers) !== null && _globalOptions$header !== void 0 ? _globalOptions$header : {}) }),
      accessToken: async () => ""
    };
    if (options.accessToken)
      result.accessToken = options.accessToken;
    else
      delete result.accessToken;
    return result;
  }
  function validateSupabaseUrl(supabaseUrl) {
    const trimmedUrl = supabaseUrl === null || supabaseUrl === void 0 ? void 0 : supabaseUrl.trim();
    if (!trimmedUrl)
      throw new Error("supabaseUrl is required.");
    if (!trimmedUrl.match(/^https?:\/\//i))
      throw new Error("Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL.");
    try {
      return new URL(ensureTrailingSlash(trimmedUrl));
    } catch (_unused) {
      throw Error("Invalid supabaseUrl: Provided URL is malformed.");
    }
  }
  function shouldShowDeprecationWarning() {
    if (typeof window !== "undefined")
      return false;
    const _process = globalThis["process"];
    if (!_process)
      return false;
    const processVersion = _process["version"];
    if (processVersion === void 0 || processVersion === null)
      return false;
    const versionMatch = processVersion.match(/^v(\d+)\./);
    if (!versionMatch)
      return false;
    return parseInt(versionMatch[1], 10) <= 18;
  }
  var version4, JS_ENV, DEFAULT_HEADERS3, DEFAULT_GLOBAL_OPTIONS, DEFAULT_DB_OPTIONS, DEFAULT_AUTH_OPTIONS, DEFAULT_REALTIME_OPTIONS, resolveFetch4, resolveHeadersConstructor, fetchWithAuth, SupabaseAuthClient, SupabaseClient, createClient;
  var init_dist4 = __esm({
    "../../node_modules/@supabase/supabase-js/dist/index.mjs"() {
      init_module();
      init_dist();
      init_module2();
      init_dist3();
      init_module3();
      init_module2();
      init_module3();
      version4 = "2.93.3";
      JS_ENV = "";
      if (typeof Deno !== "undefined")
        JS_ENV = "deno";
      else if (typeof document !== "undefined")
        JS_ENV = "web";
      else if (typeof navigator !== "undefined" && navigator.product === "ReactNative")
        JS_ENV = "react-native";
      else
        JS_ENV = "node";
      DEFAULT_HEADERS3 = { "X-Client-Info": `supabase-js-${JS_ENV}/${version4}` };
      DEFAULT_GLOBAL_OPTIONS = { headers: DEFAULT_HEADERS3 };
      DEFAULT_DB_OPTIONS = { schema: "public" };
      DEFAULT_AUTH_OPTIONS = {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: "implicit"
      };
      DEFAULT_REALTIME_OPTIONS = {};
      resolveFetch4 = (customFetch) => {
        if (customFetch)
          return (...args) => customFetch(...args);
        return (...args) => fetch(...args);
      };
      resolveHeadersConstructor = () => {
        return Headers;
      };
      fetchWithAuth = (supabaseKey, getAccessToken, customFetch) => {
        const fetch$1 = resolveFetch4(customFetch);
        const HeadersConstructor = resolveHeadersConstructor();
        return async (input, init5) => {
          var _await$getAccessToken;
          const accessToken = (_await$getAccessToken = await getAccessToken()) !== null && _await$getAccessToken !== void 0 ? _await$getAccessToken : supabaseKey;
          let headers = new HeadersConstructor(init5 === null || init5 === void 0 ? void 0 : init5.headers);
          if (!headers.has("apikey"))
            headers.set("apikey", supabaseKey);
          if (!headers.has("Authorization"))
            headers.set("Authorization", `Bearer ${accessToken}`);
          return fetch$1(input, _objectSpread22(_objectSpread22({}, init5), {}, { headers }));
        };
      };
      SupabaseAuthClient = class extends AuthClient_default {
        constructor(options) {
          super(options);
        }
      };
      SupabaseClient = class {
        /**
        * Create a new client for use in the browser.
        * @param supabaseUrl The unique Supabase URL which is supplied when you create a new project in your project dashboard.
        * @param supabaseKey The unique Supabase Key which is supplied when you create a new project in your project dashboard.
        * @param options.db.schema You can switch in between schemas. The schema needs to be on the list of exposed schemas inside Supabase.
        * @param options.auth.autoRefreshToken Set to "true" if you want to automatically refresh the token before expiring.
        * @param options.auth.persistSession Set to "true" if you want to automatically save the user session into local storage.
        * @param options.auth.detectSessionInUrl Set to "true" if you want to automatically detects OAuth grants in the URL and signs in the user.
        * @param options.realtime Options passed along to realtime-js constructor.
        * @param options.storage Options passed along to the storage-js constructor.
        * @param options.global.fetch A custom fetch implementation.
        * @param options.global.headers Any additional headers to send with each network request.
        * @example
        * ```ts
        * import { createClient } from '@supabase/supabase-js'
        *
        * const supabase = createClient('https://xyzcompany.supabase.co', 'public-anon-key')
        * const { data } = await supabase.from('profiles').select('*')
        * ```
        */
        constructor(supabaseUrl, supabaseKey, options) {
          var _settings$auth$storag, _settings$global$head;
          this.supabaseUrl = supabaseUrl;
          this.supabaseKey = supabaseKey;
          const baseUrl = validateSupabaseUrl(supabaseUrl);
          if (!supabaseKey)
            throw new Error("supabaseKey is required.");
          this.realtimeUrl = new URL("realtime/v1", baseUrl);
          this.realtimeUrl.protocol = this.realtimeUrl.protocol.replace("http", "ws");
          this.authUrl = new URL("auth/v1", baseUrl);
          this.storageUrl = new URL("storage/v1", baseUrl);
          this.functionsUrl = new URL("functions/v1", baseUrl);
          const defaultStorageKey = `sb-${baseUrl.hostname.split(".")[0]}-auth-token`;
          const DEFAULTS = {
            db: DEFAULT_DB_OPTIONS,
            realtime: DEFAULT_REALTIME_OPTIONS,
            auth: _objectSpread22(_objectSpread22({}, DEFAULT_AUTH_OPTIONS), {}, { storageKey: defaultStorageKey }),
            global: DEFAULT_GLOBAL_OPTIONS
          };
          const settings = applySettingDefaults(options !== null && options !== void 0 ? options : {}, DEFAULTS);
          this.storageKey = (_settings$auth$storag = settings.auth.storageKey) !== null && _settings$auth$storag !== void 0 ? _settings$auth$storag : "";
          this.headers = (_settings$global$head = settings.global.headers) !== null && _settings$global$head !== void 0 ? _settings$global$head : {};
          if (!settings.accessToken) {
            var _settings$auth;
            this.auth = this._initSupabaseAuthClient((_settings$auth = settings.auth) !== null && _settings$auth !== void 0 ? _settings$auth : {}, this.headers, settings.global.fetch);
          } else {
            this.accessToken = settings.accessToken;
            this.auth = new Proxy({}, { get: (_, prop) => {
              throw new Error(`@supabase/supabase-js: Supabase Client is configured with the accessToken option, accessing supabase.auth.${String(prop)} is not possible`);
            } });
          }
          this.fetch = fetchWithAuth(supabaseKey, this._getAccessToken.bind(this), settings.global.fetch);
          this.realtime = this._initRealtimeClient(_objectSpread22({
            headers: this.headers,
            accessToken: this._getAccessToken.bind(this)
          }, settings.realtime));
          if (this.accessToken)
            Promise.resolve(this.accessToken()).then((token) => this.realtime.setAuth(token)).catch((e) => console.warn("Failed to set initial Realtime auth token:", e));
          this.rest = new PostgrestClient(new URL("rest/v1", baseUrl).href, {
            headers: this.headers,
            schema: settings.db.schema,
            fetch: this.fetch
          });
          this.storage = new StorageClient(this.storageUrl.href, this.headers, this.fetch, options === null || options === void 0 ? void 0 : options.storage);
          if (!settings.accessToken)
            this._listenForAuthEvents();
        }
        /**
        * Supabase Functions allows you to deploy and invoke edge functions.
        */
        get functions() {
          return new FunctionsClient(this.functionsUrl.href, {
            headers: this.headers,
            customFetch: this.fetch
          });
        }
        /**
        * Perform a query on a table or a view.
        *
        * @param relation - The table or view name to query
        */
        from(relation) {
          return this.rest.from(relation);
        }
        /**
        * Select a schema to query or perform an function (rpc) call.
        *
        * The schema needs to be on the list of exposed schemas inside Supabase.
        *
        * @param schema - The schema to query
        */
        schema(schema) {
          return this.rest.schema(schema);
        }
        /**
        * Perform a function call.
        *
        * @param fn - The function name to call
        * @param args - The arguments to pass to the function call
        * @param options - Named parameters
        * @param options.head - When set to `true`, `data` will not be returned.
        * Useful if you only need the count.
        * @param options.get - When set to `true`, the function will be called with
        * read-only access mode.
        * @param options.count - Count algorithm to use to count rows returned by the
        * function. Only applicable for [set-returning
        * functions](https://www.postgresql.org/docs/current/functions-srf.html).
        *
        * `"exact"`: Exact but slow count algorithm. Performs a `COUNT(*)` under the
        * hood.
        *
        * `"planned"`: Approximated but fast count algorithm. Uses the Postgres
        * statistics under the hood.
        *
        * `"estimated"`: Uses exact count for low numbers and planned count for high
        * numbers.
        */
        rpc(fn, args = {}, options = {
          head: false,
          get: false,
          count: void 0
        }) {
          return this.rest.rpc(fn, args, options);
        }
        /**
        * Creates a Realtime channel with Broadcast, Presence, and Postgres Changes.
        *
        * @param {string} name - The name of the Realtime channel.
        * @param {Object} opts - The options to pass to the Realtime channel.
        *
        */
        channel(name, opts = { config: {} }) {
          return this.realtime.channel(name, opts);
        }
        /**
        * Returns all Realtime channels.
        */
        getChannels() {
          return this.realtime.getChannels();
        }
        /**
        * Unsubscribes and removes Realtime channel from Realtime client.
        *
        * @param {RealtimeChannel} channel - The name of the Realtime channel.
        *
        */
        removeChannel(channel) {
          return this.realtime.removeChannel(channel);
        }
        /**
        * Unsubscribes and removes all Realtime channels from Realtime client.
        */
        removeAllChannels() {
          return this.realtime.removeAllChannels();
        }
        async _getAccessToken() {
          var _this = this;
          var _data$session$access_, _data$session;
          if (_this.accessToken)
            return await _this.accessToken();
          const { data } = await _this.auth.getSession();
          return (_data$session$access_ = (_data$session = data.session) === null || _data$session === void 0 ? void 0 : _data$session.access_token) !== null && _data$session$access_ !== void 0 ? _data$session$access_ : _this.supabaseKey;
        }
        _initSupabaseAuthClient({ autoRefreshToken, persistSession, detectSessionInUrl, storage, userStorage, storageKey, flowType, lock, debug, throwOnError }, headers, fetch$1) {
          const authHeaders = {
            Authorization: `Bearer ${this.supabaseKey}`,
            apikey: `${this.supabaseKey}`
          };
          return new SupabaseAuthClient({
            url: this.authUrl.href,
            headers: _objectSpread22(_objectSpread22({}, authHeaders), headers),
            storageKey,
            autoRefreshToken,
            persistSession,
            detectSessionInUrl,
            storage,
            userStorage,
            flowType,
            lock,
            debug,
            throwOnError,
            fetch: fetch$1,
            hasCustomAuthorizationHeader: Object.keys(this.headers).some((key) => key.toLowerCase() === "authorization")
          });
        }
        _initRealtimeClient(options) {
          return new RealtimeClient(this.realtimeUrl.href, _objectSpread22(_objectSpread22({}, options), {}, { params: _objectSpread22(_objectSpread22({}, { apikey: this.supabaseKey }), options === null || options === void 0 ? void 0 : options.params) }));
        }
        _listenForAuthEvents() {
          return this.auth.onAuthStateChange((event, session) => {
            this._handleTokenChanged(event, "CLIENT", session === null || session === void 0 ? void 0 : session.access_token);
          });
        }
        _handleTokenChanged(event, source, token) {
          if ((event === "TOKEN_REFRESHED" || event === "SIGNED_IN") && this.changedAccessToken !== token) {
            this.changedAccessToken = token;
            this.realtime.setAuth(token);
          } else if (event === "SIGNED_OUT") {
            this.realtime.setAuth();
            if (source == "STORAGE")
              this.auth.signOut();
            this.changedAccessToken = void 0;
          }
        }
      };
      createClient = (supabaseUrl, supabaseKey, options) => {
        return new SupabaseClient(supabaseUrl, supabaseKey, options);
      };
      if (shouldShowDeprecationWarning())
        console.warn("\u26A0\uFE0F  Node.js 18 and below are deprecated and will no longer be supported in future versions of @supabase/supabase-js. Please upgrade to Node.js 20 or later. For more information, visit: https://github.com/orgs/supabase/discussions/37217");
    }
  });

  // ../core/src/supabase/config.js
  var SUPABASE_URL, SUPABASE_ANON_KEY, TABLES, PROJECT_CONFIGS;
  var init_config = __esm({
    "../core/src/supabase/config.js"() {
      "use strict";
      SUPABASE_URL = "https://luiesmfjdcmpywavvfqm.supabase.co";
      SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1aWVzbWZqZGNtcHl3YXZ2ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4ODYxNDksImV4cCI6MjA4NTQ2MjE0OX0.oqjHFf2HhCLcanh0HVryoQH7iSV7E9dHHZJdYehxZ0U";
      TABLES = {
        // Shared tables
        AUTH_TOKENS: "auth_tokens",
        PAIRINGS: "clouds_pairings",
        // Project-specific character tables
        OWLCLOUD_CHARACTERS: "clouds_characters",
        ROLLCLOUD_CHARACTERS: "rollcloud_characters",
        FOUNDCLOUD_CHARACTERS: "foundcloud_characters"
        // Future
      };
      PROJECT_CONFIGS = {
        owlcloud: {
          characterTable: TABLES.OWLCLOUD_CHARACTERS,
          pairingTable: TABLES.PAIRINGS,
          cacheStorageKey: "owlcloud_character_cache"
        },
        rollcloud: {
          characterTable: TABLES.ROLLCLOUD_CHARACTERS,
          pairingTable: TABLES.PAIRINGS,
          cacheStorageKey: "rollcloud_character_cache"
        },
        foundcloud: {
          characterTable: TABLES.FOUNDCLOUD_CHARACTERS,
          pairingTable: TABLES.PAIRINGS,
          cacheStorageKey: "foundcloud_character_cache"
        }
      };
    }
  });

  // src/content/dicecloud-extraction.js
  function parseCharacterData(apiData, characterId) {
    console.log("CarmaClouds: Parsing character data...");
    if (!apiData.creatures || apiData.creatures.length === 0) {
      console.error("CarmaClouds: No creatures found in API response");
      throw new Error("No character data found in API response");
    }
    const creature = apiData.creatures[0];
    const variables = apiData.creatureVariables && apiData.creatureVariables[0] || {};
    const properties = apiData.creatureProperties || [];
    console.log("CarmaClouds: Creature:", creature.name);
    console.log("CarmaClouds: Variables count:", Object.keys(variables).length);
    console.log("CarmaClouds: Properties count:", properties.length);
    const characterName = creature.name || "";
    const calculateArmorClass = () => {
      const extractNumeric = (val) => {
        if (val === null || val === void 0)
          return null;
        if (typeof val === "number" && !isNaN(val))
          return val;
        if (typeof val === "string") {
          const parsed = parseFloat(val);
          return isNaN(parsed) ? null : parsed;
        }
        if (typeof val === "object") {
          if (val.total !== void 0 && typeof val.total === "number")
            return val.total;
          if (val.value !== void 0 && typeof val.value === "number")
            return val.value;
          if (val.calculation && typeof val.calculation === "string") {
            const bm = val.calculation.match(/^(\d+)/);
            if (bm)
              return parseInt(bm[1]);
          }
        }
        return null;
      };
      if (variables.armorClass && (variables.armorClass.total || variables.armorClass.value)) {
        const variableAC = variables.armorClass.total || variables.armorClass.value;
        console.log(`CarmaClouds: Using Dicecloud's calculated AC: ${variableAC}`);
        return variableAC;
      }
      if (creature && creature.denormalizedStats) {
        const tryKeys = ["armorClass", "ac", "armor"];
        for (const k of tryKeys) {
          if (creature.denormalizedStats.hasOwnProperty(k)) {
            const num = extractNumeric(creature.denormalizedStats[k]);
            if (num !== null) {
              console.log(`CarmaClouds: Using denormalizedStats.${k}:`, num);
              return num;
            }
          }
        }
      }
      const varNamesToCheck = ["armor", "armorClass", "armor_class", "ac", "acTotal"];
      for (const vn of varNamesToCheck) {
        if (variables.hasOwnProperty(vn)) {
          const v = variables[vn];
          const candidate = extractNumeric(v && (v.total ?? v.value ?? v));
          if (candidate !== null) {
            console.log(`CarmaClouds: Using variable ${vn}:`, candidate);
            return candidate;
          }
        }
      }
      let baseAC = 10;
      let armorAC = null;
      const acBonuses = [];
      properties.forEach((prop) => {
        if (prop.inactive || prop.disabled)
          return;
        const hasArmorStat = prop.stat === "armor" || Array.isArray(prop.stats) && prop.stats.includes("armor");
        if (hasArmorStat) {
          let amount = null;
          if (typeof prop.amount === "number") {
            amount = prop.amount;
          } else if (typeof prop.amount === "string") {
            amount = parseFloat(prop.amount);
          }
          if (amount !== null && !isNaN(amount)) {
            const operation = prop.operation || "";
            if (operation === "base" || operation === "Base value") {
              if (armorAC === null || amount > armorAC) {
                armorAC = amount;
              }
            } else if (operation === "add" || operation === "Add") {
              acBonuses.push({ name: prop.name, amount });
            }
          }
        }
      });
      let finalAC = armorAC !== null ? armorAC : baseAC;
      acBonuses.forEach((bonus) => {
        finalAC += bonus.amount;
      });
      console.log("CarmaClouds: Calculated AC:", finalAC);
      return finalAC;
    };
    let characterRace = "Unknown";
    let characterClass = "";
    let characterLevel = 0;
    const uniqueClasses = /* @__PURE__ */ new Set();
    let raceFound = false;
    console.log("CarmaClouds: Extracting basic character info...");
    const propertyTypes = {};
    properties.forEach((prop) => {
      if (prop && prop.type) {
        propertyTypes[prop.type] = (propertyTypes[prop.type] || 0) + 1;
      }
    });
    console.log("CarmaClouds: Property types in character:", propertyTypes);
    if (creature.race) {
      console.log("CarmaClouds: Found race on creature:", creature.race);
      characterRace = creature.race;
      raceFound = true;
    }
    if (creature.denormalizedStats && creature.denormalizedStats.race) {
      console.log("CarmaClouds: Found race in denormalizedStats:", creature.denormalizedStats.race);
      characterRace = creature.denormalizedStats.race;
      raceFound = true;
    }
    for (const prop of properties) {
      if (!prop)
        continue;
      if (!raceFound && prop.type === "folder" && prop.name) {
        const commonRaces = ["half-elf", "half-orc", "dragonborn", "tiefling", "halfling", "human", "elf", "dwarf", "gnome", "orc", "goblin", "kobold", "warforged", "tabaxi", "kenku", "aarakocra", "genasi", "aasimar", "firbolg", "goliath", "triton", "yuan-ti", "tortle", "lizardfolk", "bugbear", "hobgoblin", "changeling", "shifter", "kalashtar"];
        const nameMatchesRace = commonRaces.some((race) => new RegExp(`\\b${race}\\b`, "i").test(prop.name));
        if (nameMatchesRace) {
          const parentDepth = prop.ancestors ? prop.ancestors.length : 0;
          if (parentDepth <= 2) {
            console.log("CarmaClouds: Found race folder:", prop.name);
            characterRace = prop.name;
            raceFound = true;
          }
        }
      }
      if (!raceFound && (prop.type === "race" || prop.type === "species" || prop.type === "characterRace")) {
        if (prop.name) {
          console.log("CarmaClouds: Found race property:", prop.type, prop.name);
          characterRace = prop.name;
          raceFound = true;
        }
      }
      if (!raceFound && prop.type === "constant" && prop.name && prop.name.toLowerCase() === "race") {
        if (prop.value) {
          console.log("CarmaClouds: Found race as constant:", prop.value);
          characterRace = prop.value;
          raceFound = true;
        }
      }
      if (prop.type === "class" && prop.name && !prop.inactive && !prop.disabled) {
        const cleanName = prop.name.replace(/\s*\[Multiclass\]/i, "").trim();
        const normalizedClassName = cleanName.toLowerCase().trim();
        if (!uniqueClasses.has(normalizedClassName)) {
          uniqueClasses.add(normalizedClassName);
          if (characterClass) {
            characterClass += ` / ${cleanName}`;
          } else {
            characterClass = cleanName;
          }
        }
      }
      if (prop.type === "classLevel" && !prop.inactive && !prop.disabled) {
        characterLevel += 1;
      }
    }
    if (!raceFound && (!characterRace || characterRace === "Unknown")) {
      console.log("CarmaClouds: Race not found in properties, checking variables...");
      const raceVars = Object.keys(variables).filter(
        (key) => key.toLowerCase().includes("race") || key.toLowerCase().includes("species")
      );
      if (raceVars.length > 0) {
        console.log("CarmaClouds: Found race-related variables:", raceVars);
        raceVars.forEach((varName) => {
          console.log(`CarmaClouds: Raw data for "${varName}":`, variables[varName]);
        });
        const formatRaceName = (name) => {
          if (!name)
            return null;
          if (name.toLowerCase() === "custom" || name.toLowerCase() === "customlineage") {
            return "Custom Lineage";
          }
          let formatted = name.replace(/([a-z])([A-Z])/g, "$1 $2");
          formatted = formatted.split(" ").map(
            (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          ).join(" ");
          return formatted;
        };
        const extractRaceFromVarName = (varName) => {
          const raceName2 = varName.replace(/race$/i, "").replace(/^race$/i, "");
          if (raceName2 && raceName2 !== varName.toLowerCase()) {
            return raceName2.charAt(0).toUpperCase() + raceName2.slice(1);
          }
          return null;
        };
        let raceName = null;
        let subraceName = null;
        const subRaceVar = raceVars.find((key) => key.toLowerCase() === "subrace");
        if (subRaceVar) {
          const subRaceValue = variables[subRaceVar];
          console.log("CarmaClouds: Found subRace variable:", subRaceValue);
          if (typeof subRaceValue === "object" && subRaceValue !== null) {
            if (subRaceValue.name) {
              subraceName = formatRaceName(subRaceValue.name);
            } else if (subRaceValue.text) {
              subraceName = formatRaceName(subRaceValue.text);
            } else if (subRaceValue.value) {
              subraceName = formatRaceName(subRaceValue.value);
            }
          } else if (typeof subRaceValue === "string") {
            subraceName = formatRaceName(subRaceValue);
          }
          if (subraceName && subraceName.toLowerCase() === "sub race") {
            console.log('CarmaClouds: Skipping generic "Sub Race" label, looking for actual subrace...');
            subraceName = null;
          }
        }
        if (!subraceName) {
          const subraceKeywords = ["fire", "water", "air", "earth", "firegenasi", "watergenasi", "airgenasi", "earthgenasi"];
          for (const varName of raceVars) {
            const varValue = variables[varName];
            const varNameLower = varName.toLowerCase();
            if (subraceKeywords.some((kw) => varNameLower.includes(kw))) {
              const isActive = typeof varValue === "boolean" ? varValue : typeof varValue === "object" && varValue !== null && varValue.value === true;
              if (isActive || varValue === true) {
                if (varNameLower.includes("fire"))
                  subraceName = "Fire";
                else if (varNameLower.includes("water"))
                  subraceName = "Water";
                else if (varNameLower.includes("air"))
                  subraceName = "Air";
                else if (varNameLower.includes("earth"))
                  subraceName = "Earth";
                if (subraceName) {
                  console.log("CarmaClouds: Found subrace from variable:", varName, "->", subraceName);
                  break;
                }
              }
            }
          }
        }
        const raceVar = raceVars.find((key) => key.toLowerCase() === "race");
        if (raceVar) {
          const raceValue = variables[raceVar];
          console.log("CarmaClouds: Found race variable:", raceValue);
          if (typeof raceValue === "object" && raceValue !== null) {
            if (raceValue.value && typeof raceValue.value === "object" && raceValue.value.value) {
              raceName = formatRaceName(raceValue.value.value);
              console.log("CarmaClouds: Extracted race from nested value.value:", raceName);
            } else if (raceValue.value && typeof raceValue.value === "string") {
              raceName = formatRaceName(raceValue.value);
            } else if (raceValue.name) {
              raceName = formatRaceName(raceValue.name);
            } else if (raceValue.text) {
              raceName = formatRaceName(raceValue.text);
            }
          } else if (typeof raceValue === "string") {
            raceName = formatRaceName(raceValue);
          }
        }
        if (!raceName) {
          for (const varName of raceVars) {
            const varValue = variables[varName];
            if (typeof varValue === "object" && varValue !== null && varValue.value === true) {
              const extracted = extractRaceFromVarName(varName);
              if (extracted) {
                raceName = extracted;
                console.log("CarmaClouds: Extracted race from variable name:", varName, "->", raceName);
                break;
              }
            }
          }
        }
        if (raceName && subraceName) {
          characterRace = `${raceName} - ${subraceName}`;
          console.log("CarmaClouds: Combined race and subrace:", characterRace);
        } else if (subraceName) {
          characterRace = subraceName;
          console.log("CarmaClouds: Using subrace as race:", characterRace);
        } else if (raceName) {
          characterRace = raceName;
          console.log("CarmaClouds: Using race:", characterRace);
        } else {
          console.log("CarmaClouds: Could not determine race from variables");
        }
      } else {
        console.log("CarmaClouds: No race variables found");
      }
    }
    console.log("CarmaClouds: Character preview:", characterName, characterLevel, characterRace, characterClass);
    const characterData = {
      // Metadata
      id: creature._id || characterId,
      name: characterName,
      url: window.location.href,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      source: "dicecloud",
      // Preview info (for character lists, etc.)
      preview: {
        race: characterRace,
        class: characterClass || "Unknown",
        level: characterLevel
      },
      // Raw DiceCloud API data - VTT adapters will parse this as needed
      raw: {
        creature,
        variables,
        properties
      }
    };
    console.log("CarmaClouds: Successfully stored character data:", characterData.name);
    return characterData;
  }
  function parseForRollCloud(rawData) {
    if (!rawData || !rawData.creature || !rawData.variables || !rawData.properties) {
      throw new Error("Invalid raw data format");
    }
    const { creature, variables, properties } = rawData;
    const characterName = creature.name || "";
    let race = "Unknown";
    let characterClass = "";
    let level = 0;
    const uniqueClasses = /* @__PURE__ */ new Set();
    let raceFound = false;
    for (const prop of properties) {
      if (!prop)
        continue;
      if (!raceFound && prop.type === "folder" && prop.name) {
        const commonRaces = ["half-elf", "half-orc", "dragonborn", "tiefling", "halfling", "human", "elf", "dwarf", "gnome", "orc", "goblin", "kobold", "warforged", "tabaxi", "kenku", "aarakocra", "genasi", "aasimar", "firbolg", "goliath", "triton", "yuan-ti", "tortle", "lizardfolk", "bugbear", "hobgoblin", "changeling", "shifter", "kalashtar"];
        const nameMatchesRace = commonRaces.some((r) => new RegExp(`\\b${r}\\b`, "i").test(prop.name));
        if (nameMatchesRace) {
          const parentDepth = prop.ancestors ? prop.ancestors.length : 0;
          if (parentDepth <= 2) {
            race = prop.name;
            raceFound = true;
          }
        }
      }
      if (!raceFound && (prop.type === "race" || prop.type === "species" || prop.type === "characterRace")) {
        if (prop.name) {
          race = prop.name;
          raceFound = true;
        }
      }
      if (!raceFound && prop.type === "constant" && prop.name && prop.name.toLowerCase() === "race") {
        if (prop.value) {
          race = prop.value;
          raceFound = true;
        }
      }
      if (prop.type === "class" && prop.name && !prop.inactive && !prop.disabled) {
        const cleanName = prop.name.replace(/\s*\[Multiclass\]/i, "").trim();
        const normalizedClassName = cleanName.toLowerCase().trim();
        if (!uniqueClasses.has(normalizedClassName)) {
          uniqueClasses.add(normalizedClassName);
          characterClass = characterClass ? `${characterClass} / ${cleanName}` : cleanName;
        }
      }
      if (prop.type === "classLevel" && !prop.inactive && !prop.disabled) {
        level += 1;
      }
    }
    if (!raceFound && (!race || race === "Unknown")) {
      const raceVars = Object.keys(variables).filter(
        (key) => key.toLowerCase().includes("race") || key.toLowerCase().includes("species")
      );
      if (raceVars.length > 0) {
        raceVars.forEach((varName) => {
          console.log(`parseForRollCloud: Raw data for "${varName}":`, variables[varName]);
        });
        const formatRaceName = (name) => {
          if (!name)
            return null;
          if (name.toLowerCase() === "custom" || name.toLowerCase() === "customlineage") {
            return "Custom Lineage";
          }
          let formatted = name.replace(/([a-z])([A-Z])/g, "$1 $2");
          formatted = formatted.split(" ").map(
            (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          ).join(" ");
          return formatted;
        };
        const extractRaceFromVarName = (varName) => {
          const raceName2 = varName.replace(/race$/i, "").replace(/^race$/i, "");
          if (raceName2 && raceName2 !== varName.toLowerCase()) {
            return raceName2.charAt(0).toUpperCase() + raceName2.slice(1);
          }
          return null;
        };
        let raceName = null;
        let subraceName = null;
        const subRaceVar = raceVars.find((key) => key.toLowerCase() === "subrace");
        if (subRaceVar) {
          const subRaceValue = variables[subRaceVar];
          if (typeof subRaceValue === "object" && subRaceValue !== null) {
            if (subRaceValue.name) {
              subraceName = formatRaceName(subRaceValue.name);
            } else if (subRaceValue.text) {
              subraceName = formatRaceName(subRaceValue.text);
            } else if (subRaceValue.value) {
              subraceName = formatRaceName(subRaceValue.value);
            }
          } else if (typeof subRaceValue === "string") {
            subraceName = formatRaceName(subRaceValue);
          }
        }
        const raceVar = raceVars.find((key) => key.toLowerCase() === "race");
        if (raceVar) {
          const raceValue = variables[raceVar];
          if (typeof raceValue === "object" && raceValue !== null) {
            if (raceValue.value && typeof raceValue.value === "object" && raceValue.value.value) {
              raceName = formatRaceName(raceValue.value.value);
            } else if (raceValue.value && typeof raceValue.value === "string") {
              raceName = formatRaceName(raceValue.value);
            } else if (raceValue.name) {
              raceName = formatRaceName(raceValue.name);
            } else if (raceValue.text) {
              raceName = formatRaceName(raceValue.text);
            }
          } else if (typeof raceValue === "string") {
            raceName = formatRaceName(raceValue);
          }
        }
        if (!raceName) {
          for (const varName of raceVars) {
            const varValue = variables[varName];
            if (typeof varValue === "object" && varValue !== null && varValue.value === true) {
              const extracted = extractRaceFromVarName(varName);
              if (extracted) {
                raceName = extracted;
                break;
              }
            }
          }
        }
        if (raceName && subraceName) {
          race = `${raceName} - ${subraceName}`;
        } else if (subraceName) {
          race = subraceName;
        } else if (raceName) {
          race = raceName;
        }
      }
    }
    const attributes = {};
    STANDARD_VARS.abilities.forEach((ability) => {
      attributes[ability] = variables[ability]?.total || variables[ability]?.value || 10;
    });
    const attributeMods = {};
    Object.keys(attributes).forEach((attr) => {
      attributeMods[attr] = Math.floor((attributes[attr] - 10) / 2);
    });
    const saves = {};
    STANDARD_VARS.saves.forEach((save) => {
      if (variables[save]) {
        const abilityName = save.replace("Save", "");
        saves[abilityName] = variables[save].total || variables[save].value || 0;
      }
    });
    const skills = {};
    STANDARD_VARS.skills.forEach((skill) => {
      if (variables[skill]) {
        skills[skill] = variables[skill].total || variables[skill].value || 0;
      }
    });
    const calculateAC = () => {
      const extractNumeric = (val) => {
        if (val === null || val === void 0)
          return null;
        if (typeof val === "number" && !isNaN(val))
          return val;
        if (typeof val === "string") {
          const parsed = parseFloat(val);
          return isNaN(parsed) ? null : parsed;
        }
        if (typeof val === "object") {
          if (val.total !== void 0 && typeof val.total === "number")
            return val.total;
          if (val.value !== void 0 && typeof val.value === "number")
            return val.value;
        }
        return null;
      };
      if (variables.armorClass?.total || variables.armorClass?.value) {
        return variables.armorClass.total || variables.armorClass.value;
      }
      if (creature.denormalizedStats) {
        const tryKeys = ["armorClass", "ac", "armor"];
        for (const k of tryKeys) {
          if (creature.denormalizedStats.hasOwnProperty(k)) {
            const num = extractNumeric(creature.denormalizedStats[k]);
            if (num !== null)
              return num;
          }
        }
      }
      const varNamesToCheck = ["armor", "armorClass", "armor_class", "ac", "acTotal"];
      for (const vn of varNamesToCheck) {
        if (variables.hasOwnProperty(vn)) {
          const candidate = extractNumeric(variables[vn]?.total ?? variables[vn]?.value ?? variables[vn]);
          if (candidate !== null)
            return candidate;
        }
      }
      let baseAC = 10;
      let armorAC = null;
      const acBonuses = [];
      properties.forEach((prop) => {
        if (prop.inactive || prop.disabled)
          return;
        const hasArmorStat = prop.stat === "armor" || Array.isArray(prop.stats) && prop.stats.includes("armor");
        if (hasArmorStat) {
          let amount = typeof prop.amount === "number" ? prop.amount : parseFloat(prop.amount);
          if (!isNaN(amount)) {
            const operation = prop.operation || "";
            if (operation === "base" || operation === "Base value") {
              if (armorAC === null || amount > armorAC)
                armorAC = amount;
            } else if (operation === "add" || operation === "Add") {
              acBonuses.push({ name: prop.name, amount });
            }
          }
        }
      });
      let finalAC = armorAC !== null ? armorAC : baseAC;
      acBonuses.forEach((bonus) => finalAC += bonus.amount);
      return finalAC;
    };
    const extractText = (field) => {
      if (!field)
        return "";
      if (typeof field === "string")
        return field;
      if (typeof field === "object" && field.text)
        return field.text;
      return "";
    };
    const spells = properties.filter((p) => p.type === "spell" && !p.inactive && !p.disabled).map((spell) => {
      const spellChildren = properties.filter((p) => {
        if (p.type !== "roll" && p.type !== "damage" && p.type !== "attack")
          return false;
        if (p.ancestors && Array.isArray(p.ancestors)) {
          return p.ancestors.some((ancestor) => {
            const ancestorId = typeof ancestor === "object" ? ancestor.id : ancestor;
            return ancestorId === spell._id;
          });
        }
        return false;
      });
      let attackRoll = "";
      const attackChild = spellChildren.find((c) => c.type === "attack" || c.type === "roll" && c.name && c.name.toLowerCase().includes("attack"));
      if (attackChild && attackChild.roll) {
        if (typeof attackChild.roll === "string") {
          attackRoll = attackChild.roll;
        } else if (typeof attackChild.roll === "object") {
          attackRoll = attackChild.roll.calculation || attackChild.roll.value || "use_spell_attack_bonus";
        }
      }
      const damageRolls = [];
      spellChildren.filter((c) => c.type === "damage" || c.type === "roll" && c.name && (c.name.toLowerCase().includes("damage") || c.name.toLowerCase().includes("heal"))).forEach((damageChild) => {
        let formula = "";
        if (damageChild.amount) {
          if (typeof damageChild.amount === "string") {
            formula = damageChild.amount;
          } else if (typeof damageChild.amount === "object") {
            formula = damageChild.amount.calculation || String(damageChild.amount.value || "");
          }
        } else if (damageChild.roll) {
          if (typeof damageChild.roll === "string") {
            formula = damageChild.roll;
          } else if (typeof damageChild.roll === "object") {
            formula = damageChild.roll.calculation || String(damageChild.roll.value || "");
          }
        } else if (damageChild.damage) {
          if (typeof damageChild.damage === "string") {
            formula = damageChild.damage;
          } else if (typeof damageChild.damage === "object") {
            formula = damageChild.damage.calculation || String(damageChild.damage.value || "");
          }
        }
        if (formula) {
          damageRolls.push({
            formula,
            type: damageChild.damageType || "",
            name: damageChild.name || ""
          });
        }
      });
      const damage = damageRolls.length > 0 ? damageRolls[0].formula : "";
      const damageType = damageRolls.length > 0 ? damageRolls[0].type : "";
      let spellType = "utility";
      if (damageRolls.length > 0) {
        const hasHealingRoll = damageRolls.some(
          (roll) => roll.name.toLowerCase().includes("heal") || roll.type.toLowerCase().includes("heal")
        );
        const spellName = (spell.name || "").toLowerCase();
        const hasHealingName = spellName.includes("heal") || spellName.includes("cure") || spellName.includes("regenerat") || spellName.includes("revivif") || spellName.includes("restoration") || spellName.includes("raise") || spellName.includes("resurrect");
        const spellDesc = extractText(spell.description).toLowerCase();
        const hasHealingDesc = spellDesc.includes("regain") && spellDesc.includes("hit point");
        spellType = hasHealingRoll || hasHealingName || hasHealingDesc ? "healing" : "damage";
      }
      return {
        id: spell._id,
        name: spell.name || "Unnamed Spell",
        level: spell.level || 0,
        school: spell.school || "",
        spellType,
        castingTime: spell.castingTime || "",
        range: spell.range || "",
        components: spell.components || "",
        duration: spell.duration || "",
        description: extractText(spell.description),
        summary: extractText(spell.summary),
        ritual: spell.ritual || false,
        concentration: spell.concentration || false,
        prepared: spell.prepared !== false,
        alwaysPrepared: spell.alwaysPrepared || false,
        attackRoll,
        damage,
        damageType,
        damageRolls
      };
    });
    const actions = properties.filter((p) => p.type === "action" && p.name && !p.inactive && !p.disabled).map((action) => {
      const actionChildren = properties.filter((p) => {
        if (p.type !== "roll" && p.type !== "damage" && p.type !== "attack")
          return false;
        if (p.ancestors && Array.isArray(p.ancestors)) {
          return p.ancestors.some((ancestor) => {
            const ancestorId = typeof ancestor === "object" ? ancestor.id : ancestor;
            return ancestorId === action._id;
          });
        }
        return false;
      });
      let attackRoll = "";
      if (action.attackRoll) {
        attackRoll = typeof action.attackRoll === "string" ? action.attackRoll : String(action.attackRoll.value || action.attackRoll.calculation || "");
      } else {
        const attackChild = actionChildren.find((c) => c.type === "attack" || c.type === "roll" && c.name && c.name.toLowerCase().includes("attack"));
        if (attackChild && attackChild.roll) {
          if (typeof attackChild.roll === "string") {
            attackRoll = attackChild.roll;
          } else if (typeof attackChild.roll === "object") {
            attackRoll = attackChild.roll.calculation || attackChild.roll.value || "";
          }
        }
      }
      let damage = "";
      let damageType = "";
      if (action.damage) {
        damage = typeof action.damage === "string" ? action.damage : String(action.damage.value || action.damage.calculation || "");
      } else {
        const damageChild = actionChildren.find((c) => c.type === "damage" || c.type === "roll" && c.name && c.name.toLowerCase().includes("damage"));
        if (damageChild) {
          if (damageChild.amount) {
            if (typeof damageChild.amount === "string") {
              damage = damageChild.amount;
            } else if (typeof damageChild.amount === "object") {
              damage = damageChild.amount.calculation || String(damageChild.amount.value || "");
            }
          } else if (damageChild.roll) {
            if (typeof damageChild.roll === "string") {
              damage = damageChild.roll;
            } else if (typeof damageChild.roll === "object") {
              damage = damageChild.roll.calculation || String(damageChild.roll.value || "");
            }
          } else if (damageChild.damage) {
            if (typeof damageChild.damage === "string") {
              damage = damageChild.damage;
            } else if (typeof damageChild.damage === "object") {
              damage = damageChild.damage.calculation || String(damageChild.damage.value || "");
            }
          }
          if (damageChild.damageType) {
            damageType = damageChild.damageType;
          }
        }
      }
      if (!damageType && action.damageType) {
        damageType = action.damageType;
      }
      let actionType = "action";
      const tags = action.tags || [];
      const nameLower = (action.name || "").toLowerCase();
      const summaryLower = extractText(action.summary).toLowerCase();
      if (tags.some((t) => typeof t === "string" && t.toLowerCase().includes("bonus"))) {
        actionType = "bonus";
      } else if (tags.some((t) => typeof t === "string" && t.toLowerCase().includes("reaction"))) {
        actionType = "reaction";
      } else if (tags.some((t) => typeof t === "string" && t.toLowerCase().includes("free"))) {
        actionType = "free";
      } else if (tags.some((t) => typeof t === "string" && (t.toLowerCase().includes("legendary") || t.toLowerCase().includes("lair")))) {
        actionType = "free";
      } else if (tags.some((t) => typeof t === "string" && t.toLowerCase().includes("attack"))) {
        actionType = "action";
      } else if (nameLower.includes("bonus action") || summaryLower.includes("bonus action")) {
        actionType = "bonus";
      } else if (nameLower.includes("reaction") || summaryLower.includes("reaction")) {
        actionType = "reaction";
      } else if (nameLower.includes("free action") || summaryLower.includes("free action")) {
        actionType = "free";
      } else if (attackRoll || damage) {
        actionType = "action";
      }
      return {
        id: action._id,
        name: action.name,
        actionType,
        description: extractText(action.description),
        summary: extractText(action.summary),
        attackRoll,
        damage,
        damageType,
        uses: action.uses || 0,
        usesUsed: action.usesUsed || 0,
        reset: action.reset || "",
        resources: action.resources || {},
        tags: action.tags || []
      };
    });
    const spellSlots = {};
    for (let level2 = 1; level2 <= 9; level2++) {
      const slotVar = variables[`slotLevel${level2}`];
      if (slotVar) {
        const current = slotVar.value || 0;
        const max = slotVar.total || slotVar.max || slotVar.value || 0;
        spellSlots[`level${level2}SpellSlots`] = current;
        spellSlots[`level${level2}SpellSlotsMax`] = max;
      }
    }
    const resources = properties.filter((p) => p.type === "resource" || p.type === "attribute" && p.attributeType === "resource").map((resource) => ({
      id: resource._id,
      name: resource.name || "Unnamed Resource",
      current: resource.value || resource.currentValue || 0,
      max: resource.total || resource.max || 0,
      reset: resource.reset || "",
      variableName: resource.variableName || resource.varName || ""
    }));
    const inventory = properties.filter((p) => (p.type === "item" || p.type === "equipment" || p.type === "container") && !p.inactive).map((item) => ({
      id: item._id,
      name: item.name || "Unnamed Item",
      quantity: item.quantity || 1,
      weight: item.weight || 0,
      value: item.value || 0,
      description: extractText(item.description),
      summary: extractText(item.summary),
      equipped: item.equipped || false,
      attuned: item.attuned || false,
      requiresAttunement: item.requiresAttunement || false
    }));
    const companions = extractCompanions(properties);
    return {
      name: characterName,
      race,
      class: characterClass || "Unknown",
      level,
      background: "",
      alignment: creature.alignment || "",
      attributes,
      attributeMods,
      saves,
      skills,
      hitPoints: {
        current: variables.hitPoints?.currentValue ?? variables.hitPoints?.value ?? 0,
        max: variables.hitPoints?.total ?? variables.hitPoints?.max ?? 0
      },
      temporaryHP: variables.temporaryHitPoints?.value ?? variables.temporaryHitPoints?.currentValue ?? 0,
      armorClass: calculateAC(),
      speed: variables.speed?.total || variables.speed?.value || 30,
      initiative: variables.initiative?.total || variables.initiative?.value || 0,
      proficiencyBonus: variables.proficiencyBonus?.total || variables.proficiencyBonus?.value || 0,
      spellSlots,
      resources,
      inventory,
      spells,
      actions,
      companions
    };
  }
  function extractCompanions(properties) {
    console.log("\u{1F43E} Extracting companions from features...");
    console.log("\u{1F43E} Total properties to check:", properties.length);
    const propertyTypes = /* @__PURE__ */ new Set();
    properties.forEach((p) => {
      if (p && p.type)
        propertyTypes.add(p.type);
    });
    console.log("\u{1F43E} Property types available:", Array.from(propertyTypes).sort());
    const companionPatterns = [
      /companion/i,
      /beast of/i,
      /familiar/i,
      /summon/i,
      /mount/i,
      /steel defender/i,
      /homunculus/i,
      /drake/i,
      /primal companion/i,
      /beast master/i,
      /ranger's companion/i
    ];
    const companions = [];
    const potentialCompanions = properties.filter((p) => {
      if (!p || !p.name || p.inactive)
        return false;
      return companionPatterns.some((pattern) => pattern.test(p.name));
    });
    console.log(`\u{1F43E} Found ${potentialCompanions.length} properties matching companion patterns`);
    potentialCompanions.forEach((prop) => {
      console.log(`\u{1F43E} Potential companion: "${prop.name}" (type: ${prop.type})`);
    });
    const seenCompanions = /* @__PURE__ */ new Set();
    potentialCompanions.forEach((feature) => {
      if (feature.description) {
        console.log(`\u{1F43E} Parsing companion: ${feature.name}`);
        const companion = parseCompanionStatBlock(feature.name, feature.description);
        if (companion) {
          if (!seenCompanions.has(companion.name)) {
            companions.push(companion);
            seenCompanions.add(companion.name);
            console.log(`\u2705 Added companion: ${companion.name}`);
          } else {
            console.log(`\u23ED\uFE0F Skipping duplicate companion: ${companion.name}`);
          }
        } else {
          console.log(`\u26A0\uFE0F Failed to parse companion stat block for: ${feature.name}`);
        }
      } else {
        console.log(`\u26A0\uFE0F No description for potential companion: ${feature.name}`);
      }
    });
    console.log(`\u{1F43E} Total companions found: ${companions.length} (after deduplication)`);
    return companions;
  }
  function parseCompanionStatBlock(name, description) {
    let descText = typeof description === "object" ? description.value || description.text || "" : description;
    if (!descText || descText.trim() === "")
      return null;
    const companion = {
      name,
      size: "",
      type: "",
      alignment: "",
      ac: 0,
      hp: "",
      speed: "",
      abilities: {},
      senses: "",
      languages: "",
      proficiencyBonus: 0,
      features: [],
      actions: []
    };
    const sizeTypeMatch = descText.match(/(Tiny|Small|Medium|Large|Huge|Gargantuan)\s+(\w+),\s*(\w+)/i);
    if (sizeTypeMatch) {
      companion.size = sizeTypeMatch[1];
      companion.type = sizeTypeMatch[2];
      companion.alignment = sizeTypeMatch[3];
    }
    const acMatch = descText.match(/\*\*AC\*\*\s+(\d+)|AC\s+(\d+)/i);
    if (acMatch)
      companion.ac = parseInt(acMatch[1] || acMatch[2]);
    const hpMatch = descText.match(/\*\*HP\*\*\s+(\d+\s*\([^)]+\))|HP\s+(\d+\s*\([^)]+\))/i);
    if (hpMatch)
      companion.hp = hpMatch[1] || hpMatch[2];
    const speedMatch = descText.match(/Speed\s+([^•\n]+)/i);
    if (speedMatch)
      companion.speed = speedMatch[1].trim();
    const abilityLine = descText.match(/\|\s*(\d+)\s*\(([+\-]\d+)\)\s*\|\s*(\d+)\s*\(([+\-]\d+)\)\s*\|\s*(\d+)\s*\(([+\-]\d+)\)\s*\|\s*(\d+)\s*\(([+\-]\d+)\)\s*\|\s*(\d+)\s*\(([+\-]\d+)\)\s*\|\s*(\d+)\s*\(([+\-]\d+)\)\s*\|/);
    if (abilityLine) {
      const abilities = ["str", "dex", "con", "int", "wis", "cha"];
      abilities.forEach((ability, i) => {
        const scoreIdx = i * 2 + 1;
        const modIdx = i * 2 + 2;
        if (abilityLine[scoreIdx] && abilityLine[modIdx]) {
          companion.abilities[ability] = {
            score: parseInt(abilityLine[scoreIdx]),
            modifier: parseInt(abilityLine[modIdx])
          };
        }
      });
    }
    const sensesMatch = descText.match(/Senses\s+([^•\n]+)/i);
    if (sensesMatch)
      companion.senses = sensesMatch[1].trim();
    const languagesMatch = descText.match(/Languages\s+([^•\n]+)/i);
    if (languagesMatch)
      companion.languages = languagesMatch[1].trim();
    const pbMatch = descText.match(/Proficiency Bonus\s+(\d+)/i);
    if (pbMatch)
      companion.proficiencyBonus = parseInt(pbMatch[1]);
    const featurePattern = /\*\*\*([^*\n.]+)\.\*\*\*\s*([^*\n]+)/gi;
    let featureMatch;
    while ((featureMatch = featurePattern.exec(descText)) !== null) {
      companion.features.push({
        name: featureMatch[1].trim(),
        description: featureMatch[2].trim()
      });
    }
    const actionsMatch = descText.match(/###?\s*Actions\s+([\s\S]+)/i);
    if (actionsMatch) {
      const actionsText = actionsMatch[1];
      const attackLines = actionsText.split("\n").filter((line) => line.includes("***") && line.includes("Melee Weapon Attack"));
      attackLines.forEach((attackLine) => {
        const nameMatch = attackLine.match(/\*\*\*(\w+)\.\*\*\*/);
        const bonusMatch = attackLine.match(/\*\*(\+\d+)\*\*/);
        const reachMatch = attackLine.match(/reach\s*([\d\s]+ft\.)/);
        const damageMatch = attackLine.match(/\*?Hit:\*?\s*\*\*([^*]+?)\*\*/);
        if (nameMatch && bonusMatch && reachMatch && damageMatch) {
          companion.actions.push({
            name: nameMatch[1].trim(),
            type: "attack",
            attackBonus: parseInt(bonusMatch[1]),
            reach: reachMatch[1].trim(),
            damage: damageMatch[1].trim()
          });
        }
      });
    }
    if (companion.ac > 0 || companion.hp || Object.keys(companion.abilities).length > 0) {
      return companion;
    }
    return null;
  }
  function parseForFoundCloud(rawData, characterId = null) {
    console.log("\u{1F3B2} Parsing character for Foundry VTT...");
    const rollCloudData = parseForRollCloud(rawData, characterId);
    const foundryData = {
      // Basic info
      id: characterId || rollCloudData.id,
      name: rollCloudData.name,
      type: "character",
      // Attributes (abilities)
      attributes: {
        strength: rollCloudData.attributes?.strength || 10,
        dexterity: rollCloudData.attributes?.dexterity || 10,
        constitution: rollCloudData.attributes?.constitution || 10,
        intelligence: rollCloudData.attributes?.intelligence || 10,
        wisdom: rollCloudData.attributes?.wisdom || 10,
        charisma: rollCloudData.attributes?.charisma || 10,
        STR: rollCloudData.attributes?.strength || 10,
        DEX: rollCloudData.attributes?.dexterity || 10,
        CON: rollCloudData.attributes?.constitution || 10,
        INT: rollCloudData.attributes?.intelligence || 10,
        WIS: rollCloudData.attributes?.wisdom || 10,
        CHA: rollCloudData.attributes?.charisma || 10
      },
      // Hit points
      hit_points: {
        current: rollCloudData.hitPoints?.current || 0,
        max: rollCloudData.hitPoints?.max || 0
      },
      // Core stats
      armor_class: rollCloudData.armorClass || 10,
      speed: rollCloudData.speed || 30,
      initiative: rollCloudData.initiative || 0,
      proficiency_bonus: rollCloudData.proficiencyBonus || 2,
      // Character details
      level: rollCloudData.level || 1,
      race: rollCloudData.race || "Unknown",
      class: rollCloudData.class || "Unknown",
      alignment: rollCloudData.alignment || "",
      background: rollCloudData.background || "",
      // Skills (map to Foundry format)
      skills: rollCloudData.skills || {},
      // Saves
      saves: rollCloudData.saves || {},
      // Death saves
      death_saves: rollCloudData.deathSaves || { successes: 0, failures: 0 },
      // Inspiration
      inspiration: rollCloudData.inspiration || false,
      // Temporary HP
      temporary_hp: rollCloudData.hitPoints?.temp || 0,
      // Spells (keep full spell data)
      spells: rollCloudData.spells || [],
      spell_slots: rollCloudData.spellSlots || {},
      // Actions (keep full action data)
      actions: rollCloudData.actions || [],
      // Inventory
      inventory: rollCloudData.inventory || [],
      // Resources
      resources: rollCloudData.resources || [],
      // Companions
      companions: rollCloudData.companions || [],
      // Raw DiceCloud data for advanced features
      raw_dicecloud_data: {
        creature: rawData.creature || {},
        variables: rawData.variables || {},
        properties: rawData.properties || [],
        picture: rawData.creature?.picture,
        description: rawData.creature?.description,
        flySpeed: extractVariable(rawData.variables, "flySpeed"),
        swimSpeed: extractVariable(rawData.variables, "swimSpeed"),
        climbSpeed: extractVariable(rawData.variables, "climbSpeed"),
        damageImmunities: extractVariable(rawData.variables, "damageImmunities"),
        damageResistances: extractVariable(rawData.variables, "damageResistances"),
        damageVulnerabilities: extractVariable(rawData.variables, "damageVulnerabilities"),
        conditionImmunities: extractVariable(rawData.variables, "conditionImmunities"),
        languages: extractVariable(rawData.variables, "languages"),
        size: extractVariable(rawData.variables, "size") || "medium",
        currency: {
          pp: extractVariable(rawData.variables, "pp") || 0,
          gp: extractVariable(rawData.variables, "gp") || 0,
          ep: extractVariable(rawData.variables, "ep") || 0,
          sp: extractVariable(rawData.variables, "sp") || 0,
          cp: extractVariable(rawData.variables, "cp") || 0
        },
        experiencePoints: extractVariable(rawData.variables, "experiencePoints") || 0
      }
    };
    console.log("\u2705 Parsed for Foundry VTT:", foundryData.name);
    return foundryData;
  }
  function extractVariable(variables, varName) {
    if (!variables || !variables[varName])
      return null;
    const varData = variables[varName];
    return varData.value !== void 0 ? varData.value : varData;
  }
  var STANDARD_VARS;
  var init_dicecloud_extraction = __esm({
    "src/content/dicecloud-extraction.js"() {
      STANDARD_VARS = {
        abilities: ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"],
        abilityMods: ["strengthMod", "dexterityMod", "constitutionMod", "intelligenceMod", "wisdomMod", "charismaMod"],
        saves: ["strengthSave", "dexteritySave", "constitutionSave", "intelligenceSave", "wisdomSave", "charismaSave"],
        skills: [
          "acrobatics",
          "animalHandling",
          "arcana",
          "athletics",
          "deception",
          "history",
          "insight",
          "intimidation",
          "investigation",
          "medicine",
          "nature",
          "perception",
          "performance",
          "persuasion",
          "religion",
          "sleightOfHand",
          "stealth",
          "survival"
        ],
        combat: ["armorClass", "hitPoints", "speed", "initiative", "proficiencyBonus"]
      };
    }
  });

  // src/popup/adapters/foundcloud/foundcloud-popup.js
  function initFoundCloudPopup() {
    console.log("FoundCloud popup initializing...");
    loadCharacters();
    document.getElementById("copyUrlBtn")?.addEventListener("click", copyModuleUrl);
  }
  async function loadCharacters() {
    try {
      const profilesResponse = await browserAPI.runtime.sendMessage({ action: "getAllCharacterProfiles" });
      const profiles = profilesResponse.success ? profilesResponse.profiles : {};
      characters = Object.values(profiles).filter(
        (char) => char && char.id && char.name
      );
      console.log(`FoundCloud: Loaded ${characters.length} characters from unified storage`);
      if (characters.length > 0) {
        renderCharacterList();
      } else {
        showEmptyState();
      }
    } catch (error) {
      console.error("Failed to load characters:", error);
      showError("Failed to load characters from storage");
    }
  }
  function renderCharacterList() {
    const listEl = document.getElementById("characterList");
    const emptyState = document.getElementById("emptyState");
    if (!listEl)
      return;
    if (characters.length === 0) {
      listEl.style.display = "none";
      if (emptyState)
        emptyState.style.display = "block";
      return;
    }
    listEl.style.display = "flex";
    if (emptyState)
      emptyState.style.display = "none";
    listEl.innerHTML = characters.map((char) => {
      const level = char.level || char.preview?.level || "?";
      const race = char.race || char.preview?.race || "Unknown";
      const charClass = char.class || char.preview?.class || "Unknown";
      return `
      <div style="background: #2a2a2a; border-radius: 8px; padding: 16px; border: 1px solid #333;">
        <div style="margin-bottom: 12px;">
          <div style="color: #e0e0e0; font-size: 16px; font-weight: 600; margin-bottom: 4px;">
            ${escapeHtml(char.name)}
          </div>
          <div style="color: #888; font-size: 13px;">
            Level ${level} ${charClass} \u2022 ${race}
          </div>
        </div>
        <button 
          class="sync-btn" 
          data-char-id="${char.id}"
          style="width: 100%; padding: 10px; background: #16a75a; color: #000; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 14px;"
        >
          \u2601\uFE0F Sync to Cloud
        </button>
      </div>
    `;
    }).join("");
    document.querySelectorAll(".sync-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const charId = e.target.dataset.charId;
        await syncCharacter(charId);
      });
    });
  }
  function showEmptyState() {
    const listEl = document.getElementById("characterList");
    if (!listEl)
      return;
    listEl.innerHTML = `
    <div class="loading">
      <p>No DiceCloud characters found</p>
      <p style="font-size: 12px; margin-top: 8px;">
        Visit <a href="https://dicecloud.com" target="_blank" style="color: #ff6b35;">DiceCloud</a>
        to load your characters
      </p>
    </div>
  `;
  }
  async function syncCharacter(charId) {
    const char = characters.find((c) => c.id === charId);
    if (!char) {
      console.error("Character not found:", charId);
      return;
    }
    const btn = document.querySelector(`.sync-btn[data-char-id="${charId}"]`);
    if (btn) {
      btn.disabled = true;
      btn.textContent = "\u23F3 Syncing...";
    }
    try {
      await syncCharacterToSupabase(char);
      showSuccess(`${char.name} synced to cloud`);
      if (btn) {
        btn.textContent = "\u2713 Synced!";
        setTimeout(() => {
          btn.disabled = false;
          btn.textContent = "\u{1F504} Re-sync to Cloud";
        }, 2e3);
      }
    } catch (error) {
      console.error("Failed to sync character:", error);
      showError(`Failed to sync ${char.name}: ` + error.message);
      if (btn) {
        btn.disabled = false;
        btn.textContent = "\u274C Failed - Retry";
      }
    }
  }
  async function syncCharacterToSupabase(char) {
    const parsedData = parseForFoundCloud(char.raw, char.id);
    const characterData = {
      dicecloud_character_id: char.id,
      character_name: char.name,
      level: parsedData?.level || char.level || 1,
      race: parsedData?.race || char.race || "Unknown",
      class: parsedData?.class || char.class || "Unknown",
      foundcloud_parsed_data: parsedData || {},
      raw_dicecloud_data: char.raw || {},
      platform: ["foundcloud"]
    };
    const { data: existing } = await supabase.from("clouds_characters").select("id").eq("dicecloud_character_id", char.id).single();
    if (existing) {
      const { error } = await supabase.from("clouds_characters").update(characterData).eq("dicecloud_character_id", char.id);
      if (error) {
        throw new Error(error.message);
      }
    } else {
      const { error } = await supabase.from("clouds_characters").insert(characterData);
      if (error) {
        throw new Error(error.message);
      }
    }
  }
  async function copyModuleUrl() {
    const input = document.getElementById("moduleUrl");
    const btn = document.getElementById("copyUrlBtn");
    if (!input || !btn)
      return;
    try {
      await navigator.clipboard.writeText(input.value);
      const originalText = btn.textContent;
      btn.textContent = "Copied!";
      btn.style.background = "#22c55e";
      setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = "";
      }, 2e3);
    } catch (error) {
      console.error("Failed to copy:", error);
      showError("Failed to copy URL");
    }
  }
  function showSuccess(message) {
    showStatus(message, "success");
  }
  function showError(message) {
    showStatus(message, "error");
  }
  function showStatus(message, type) {
    const statusEl = document.getElementById("statusMessage");
    if (!statusEl)
      return;
    statusEl.textContent = message;
    statusEl.className = `status-message ${type}`;
    setTimeout(() => {
      statusEl.classList.add("hidden");
    }, 5e3);
  }
  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }
  var browserAPI, supabase, characters;
  var init_foundcloud_popup = __esm({
    "src/popup/adapters/foundcloud/foundcloud-popup.js"() {
      init_dist4();
      init_config();
      init_dicecloud_extraction();
      browserAPI = typeof browser !== "undefined" && browser.runtime ? browser : chrome;
      supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      characters = [];
    }
  });

  // src/popup/adapters/foundcloud/adapter.js
  var adapter_exports = {};
  __export(adapter_exports, {
    init: () => init
  });
  async function init(containerEl) {
    console.log("Initializing FoundCloud adapter...");
    try {
      containerEl.innerHTML = '<div class="loading">Loading FoundCloud...</div>';
      const htmlPath = browserAPI2.runtime.getURL("src/popup/adapters/foundcloud/popup.html");
      const response = await fetch(htmlPath);
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const bodyContent = doc.body;
      const wrapper = document.createElement("div");
      wrapper.className = "foundcloud-adapter-scope";
      wrapper.innerHTML = bodyContent.innerHTML;
      containerEl.innerHTML = "";
      containerEl.appendChild(wrapper);
      const cssPath = browserAPI2.runtime.getURL("src/popup/adapters/foundcloud/popup.css");
      const cssResponse = await fetch(cssPath);
      let css = await cssResponse.text();
      css = css.replace(/(^|\})\s*([^{}@]+)\s*\{/gm, (match, closer, selector) => {
        if (selector.trim().startsWith("@"))
          return match;
        const scopedSelector = selector.split(",").map((s) => `.foundcloud-adapter-scope ${s.trim()}`).join(", ");
        return `${closer} ${scopedSelector} {`;
      });
      const style = document.createElement("style");
      style.textContent = css;
      containerEl.appendChild(style);
      initFoundCloudPopup();
      console.log("\u2705 FoundCloud adapter initialized");
    } catch (error) {
      console.error("Failed to load FoundCloud UI:", error);
      containerEl.innerHTML = `
      <div class="error" style="padding: 40px 20px; text-align: center; color: #dc3545;">
        <strong>Failed to load FoundCloud</strong>
        <p>${error.message}</p>
      </div>
    `;
    }
  }
  var browserAPI2;
  var init_adapter = __esm({
    "src/popup/adapters/foundcloud/adapter.js"() {
      init_foundcloud_popup();
      browserAPI2 = typeof browser !== "undefined" && browser.runtime ? browser : chrome;
    }
  });

  // src/popup/adapters/owlcloud/adapter.js
  var adapter_exports2 = {};
  __export(adapter_exports2, {
    init: () => init2
  });
  async function init2(containerEl) {
    console.log("Initializing OwlCloud adapter...");
    try {
      containerEl.innerHTML = '<div class="loading">Loading OwlCloud...</div>';
      const result = await browserAPI3.storage.local.get(["carmaclouds_characters", "diceCloudUserId"]) || {};
      const characters2 = result.carmaclouds_characters || [];
      const diceCloudUserId = result.diceCloudUserId;
      console.log("Found", characters2.length, "synced characters");
      console.log("DiceCloud User ID:", diceCloudUserId);
      const character = characters2.length > 0 ? characters2[0] : null;
      const htmlPath = browserAPI3.runtime.getURL("src/popup/adapters/owlcloud/popup.html");
      const response = await fetch(htmlPath);
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const mainContent = doc.querySelector("main");
      const wrapper = document.createElement("div");
      wrapper.className = "owlcloud-adapter-scope";
      wrapper.innerHTML = mainContent ? mainContent.innerHTML : doc.body.innerHTML;
      containerEl.innerHTML = "";
      containerEl.appendChild(wrapper);
      const cssPath = browserAPI3.runtime.getURL("src/popup/adapters/owlcloud/popup.css");
      const cssResponse = await fetch(cssPath);
      let css = await cssResponse.text();
      css = css.replace(/(^|\})\s*([^{}@]+)\s*\{/gm, (match, closer, selector) => {
        if (selector.trim().startsWith("@"))
          return match;
        const scopedSelector = selector.split(",").map((s) => `.owlcloud-adapter-scope ${s.trim()}`).join(", ");
        return `${closer} ${scopedSelector} {`;
      });
      const style = document.createElement("style");
      style.textContent = css;
      containerEl.appendChild(style);
      const SUPABASE_URL2 = "https://luiesmfjdcmpywavvfqm.supabase.co";
      const SUPABASE_ANON_KEY2 = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1aWVzbWZqZGNtcHl3YXZ2ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4ODYxNDksImV4cCI6MjA4NTQ2MjE0OX0.oqjHFf2HhCLcanh0HVryoQH7iSV7E9dHHZJdYehxZ0U";
      const loginPrompt = wrapper.querySelector("#loginPrompt");
      const syncBox = wrapper.querySelector("#syncBox");
      const pushedCharactersList = wrapper.querySelector("#pushedCharactersList");
      const noPushedCharacters = wrapper.querySelector("#noPushedCharacters");
      async function loadPushedCharacters() {
        if (!diceCloudUserId || !pushedCharactersList)
          return;
        try {
          const response2 = await fetch(
            `${SUPABASE_URL2}/rest/v1/clouds_characters?user_id_dicecloud=eq.${diceCloudUserId}&select=dicecloud_character_id,character_name,level,class,race`,
            {
              headers: {
                "apikey": SUPABASE_ANON_KEY2,
                "Authorization": `Bearer ${SUPABASE_ANON_KEY2}`
              }
            }
          );
          if (response2.ok) {
            const pushedChars = await response2.json();
            pushedCharactersList.innerHTML = "";
            if (pushedChars.length > 0) {
              if (noPushedCharacters)
                noPushedCharacters.classList.add("hidden");
              pushedChars.forEach((char) => {
                const card = document.createElement("div");
                card.style.cssText = "background: #1a1a1a; padding: 12px; border-radius: 8px; border: 1px solid #333; position: relative;";
                card.innerHTML = `
                <button
                  class="delete-char-btn"
                  data-char-id="${char.dicecloud_character_id}"
                  style="position: absolute; top: 8px; right: 8px; background: rgba(239, 68, 68, 0.2); border: 1px solid #EF4444; color: #EF4444; width: 24px; height: 24px; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold; transition: all 0.2s;"
                  title="Delete character from database"
                  onmouseover="this.style.background='rgba(239, 68, 68, 0.4)'"
                  onmouseout="this.style.background='rgba(239, 68, 68, 0.2)'">
                  \u2715
                </button>
                <h4 style="color: #16a75a; margin: 0 0 6px 0; font-size: 14px; padding-right: 30px;">${char.character_name || "Unknown"}</h4>
                <div style="display: flex; gap: 8px; font-size: 12px; color: #888;">
                  <span>Lvl ${char.level || "?"}</span>
                  <span>\u2022</span>
                  <span>${char.class || "Unknown"}</span>
                  <span>\u2022</span>
                  <span>${char.race || "Unknown"}</span>
                </div>
              `;
                const deleteBtn = card.querySelector(".delete-char-btn");
                if (deleteBtn) {
                  deleteBtn.addEventListener("click", async (e) => {
                    e.stopPropagation();
                    if (!confirm(`Delete ${char.character_name || "this character"} from the database?

This cannot be undone.`)) {
                      return;
                    }
                    try {
                      deleteBtn.disabled = true;
                      deleteBtn.textContent = "\u23F3";
                      const response3 = await fetch(
                        `${SUPABASE_URL2}/rest/v1/clouds_characters?dicecloud_character_id=eq.${char.dicecloud_character_id}&user_id_dicecloud=eq.${diceCloudUserId}`,
                        {
                          method: "DELETE",
                          headers: {
                            "apikey": SUPABASE_ANON_KEY2,
                            "Authorization": `Bearer ${SUPABASE_ANON_KEY2}`
                          }
                        }
                      );
                      if (response3.ok) {
                        console.log("\u2705 Character deleted:", char.character_name);
                        await loadPushedCharacters();
                      } else {
                        throw new Error(`Delete failed: ${response3.status}`);
                      }
                    } catch (error) {
                      console.error("Error deleting character:", error);
                      alert(`Failed to delete: ${error.message}`);
                      deleteBtn.disabled = false;
                      deleteBtn.textContent = "\u2715";
                    }
                  });
                }
                pushedCharactersList.appendChild(card);
              });
            } else {
              if (noPushedCharacters)
                noPushedCharacters.classList.remove("hidden");
            }
          }
        } catch (error) {
          console.error("Failed to load pushed characters:", error);
        }
      }
      const supabase2 = window.supabaseClient;
      let supabaseUserId = null;
      if (supabase2) {
        const { data: { session } } = await supabase2.auth.getSession();
        supabaseUserId = session?.user?.id;
      }
      if (!diceCloudUserId || !supabaseUserId) {
        if (loginPrompt) {
          loginPrompt.classList.remove("hidden");
          const titleEl = loginPrompt.querySelector("h3");
          const promptText = loginPrompt.querySelector("p");
          const openAuthBtn = loginPrompt.querySelector("#openAuthModalBtn");
          if (!diceCloudUserId) {
            if (titleEl)
              titleEl.textContent = "Login Required";
            if (promptText)
              promptText.textContent = "Please login to DiceCloud to sync your characters.";
            if (openAuthBtn) {
              openAuthBtn.textContent = "\u{1F510} Login to DiceCloud";
              openAuthBtn.addEventListener("click", () => {
                const authButton = document.querySelector("#dicecloud-auth-button");
                if (authButton)
                  authButton.click();
              });
            }
          } else {
            if (titleEl)
              titleEl.textContent = "\u26A0\uFE0F Heads Up!";
            if (promptText) {
              promptText.innerHTML = "To auto-sync characters, you need a database username and password. <strong>It is NOT your DiceCloud login.</strong> Please register or sign in below.";
            }
            if (openAuthBtn) {
              openAuthBtn.textContent = "\u{1F464} Go to Account Tab";
              openAuthBtn.addEventListener("click", () => {
                const authButton = document.querySelector("#dicecloud-auth-button");
                if (authButton)
                  authButton.click();
                setTimeout(() => {
                  const dicecloudTab = document.querySelector('[data-auth-tab="dicecloud"]');
                  const dicecloudContent = document.querySelector("#dicecloud-auth-content");
                  if (dicecloudTab)
                    dicecloudTab.classList.remove("active");
                  if (dicecloudContent)
                    dicecloudContent.classList.remove("active");
                  const supabaseTab = document.querySelector('[data-auth-tab="supabase"]');
                  const supabaseContent = document.querySelector("#supabase-auth-content");
                  if (supabaseTab)
                    supabaseTab.classList.add("active");
                  if (supabaseContent) {
                    supabaseContent.classList.add("active");
                    supabaseContent.style.display = "block";
                  }
                }, 100);
              });
            }
          }
        }
        if (syncBox)
          syncBox.classList.add("hidden");
      } else {
        if (loginPrompt)
          loginPrompt.classList.add("hidden");
        if (characters2.length > 0 && characters2[characters2.length - 1]?.raw) {
          const character2 = characters2[characters2.length - 1];
          if (syncBox)
            syncBox.classList.remove("hidden");
          const nameEl = wrapper.querySelector("#syncCharName");
          const levelEl = wrapper.querySelector("#syncCharLevel");
          const classEl = wrapper.querySelector("#syncCharClass");
          const raceEl = wrapper.querySelector("#syncCharRace");
          if (nameEl)
            nameEl.textContent = character2.name || "Unknown";
          if (levelEl)
            levelEl.textContent = `Lvl ${character2.preview?.level || "?"}`;
          if (classEl)
            classEl.textContent = character2.preview?.class || "Unknown";
          if (raceEl)
            raceEl.textContent = character2.preview?.race || "Unknown";
          const pushBtn = wrapper.querySelector("#pushToVttBtn");
          if (pushBtn) {
            pushBtn.addEventListener("click", async () => {
              const originalText = pushBtn.innerHTML;
              try {
                pushBtn.disabled = true;
                pushBtn.innerHTML = "\u23F3 Pushing...";
                const supabase3 = window.supabaseClient;
                let supabaseUserId2 = null;
                if (supabase3) {
                  const { data: { session } } = await supabase3.auth.getSession();
                  supabaseUserId2 = session?.user?.id;
                }
                const characterData = {
                  dicecloud_character_id: character2.id,
                  character_name: character2.name || "Unknown",
                  user_id_dicecloud: diceCloudUserId,
                  level: character2.preview?.level || null,
                  class: character2.preview?.class || null,
                  race: character2.preview?.race || null,
                  raw_dicecloud_data: character2.raw,
                  is_active: false,
                  updated_at: (/* @__PURE__ */ new Date()).toISOString()
                };
                if (supabaseUserId2) {
                  characterData.supabase_user_id = supabaseUserId2;
                  console.log("\u2705 Including Supabase user ID:", supabaseUserId2);
                }
                const response2 = await fetch(
                  `${SUPABASE_URL2}/rest/v1/clouds_characters?on_conflict=user_id_dicecloud,dicecloud_character_id`,
                  {
                    method: "POST",
                    headers: {
                      "apikey": SUPABASE_ANON_KEY2,
                      "Authorization": `Bearer ${SUPABASE_ANON_KEY2}`,
                      "Content-Type": "application/json",
                      "Prefer": "resolution=merge-duplicates,return=representation"
                    },
                    body: JSON.stringify(characterData)
                  }
                );
                if (response2.ok) {
                  console.log("\u2705 Character pushed:", character2.name);
                  pushBtn.innerHTML = "\u2705 Pushed!";
                  await browserAPI3.storage.local.remove(["carmaclouds_characters"]);
                  console.log("\u{1F5D1}\uFE0F Cleared ready-to-sync character from local storage");
                  await loadPushedCharacters();
                  setTimeout(async () => {
                    await init2(containerEl);
                  }, 1500);
                } else {
                  const errorText = await response2.text();
                  throw new Error(`Push failed: ${errorText}`);
                }
              } catch (error) {
                console.error("Error pushing character:", error);
                pushBtn.innerHTML = "\u274C Failed";
                alert(`Failed to push: ${error.message}`);
                setTimeout(() => {
                  pushBtn.innerHTML = originalText;
                  pushBtn.disabled = false;
                }, 2e3);
              }
            });
          }
        } else {
          if (syncBox)
            syncBox.classList.add("hidden");
        }
        await loadPushedCharacters();
      }
      const copyBtn = wrapper.querySelector("#copyOwlbearUrlBtn");
      if (copyBtn) {
        copyBtn.addEventListener("click", async () => {
          const urlInput = wrapper.querySelector("#owlbearExtensionUrl");
          if (urlInput) {
            try {
              await navigator.clipboard.writeText(urlInput.value);
              const originalText = copyBtn.textContent;
              copyBtn.textContent = "\u2713 Copied!";
              setTimeout(() => {
                copyBtn.textContent = originalText;
              }, 2e3);
            } catch (err) {
              console.error("Failed to copy:", err);
              copyBtn.textContent = "\u2717 Failed";
              setTimeout(() => {
                copyBtn.textContent = "Copy";
              }, 2e3);
            }
          }
        });
      }
      if (supabase2) {
        if (authSubscription) {
          authSubscription.data.subscription.unsubscribe();
          console.log("\u{1F513} Unsubscribed from previous auth listener");
        }
        authSubscription = supabase2.auth.onAuthStateChange((event, session) => {
          console.log("\u{1F510} OwlCloud adapter detected Supabase auth change:", event);
          if (event !== "INITIAL_SESSION") {
            console.log("\u{1F504} Reloading adapter due to auth change");
            init2(containerEl);
          }
        });
      }
      browserAPI3.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === "dataSynced") {
          console.log("\u{1F4E5} OwlCloud adapter received data sync notification:", message.characterName);
          init2(containerEl);
        }
      });
      browserAPI3.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === "local" && changes.carmaclouds_characters) {
          console.log("\u{1F4E6} OwlCloud adapter detected character storage change");
          init2(containerEl);
        }
      });
    } catch (error) {
      console.error("Failed to load OwlCloud UI:", error);
      containerEl.innerHTML = `
      <div class="error">
        <strong>Failed to load OwlCloud</strong>
        <p>${error.message}</p>
      </div>
    `;
    }
  }
  var browserAPI3, authSubscription;
  var init_adapter2 = __esm({
    "src/popup/adapters/owlcloud/adapter.js"() {
      browserAPI3 = typeof browser !== "undefined" && browser.runtime ? browser : chrome;
      authSubscription = null;
    }
  });

  // src/popup/adapters/rollcloud/adapter.js
  var adapter_exports3 = {};
  __export(adapter_exports3, {
    init: () => init3
  });
  async function init3(containerEl) {
    console.log("Initializing RollCloud adapter...");
    try {
      containerEl.innerHTML = '<div class="loading">Loading RollCloud...</div>';
      const result = await browserAPI4.storage.local.get("carmaclouds_characters") || {};
      let characters2 = result.carmaclouds_characters || [];
      console.log("Found", characters2.length, "synced characters from local storage");
      let needsUpdate = false;
      characters2 = characters2.map((char) => {
        if (char.raw && !char.rollcloud && (char.hitPoints || char.spells || char.actions)) {
          console.log("\u{1F504} Migrating old format character:", char.name);
          needsUpdate = true;
          let rollcloudData = null;
          try {
            rollcloudData = parseForRollCloud(char.raw, char.id);
            console.log("   \u2705 Parsed rollcloud format:", rollcloudData.spells?.length, "spells,", rollcloudData.actions?.length, "actions");
          } catch (err) {
            console.warn("   \u274C Failed to parse:", err);
          }
          return {
            id: char.id,
            name: char.name,
            level: char.level,
            class: char.class,
            race: char.race,
            lastSynced: char.lastSynced,
            raw: char.raw,
            rollcloud: rollcloudData,
            owlcloud: null,
            foundcloud: null
          };
        }
        return char;
      });
      if (needsUpdate) {
        await browserAPI4.storage.local.set({ carmaclouds_characters: characters2 });
        console.log("\u2705 Migrated characters saved to storage");
      }
      const supabase2 = window.supabaseClient;
      let supabaseUserId = null;
      if (supabase2) {
        try {
          const { data: { session } } = await supabase2.auth.getSession();
          supabaseUserId = session?.user?.id;
        } catch (err) {
          console.warn("Failed to get Supabase session:", err);
        }
      }
      if (supabaseUserId) {
        console.log("User authenticated to Supabase, fetching characters from database...");
        containerEl.innerHTML = '<div class="loading">Fetching characters from database...</div>';
        try {
          const SUPABASE_URL2 = "https://luiesmfjdcmpywavvfqm.supabase.co";
          const SUPABASE_ANON_KEY2 = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1aWVzbWZqZGNtcHl3YXZ2ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4ODYxNDksImV4cCI6MjA4NTQ2MjE0OX0.oqjHFf2HhCLcanh0HVryoQH7iSV7E9dHHZJdYehxZ0U";
          const dbResponse = await fetch(
            `${SUPABASE_URL2}/rest/v1/clouds_characters?select=*&supabase_user_id=eq.${supabaseUserId}`,
            {
              headers: {
                "apikey": SUPABASE_ANON_KEY2,
                "Content-Type": "application/json"
              }
            }
          );
          if (dbResponse.ok) {
            const dbCharacters = await dbResponse.json();
            console.log("Found", dbCharacters.length, "characters from Supabase");
            if (dbCharacters.length > 0) {
              containerEl.innerHTML = `<div class="loading">Parsing ${dbCharacters.length} character${dbCharacters.length > 1 ? "s" : ""}...</div>`;
            }
            dbCharacters.forEach((dbChar) => {
              const existingIndex = characters2.findIndex((c) => c.id === dbChar.dicecloud_character_id);
              let rawData = dbChar.raw_dicecloud_data || {};
              if (typeof rawData === "string") {
                try {
                  rawData = JSON.parse(rawData);
                } catch (e) {
                  console.warn("Failed to parse raw_dicecloud_data for character:", dbChar.character_name, e);
                  rawData = {};
                }
              }
              console.log("Character from DB:", dbChar.character_name);
              console.log("Raw data structure:", {
                hasCreature: !!rawData.creature,
                hasVariables: !!rawData.variables,
                hasProperties: !!rawData.properties,
                keys: Object.keys(rawData),
                sample: rawData
              });
              const characterEntry = {
                id: dbChar.dicecloud_character_id,
                name: dbChar.character_name || "Unknown",
                level: dbChar.level || "?",
                class: dbChar.class || "No Class",
                race: dbChar.race || "Unknown",
                lastSynced: dbChar.updated_at || (/* @__PURE__ */ new Date()).toISOString(),
                raw: rawData,
                rollcloud: null,
                owlcloud: null,
                foundcloud: null
              };
              if (rawData.creature && rawData.variables && rawData.properties) {
                try {
                  characterEntry.rollcloud = parseForRollCloud(rawData, dbChar.dicecloud_character_id);
                  console.log("\u2705 Parsed RollCloud format for:", characterEntry.name);
                  console.log("   Spells:", characterEntry.rollcloud.spells?.length || 0);
                  console.log("   Actions:", characterEntry.rollcloud.actions?.length || 0);
                } catch (parseError) {
                  console.warn("Failed to parse RollCloud format for:", dbChar.character_name, parseError);
                }
              }
              if (existingIndex >= 0) {
                characters2[existingIndex] = characterEntry;
              } else {
                characters2.push(characterEntry);
              }
            });
            console.log("Merged characters list now has", characters2.length, "total characters");
            await browserAPI4.storage.local.set({ carmaclouds_characters: characters2 });
            console.log("\u2705 Saved merged characters to local storage");
          }
        } catch (dbError) {
          console.warn("Failed to fetch from Supabase (non-fatal):", dbError);
        }
      }
      console.log("Final character count:", characters2.length);
      const character = characters2.length > 0 ? characters2[0] : null;
      let parsedData = null;
      if (character && character.raw) {
        containerEl.innerHTML = '<div class="loading">Parsing character data...</div>';
        console.log("Parsing character for Roll20:", character.name);
        console.log("Raw data structure before parsing:", {
          hasCreature: !!character.raw.creature,
          hasVariables: !!character.raw.variables,
          hasProperties: !!character.raw.properties,
          keys: Object.keys(character.raw),
          rawSample: character.raw
        });
        parsedData = parseForRollCloud(character.raw);
        console.log("Parsed data:", parsedData);
      }
      const htmlPath = browserAPI4.runtime.getURL("src/popup/adapters/rollcloud/popup.html");
      const response = await fetch(htmlPath);
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const mainContent = doc.querySelector("main");
      const wrapper = document.createElement("div");
      wrapper.className = "rollcloud-adapter-scope";
      wrapper.innerHTML = mainContent ? mainContent.innerHTML : doc.body.innerHTML;
      containerEl.innerHTML = "";
      containerEl.appendChild(wrapper);
      const cssPath = browserAPI4.runtime.getURL("src/popup/adapters/rollcloud/popup.css");
      const cssResponse = await fetch(cssPath);
      let css = await cssResponse.text();
      css = css.replace(/(^|\})\s*([^{}@]+)\s*\{/gm, (match, closer, selector) => {
        if (selector.trim().startsWith("@"))
          return match;
        const scopedSelector = selector.split(",").map((s) => `.rollcloud-adapter-scope ${s.trim()}`).join(", ");
        return `${closer} ${scopedSelector} {`;
      });
      const style = document.createElement("style");
      style.textContent = css;
      containerEl.appendChild(style);
      await initializeRollCloudUI(wrapper, characters2);
      if (parsedData && character) {
        const characterInfo = wrapper.querySelector("#characterInfo");
        const statusSection = wrapper.querySelector("#status");
        if (characterInfo) {
          characterInfo.classList.remove("hidden");
          const nameEl = characterInfo.querySelector("#charName");
          const levelEl = characterInfo.querySelector("#charLevel");
          const classEl = characterInfo.querySelector("#charClass");
          const raceEl = characterInfo.querySelector("#charRace");
          if (nameEl)
            nameEl.textContent = character.name || "-";
          if (levelEl)
            levelEl.textContent = character.preview?.level || "-";
          if (classEl)
            classEl.textContent = character.preview?.class || "-";
          if (raceEl)
            raceEl.textContent = character.preview?.race || "Unknown";
          const pushBtn = characterInfo.querySelector("#pushToVttBtn");
          if (pushBtn) {
            pushBtn.addEventListener("click", async () => {
              const originalText = pushBtn.innerHTML;
              try {
                pushBtn.disabled = true;
                pushBtn.innerHTML = "\u23F3 Pushing...";
                console.log("\u{1F4BE} Storing Roll20 parsed data to database...");
                const SUPABASE_URL2 = "https://luiesmfjdcmpywavvfqm.supabase.co";
                const SUPABASE_ANON_KEY2 = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1aWVzbWZqZGNtcHl3YXZ2ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4ODYxNDksImV4cCI6MjA4NTQ2MjE0OX0.oqjHFf2HhCLcanh0HVryoQH7iSV7E9dHHZJdYehxZ0U";
                try {
                  const updateResponse = await fetch(
                    `${SUPABASE_URL2}/rest/v1/clouds_characters?dicecloud_character_id=eq.${character.id}`,
                    {
                      method: "PATCH",
                      headers: {
                        "apikey": SUPABASE_ANON_KEY2,
                        "Authorization": `Bearer ${SUPABASE_ANON_KEY2}`,
                        "Content-Type": "application/json",
                        "Prefer": "return=representation"
                      },
                      body: JSON.stringify({
                        roll20_data: parsedData,
                        updated_at: (/* @__PURE__ */ new Date()).toISOString()
                      })
                    }
                  );
                  if (updateResponse.ok) {
                    console.log("\u2705 Roll20 data stored in database");
                  } else {
                    console.warn("\u26A0\uFE0F Failed to store Roll20 data:", await updateResponse.text());
                  }
                } catch (dbError) {
                  console.warn("\u26A0\uFE0F Database update failed (non-fatal):", dbError);
                }
                console.log("\u{1F4BE} Updating local storage with parsed data...");
                try {
                  const dataToStore = {
                    ...parsedData,
                    id: character.id,
                    dicecloud_character_id: character.id
                  };
                  await browserAPI4.runtime.sendMessage({
                    action: "storeCharacterData",
                    data: dataToStore,
                    slotId: character.slotId || "slot-1"
                  });
                  console.log("\u2705 Local storage updated with parsed Roll20 data");
                  browserAPI4.runtime.sendMessage({
                    action: "dataSynced",
                    characterName: dataToStore.name || "Character"
                  }).catch(() => {
                    console.log("\u2139\uFE0F No popup open to notify (normal)");
                  });
                } catch (storageError) {
                  console.warn("\u26A0\uFE0F Local storage update failed (non-fatal):", storageError);
                }
                const tabs = await browserAPI4.tabs.query({ url: "*://app.roll20.net/*" });
                if (tabs.length === 0) {
                  throw new Error("No Roll20 tab found. Please open Roll20 first.");
                }
                await browserAPI4.tabs.sendMessage(tabs[0].id, {
                  type: "PUSH_CHARACTER",
                  data: parsedData
                });
                pushBtn.innerHTML = "\u2705 Pushed!";
                setTimeout(() => {
                  pushBtn.innerHTML = originalText;
                  pushBtn.disabled = false;
                }, 2e3);
              } catch (error) {
                console.error("Error pushing to Roll20:", error);
                pushBtn.innerHTML = "\u274C Failed";
                alert(`Failed to push to Roll20: ${error.message}`);
                setTimeout(() => {
                  pushBtn.innerHTML = originalText;
                  pushBtn.disabled = false;
                }, 2e3);
              }
            });
          }
        }
        if (statusSection) {
          const statusIcon = statusSection.querySelector("#statusIcon");
          const statusText = statusSection.querySelector("#statusText");
          if (statusIcon)
            statusIcon.textContent = "\u2705";
          if (statusText)
            statusText.textContent = `Character synced: ${character.name}`;
        }
      }
      browserAPI4.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === "dataSynced") {
          console.log("\u{1F4E5} RollCloud adapter received data sync notification:", message.characterName);
          init3(containerEl);
        }
      });
    } catch (error) {
      console.error("Failed to load RollCloud UI:", error);
      containerEl.innerHTML = `
      <div class="error">
        <strong>Failed to load RollCloud</strong>
        <p>${error.message}</p>
      </div>
    `;
    }
  }
  async function initializeRollCloudUI(wrapper, characters2) {
    try {
      const loginPrompt = wrapper.querySelector("#loginPrompt");
      const syncBox = wrapper.querySelector("#syncBox");
      const pushedCharactersSection = wrapper.querySelector("#pushedCharactersSection");
      const pushToRoll20Btn = wrapper.querySelector("#pushToRoll20Btn");
      const openAuthModalBtn = wrapper.querySelector("#openAuthModalBtn");
      const result = await browserAPI4.storage.local.get(["diceCloudToken", "dicecloud_auth_token", "activeCharacterId"]);
      const hasDiceCloudToken = !!(result.diceCloudToken || result.dicecloud_auth_token);
      const token = result.diceCloudToken || result.dicecloud_auth_token;
      console.log("RollCloud auth check:", { hasDiceCloudToken, hasActiveChar: !!result.activeCharacterId });
      if (!hasDiceCloudToken) {
        if (loginPrompt)
          loginPrompt.classList.remove("hidden");
        if (syncBox)
          syncBox.classList.add("hidden");
        if (pushedCharactersSection)
          pushedCharactersSection.classList.add("hidden");
        if (openAuthModalBtn) {
          openAuthModalBtn.addEventListener("click", () => {
            browserAPI4.tabs.create({ url: "https://dicecloud.com" });
          });
        }
        return;
      }
      if (loginPrompt)
        loginPrompt.classList.add("hidden");
      if (characters2.length > 0) {
        if (syncBox)
          syncBox.classList.remove("hidden");
      } else {
        if (syncBox)
          syncBox.classList.add("hidden");
      }
      if (pushedCharactersSection)
        pushedCharactersSection.classList.remove("hidden");
      if (result.activeCharacterId && characters2.length > 0) {
        const activeChar = characters2.find((c) => c.id === result.activeCharacterId) || characters2[0];
        const syncCharName = wrapper.querySelector("#syncCharName");
        const syncCharLevel = wrapper.querySelector("#syncCharLevel");
        const syncCharClass = wrapper.querySelector("#syncCharClass");
        const syncCharRace = wrapper.querySelector("#syncCharRace");
        let displayName = activeChar.name || "Unknown";
        let displayLevel = "?";
        let displayClass = "No Class";
        let displayRace = "Unknown";
        if (activeChar.raw) {
          try {
            const fakeApiResponse = {
              creatures: [activeChar.raw.creature || {}],
              creatureVariables: [activeChar.raw.variables || {}],
              creatureProperties: activeChar.raw.properties || []
            };
            const parsed = parseCharacterData(fakeApiResponse, activeChar.id);
            displayName = parsed.name || displayName;
            displayLevel = parsed.preview?.level || parsed.level || displayLevel;
            displayClass = parsed.preview?.class || parsed.class || displayClass;
            displayRace = parsed.preview?.race || parsed.race || displayRace;
          } catch (parseError) {
            console.warn("Failed to re-parse character for sync box:", parseError);
            displayLevel = activeChar.level || displayLevel;
            displayClass = activeChar.class || displayClass;
            displayRace = activeChar.race || displayRace;
          }
        } else {
          displayLevel = activeChar.level || displayLevel;
          displayClass = activeChar.class || displayClass;
          displayRace = activeChar.race || displayRace;
        }
        if (syncCharName)
          syncCharName.textContent = displayName;
        if (syncCharLevel)
          syncCharLevel.textContent = `Lvl ${displayLevel}`;
        if (syncCharClass)
          syncCharClass.textContent = displayClass;
        if (syncCharRace)
          syncCharRace.textContent = displayRace;
      }
      if (pushToRoll20Btn) {
        pushToRoll20Btn.addEventListener("click", () => handlePushToRoll20(token, result.activeCharacterId, wrapper, characters2));
      }
      displaySyncedCharacters(wrapper, characters2);
    } catch (error) {
      console.error("Error initializing RollCloud UI:", error);
    }
  }
  async function handlePushToRoll20(token, activeCharacterId, wrapper, allCharacters) {
    const pushBtn = wrapper.querySelector("#pushToRoll20Btn");
    if (!pushBtn)
      return;
    const originalText = pushBtn.textContent;
    try {
      pushBtn.disabled = true;
      pushBtn.textContent = "\u23F3 Syncing...";
      if (!activeCharacterId) {
        throw new Error("No active character selected");
      }
      const response = await fetch(`https://dicecloud.com/api/creature/${activeCharacterId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!response.ok)
        throw new Error(`Failed to fetch character: ${response.status}`);
      const charData = await response.json();
      const rawData = {
        creature: charData.creatures?.[0] || {},
        variables: charData.creatureVariables?.[0] || {},
        properties: charData.creatureProperties || []
      };
      const parsedChar = parseCharacterData(charData, activeCharacterId);
      const characterEntry = {
        id: activeCharacterId,
        name: parsedChar.name || "Unknown",
        level: parsedChar.preview?.level || parsedChar.level || "?",
        class: parsedChar.preview?.class || parsedChar.class || "No Class",
        race: parsedChar.preview?.race || parsedChar.race || "Unknown",
        lastSynced: (/* @__PURE__ */ new Date()).toISOString(),
        raw: rawData,
        rollcloud: parseForRollCloud(rawData, activeCharacterId),
        owlcloud: null,
        // Can be parsed later by OwlCloud adapter
        foundcloud: null
        // Can be parsed later by FoundCloud adapter
      };
      await browserAPI4.runtime.sendMessage({
        action: "storeCharacterData",
        data: characterEntry,
        slotId: `slot-${allCharacters.length + 1}`
      });
      const existingIndex = allCharacters.findIndex((c) => c.id === activeCharacterId);
      if (existingIndex >= 0) {
        allCharacters[existingIndex] = characterEntry;
      } else {
        allCharacters.push(characterEntry);
      }
      pushBtn.textContent = "\u2713 Synced!";
      pushBtn.style.background = "linear-gradient(135deg, #28a745 0%, #1e7e34 100%)";
      await browserAPI4.storage.local.remove("activeCharacterId");
      const syncBox = wrapper.querySelector("#syncBox");
      if (syncBox)
        syncBox.classList.add("hidden");
      displaySyncedCharacters(wrapper, allCharacters);
      setTimeout(() => {
        pushBtn.textContent = originalText;
        pushBtn.style.background = "";
        pushBtn.disabled = false;
      }, 2e3);
    } catch (error) {
      console.error("Sync current error:", error);
      pushBtn.textContent = "\u274C Failed";
      alert(`Sync failed: ${error.message}`);
      setTimeout(() => {
        pushBtn.textContent = originalText;
        pushBtn.disabled = false;
      }, 2e3);
    }
  }
  function displaySyncedCharacters(wrapper, characters2) {
    const pushedCharactersList = wrapper.querySelector("#pushedCharactersList");
    const noPushedCharacters = wrapper.querySelector("#noPushedCharacters");
    if (!pushedCharactersList || !noPushedCharacters)
      return;
    if (characters2.length === 0) {
      pushedCharactersList.innerHTML = "";
      noPushedCharacters.classList.remove("hidden");
      return;
    }
    noPushedCharacters.classList.add("hidden");
    pushedCharactersList.innerHTML = "";
    characters2.forEach((char) => {
      const card = document.createElement("div");
      card.style.cssText = "position: relative; padding: 16px; background: #1a1a1a; border-radius: 8px; border: 1px solid #2a2a2a;";
      const name = char.name || "Unknown";
      const level = char.level || "?";
      const charClass = char.class || "No Class";
      const race = char.race || "Unknown";
      card.innerHTML = `
      <button class="delete-char-btn" data-char-id="${char.id}" style="position: absolute; top: 8px; right: 8px; background: #dc3545; border: 1px solid #c82333; color: white; border-radius: 4px; width: 28px; height: 28px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 18px; line-height: 1;">\xD7</button>
      <h4 style="color: #16a75a; margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">${name}</h4>
      <div style="display: flex; gap: 8px; font-size: 13px; color: #b0b0b0;">
        <span>Lvl ${level}</span>
        <span>\u2022</span>
        <span>${charClass}</span>
        <span>\u2022</span>
        <span>${race}</span>
      </div>
    `;
      const deleteBtn = card.querySelector(".delete-char-btn");
      if (deleteBtn) {
        deleteBtn.addEventListener("click", async (e) => {
          e.stopPropagation();
          if (confirm(`Delete ${name}?`)) {
            const updatedChars = characters2.filter((c) => c.id !== char.id);
            await browserAPI4.storage.local.set({ carmaclouds_characters: updatedChars });
            displaySyncedCharacters(wrapper, updatedChars);
          }
        });
      }
      pushedCharactersList.appendChild(card);
    });
  }
  var browserAPI4;
  var init_adapter3 = __esm({
    "src/popup/adapters/rollcloud/adapter.js"() {
      init_dicecloud_extraction();
      browserAPI4 = typeof browser !== "undefined" && browser.runtime ? browser : chrome;
    }
  });

  // import("./adapters/**/*/adapter.js") in src/popup/popup.js
  var globImport_adapters_adapter_js = __glob({
    "./adapters/foundcloud/adapter.js": () => Promise.resolve().then(() => (init_adapter(), adapter_exports)),
    "./adapters/owlcloud/adapter.js": () => Promise.resolve().then(() => (init_adapter2(), adapter_exports2)),
    "./adapters/rollcloud/adapter.js": () => Promise.resolve().then(() => (init_adapter3(), adapter_exports3))
  });

  // src/popup/popup.js
  var browserAPI5 = typeof browser !== "undefined" && browser.runtime ? browser : chrome;
  var loadedAdapters = {
    rollcloud: null,
    owlcloud: null,
    foundcloud: null
  };
  async function getSettings() {
    const result = await browserAPI5.storage.local.get("carmaclouds_settings") || {};
    return result.carmaclouds_settings || {
      lastActiveTab: "rollcloud",
      enabledVTTs: ["rollcloud", "owlcloud", "foundcloud"]
    };
  }
  async function saveSettings(settings) {
    await browserAPI5.storage.local.set({ carmaclouds_settings: settings });
  }
  function showLoginRequired(contentEl, tabName) {
    const tabNames = {
      rollcloud: "RollCloud",
      owlcloud: "OwlCloud",
      foundcloud: "FoundCloud"
    };
    contentEl.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 20px; text-align: center;">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#16a75a" stroke-width="2" style="margin-bottom: 20px;">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
      </svg>
      <h2 style="color: #e0e0e0; margin: 0 0 10px 0; font-size: 20px;">DiceCloud Login Required</h2>
      <p style="color: #b0b0b0; margin: 0 0 20px 0; font-size: 14px; line-height: 1.5;">
        ${tabNames[tabName]} needs access to your DiceCloud account to sync characters.<br>
        Click the <strong style="color: #16a75a;">Login</strong> button in the header to get started.
      </p>
      <button
        id="open-auth-from-tab"
        style="background: #16a75a; color: #000; font-weight: 700; border: none; padding: 12px 24px; border-radius: 6px; font-size: 14px; cursor: pointer; transition: background 0.2s ease;"
      >
        \u{1F510} Open Login Modal
      </button>
    </div>
  `;
    const btn = contentEl.querySelector("#open-auth-from-tab");
    if (btn) {
      btn.addEventListener("click", openAuthModal);
      btn.addEventListener("mouseover", () => {
        btn.style.background = "#1bc76b";
      });
      btn.addEventListener("mouseout", () => {
        btn.style.background = "#16a75a";
      });
    }
  }
  async function switchTab(tabName) {
    console.log(`Switching to ${tabName} tab`);
    document.querySelectorAll(".tab-button").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.tab === tabName);
    });
    document.querySelectorAll(".tab-pane").forEach((pane) => {
      pane.classList.toggle("active", pane.id === `${tabName}-content`);
    });
    const contentEl = document.getElementById(`${tabName}-content`);
    const token = await getAuthToken();
    if (!token) {
      showLoginRequired(contentEl, tabName);
      loadedAdapters[tabName] = null;
    } else {
      if (!loadedAdapters[tabName]) {
        console.log(`Loading ${tabName} adapter for the first time...`);
        try {
          const module = await globImport_adapters_adapter_js(`./adapters/${tabName}/adapter.js`);
          loadedAdapters[tabName] = module;
          if (module.init && typeof module.init === "function") {
            await module.init(contentEl);
          }
        } catch (error) {
          console.error(`Failed to load ${tabName} adapter:`, error);
          contentEl.innerHTML = `
          <div class="error">
            <strong>Failed to load ${tabName}</strong>
            <p>${error.message}</p>
          </div>
        `;
        }
      }
    }
    const settings = await getSettings();
    settings.lastActiveTab = tabName;
    await saveSettings(settings);
  }
  function openSettingsModal() {
    const modal = document.getElementById("settings-modal");
    modal.classList.add("active");
  }
  function closeSettingsModal() {
    const modal = document.getElementById("settings-modal");
    modal.classList.remove("active");
  }
  async function handleClearLocalData() {
    const confirmed = confirm(
      "\u26A0\uFE0F Clear Local Data?\n\nThis will delete all character data stored locally in this browser.\nCloud data will NOT be affected.\n\nAre you sure you want to continue?"
    );
    if (!confirmed)
      return;
    try {
      await browserAPI5.storage.local.remove(["carmaclouds_characters", "characterProfiles", "activeCharacterId"]);
      alert("\u2705 Local data cleared successfully!\n\nThe popup will now reload.");
      window.location.reload();
    } catch (error) {
      console.error("Error clearing local data:", error);
      alert("\u274C Failed to clear local data: " + error.message);
    }
  }
  async function handleClearCloudData() {
    const confirmed = confirm(
      "\u26A0\uFE0F Clear Cloud Data?\n\nThis will delete ALL character data from the cloud (Supabase).\nLocal data will NOT be affected.\n\nThis action CANNOT be undone!\n\nAre you sure you want to continue?"
    );
    if (!confirmed)
      return;
    const doubleConfirm = confirm(
      "\u{1F6A8} FINAL WARNING \u{1F6A8}\n\nYou are about to permanently delete all cloud character data.\n\nType your confirmation by clicking OK."
    );
    if (!doubleConfirm)
      return;
    try {
      const response = await browserAPI5.runtime.sendMessage({
        action: "clearAllCloudData"
      });
      if (response && response.success) {
        alert("\u2705 Cloud data cleared successfully!\n\n" + (response.message || ""));
      } else {
        throw new Error(response?.error || "Unknown error");
      }
    } catch (error) {
      console.error("Error clearing cloud data:", error);
      alert("\u274C Failed to clear cloud data: " + error.message);
    }
  }
  function openAuthModal() {
    const modal = document.getElementById("dicecloud-auth-modal");
    modal.classList.add("active");
    updateAuthView();
  }
  function closeAuthModal() {
    const modal = document.getElementById("dicecloud-auth-modal");
    modal.classList.remove("active");
  }
  async function getAuthToken() {
    const result = await browserAPI5.storage.local.get(["dicecloud_auth_token", "diceCloudToken"]);
    return result?.dicecloud_auth_token || result?.diceCloudToken || null;
  }
  async function saveAuthToken(token, userId = null, username = null) {
    console.log("\u{1F4BE} Saving auth token with userId:", userId || "not provided", "username:", username || "not provided");
    const storageData = { dicecloud_auth_token: token };
    if (userId) {
      storageData.diceCloudUserId = userId;
    }
    if (username) {
      storageData.username = username;
    }
    await browserAPI5.storage.local.set(storageData);
    await updateAuthStatus();
    await updateAuthView();
    try {
      if (typeof SupabaseTokenManager !== "undefined") {
        const supabaseManager = new SupabaseTokenManager();
        const result = await browserAPI5.storage.local.get(["username", "diceCloudUserId"]);
        console.log("\u{1F4E4} Syncing to database with data:", {
          hasToken: !!token,
          userId: userId || result.diceCloudUserId || "none",
          username: username || result.username || "none"
        });
        const dbResult = await supabaseManager.storeToken({
          token,
          userId: userId || result.diceCloudUserId,
          tokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1e3).toISOString(),
          // 24 hours from now
          username: username || result.username || "DiceCloud User"
        });
        if (dbResult.success) {
          console.log("\u2705 Auth token synced to database");
        } else {
          console.log("\u26A0\uFE0F Failed to sync auth token to database:", dbResult.error);
        }
      }
    } catch (dbError) {
      console.log("\u26A0\uFE0F Database sync not available:", dbError);
    }
    await reloadCurrentTab();
  }
  async function clearAuthToken() {
    await browserAPI5.storage.local.remove("dicecloud_auth_token");
    updateAuthStatus();
    updateAuthView();
    await reloadCurrentTab();
  }
  async function reloadCurrentTab() {
    const activeTab = document.querySelector(".tab-button.active");
    if (activeTab) {
      const tabName = activeTab.dataset.tab;
      loadedAdapters[tabName] = null;
      await switchTab(tabName);
    }
  }
  async function updateAuthStatus() {
    const token = await getAuthToken();
    const statusText = document.getElementById("auth-status-text");
    if (token) {
      statusText.textContent = "Logged In";
      statusText.style.color = "#000000";
    } else {
      statusText.textContent = "Login";
      statusText.style.color = "white";
    }
  }
  async function updateAuthView() {
    const token = await getAuthToken();
    const loginView = document.getElementById("auth-login-view");
    const loggedInView = document.getElementById("auth-logged-in-view");
    if (token) {
      loginView.classList.add("hidden");
      loggedInView.classList.remove("hidden");
    } else {
      loginView.classList.remove("hidden");
      loggedInView.classList.add("hidden");
    }
  }
  async function autoConnect() {
    const btn = document.getElementById("autoConnectBtn");
    const errorDiv = document.getElementById("loginError");
    try {
      btn.disabled = true;
      btn.textContent = "\u23F3 Checking...";
      errorDiv.classList.add("hidden");
      const tabs = await browserAPI5.tabs.query({ url: "*://*.dicecloud.com/*" });
      if (!tabs || tabs.length === 0) {
        errorDiv.innerHTML = '<div style="background: #0d4a30; color: #16a75a; padding: 12px; border-radius: 6px; border: 1px solid #16a75a;"><strong>Navigate to DiceCloud First</strong><br>Open <a href="https://dicecloud.com" target="_blank" style="color: #1bc76b; text-decoration: underline;">dicecloud.com</a> in a tab, log in, then click this button to connect.</div>';
        errorDiv.classList.remove("hidden");
        btn.disabled = false;
        btn.textContent = "\u{1F510} Connect with DiceCloud";
        return;
      }
      console.log("\u{1F50D} Requesting auth data from DiceCloud content script...");
      console.log("\u{1F4CD} Tab URL:", tabs[0].url);
      console.log("\u{1F4CD} Tab ID:", tabs[0].id);
      let authData = null;
      try {
        await new Promise((resolve) => setTimeout(resolve, 100));
        authData = await browserAPI5.tabs.sendMessage(tabs[0].id, { action: "getAuthData" });
        console.log("\u2705 Auth data received from content script:", authData);
      } catch (messageError) {
        console.warn("\u26A0\uFE0F Could not get auth data from content script:", messageError);
        console.warn("\u26A0\uFE0F Error details:", messageError.message, messageError.stack);
        console.log("\u{1F504} Trying script injection fallback...");
        try {
          console.log("[DIAGNOSTIC] Attempting script injection into tab:", tabs[0].id, "URL:", tabs[0].url);
          let results;
          if (typeof chrome !== "undefined" && browserAPI5.scripting) {
            console.log("[DIAGNOSTIC] Using Chrome scripting API");
            results = await browserAPI5.scripting.executeScript({
              target: { tabId: tabs[0].id },
              func: () => {
                console.log("[DIAGNOSTIC] Injected script running on page");
                let meteorUserId = null;
                let meteorLoginToken = null;
                try {
                  meteorUserId = localStorage.getItem("Meteor.userId");
                  meteorLoginToken = localStorage.getItem("Meteor.loginToken");
                  console.log("[DIAGNOSTIC] localStorage accessible:", { hasUserId: !!meteorUserId, hasToken: !!meteorLoginToken });
                } catch (e) {
                  console.log("[DIAGNOSTIC] localStorage access error:", e.message);
                }
                const authData2 = {
                  localStorage: {},
                  sessionStorage: {},
                  meteor: null,
                  authToken: null,
                  _diagnostic: {
                    localStorageAccessible: true,
                    localStorageError: null,
                    windowMeteorExists: typeof window.Meteor !== "undefined",
                    localStorageKeyCount: 0
                  }
                };
                try {
                  authData2._diagnostic.localStorageKeyCount = localStorage.length;
                  if (localStorage.length > 0) {
                    authData2._diagnostic.sampleKey = localStorage.key(0);
                  }
                } catch (e) {
                  authData2._diagnostic.localStorageAccessible = false;
                  authData2._diagnostic.localStorageError = e.message;
                }
                if (meteorUserId || meteorLoginToken) {
                  authData2.meteor = {
                    userId: meteorUserId,
                    loginToken: meteorLoginToken
                  };
                  if (window.Meteor && window.Meteor.user) {
                    try {
                      const user = window.Meteor.user();
                      if (user) {
                        authData2.meteor.username = user.username || user.emails?.[0]?.address || user.profile?.username || user.profile?.name || null;
                      }
                    } catch (e) {
                    }
                  }
                }
                if (window.authToken)
                  authData2.authToken = window.authToken;
                if (window.token)
                  authData2.authToken = window.token;
                return authData2;
              }
            });
            console.log("[DIAGNOSTIC] Script injection completed, results:", results);
          } else if (typeof browser !== "undefined" && browser.tabs) {
            console.log("[DIAGNOSTIC] Using Firefox executeScript API");
            results = await browser.tabs.executeScript(tabs[0].id, {
              code: `
              (() => {
                // Directly read Meteor auth tokens
                const meteorUserId = localStorage.getItem('Meteor.userId');
                const meteorLoginToken = localStorage.getItem('Meteor.loginToken');
                
                const authData = {
                  localStorage: {},
                  sessionStorage: {},
                  meteor: null,
                  authToken: null,
                  _diagnostic: {
                    localStorageAccessible: true,
                    localStorageKeyCount: localStorage.length
                  }
                };

                if (meteorUserId || meteorLoginToken) {
                  authData.meteor = {
                    userId: meteorUserId,
                    loginToken: meteorLoginToken
                  };
                }
                
                return authData;
              })();
            `
            });
          } else {
            throw new Error("No scripting API available");
          }
          authData = typeof chrome !== "undefined" && browserAPI5.scripting ? results[0]?.result : results[0];
          console.log("Auth data from script injection:", authData);
        } catch (scriptError) {
          console.warn("\u274C Script injection also failed:", scriptError);
        }
      }
      let token = null;
      let userId = null;
      let username = null;
      if (authData?.meteor?.loginToken) {
        token = authData.meteor.loginToken;
        userId = authData.meteor.userId;
        username = authData.meteor.username;
      } else if (authData?.authToken) {
        token = authData.authToken;
      } else {
        for (const [key, value] of Object.entries(authData?.localStorage || {})) {
          if (value && value.length > 10) {
            token = value;
            break;
          }
        }
      }
      console.log("\u{1F511} Extracted from DiceCloud:", {
        hasToken: !!token,
        userId: userId || "not found",
        username: username || "not found",
        authData: authData ? {
          hasMeteor: !!authData.meteor,
          hasAuthToken: !!authData.authToken,
          diagnostic: authData._diagnostic
        } : "null"
      });
      if (token) {
        await saveAuthToken(token, userId, username);
        errorDiv.classList.add("hidden");
        closeAuthModal();
        return;
      }
      const cookies = await browserAPI5.cookies.getAll({ domain: ".dicecloud.com" });
      console.log("Available DiceCloud cookies:", cookies.map((c) => ({ name: c.name, domain: c.domain, value: c.value ? "***" : "empty" })));
      const authCookie = cookies.find(
        (c) => c.name === "dicecloud_auth" || c.name === "meteor_login_token" || c.name === "authToken" || c.name === "loginToken" || c.name === "userId" || c.name === "token" || c.name === "x_mtok" || // Meteor token cookie used by DiceCloud
        c.name.includes("auth") || c.name.includes("token")
      );
      if (authCookie && authCookie.value) {
        await saveAuthToken(authCookie.value);
        errorDiv.classList.add("hidden");
        closeAuthModal();
      } else {
        const cookieNames = cookies.map((c) => c.name).join(", ");
        const cookieCount = cookies.length;
        let diagnosticInfo = "";
        if (authData && authData._diagnostic) {
          diagnosticInfo = `
          <br><br><small style="color: #888;">
          Diagnostics:<br>
          - localStorage accessible: ${authData._diagnostic.localStorageAccessible}<br>
          - localStorage keys found: ${authData._diagnostic.localStorageKeyCount}<br>
          - window.Meteor exists: ${authData._diagnostic.windowMeteorExists}<br>
          - localStorage error: ${authData._diagnostic.localStorageError || "none"}
          </small>
        `;
        }
        errorDiv.innerHTML = `<div style="color: #ff6b6b;">
        <strong>No login detected.</strong><br>
        Found ${cookieCount} cookies: ${cookieNames || "none"}.<br>
        Make sure you're logged in to DiceCloud in your open tab.<br><br>
        <button onclick="document.getElementById('manualTokenSection').style.display='block'" style="background: #4a9eff; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
          Enter Token Manually
        </button>
        <div id="manualTokenSection" style="display: none; margin-top: 10px;">
          <input type="text" id="manualTokenInput" placeholder="Paste your Meteor.loginToken here" style="width: 100%; padding: 8px; margin-bottom: 8px; background: #2a2a2a; color: white; border: 1px solid #444; border-radius: 4px;">
          <button onclick="window.saveManualToken()" style="background: #16a75a; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Save Token</button>
        </div>
        ${diagnosticInfo}
      </div>`;
        window.saveManualToken = async () => {
          const manualToken = document.getElementById("manualTokenInput").value.trim();
          if (manualToken) {
            await saveAuthToken(manualToken);
            errorDiv.classList.add("hidden");
            closeAuthModal();
          }
        };
        errorDiv.classList.remove("hidden");
        btn.disabled = false;
        btn.textContent = "\u{1F510} Connect with DiceCloud";
      }
    } catch (error) {
      console.error("Auto-connect error:", error);
      errorDiv.innerHTML = `<div style="color: #ff6b6b;">Error: ${error.message}</div>`;
      errorDiv.classList.remove("hidden");
      btn.disabled = false;
      btn.textContent = "\u{1F510} Connect with DiceCloud";
    }
  }
  async function manualLogin(username, password) {
    const btn = document.getElementById("usernameLoginBtn");
    const errorDiv = document.getElementById("loginError");
    try {
      btn.disabled = true;
      btn.textContent = "\u23F3 Logging in...";
      errorDiv.classList.add("hidden");
      const endpoints = [
        "https://dicecloud.com/api/login",
        "https://v2.dicecloud.com/api/login",
        "https://app.dicecloud.com/api/login",
        "https://dicecloud.com/login",
        "https://v2.dicecloud.com/login"
      ];
      let lastError = null;
      let success = false;
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying login endpoint: ${endpoint}`);
          const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
            mode: "cors",
            credentials: "omit"
          });
          console.log(`Response status: ${response.status}`);
          if (response.ok) {
            const data = await response.json();
            console.log(`Success with ${endpoint}:`, data);
            if (data.token || data.authToken || data.loginToken) {
              const token = data.token || data.authToken || data.loginToken;
              await saveAuthToken(token);
              errorDiv.classList.add("hidden");
              closeAuthModal();
              success = true;
              break;
            }
          } else {
            console.warn(`Failed with ${endpoint}: ${response.status} ${response.statusText}`);
          }
        } catch (endpointError) {
          console.warn(`Failed with ${endpoint}:`, endpointError.message);
          lastError = endpointError;
        }
      }
      if (!success) {
        throw new Error(`Login failed. Tried ${endpoints.length} endpoints. Last error: ${lastError?.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Manual login error:", error);
      errorDiv.innerHTML = `<div style="color: #ff6b6b;">${error.message}</div>`;
      errorDiv.classList.remove("hidden");
    } finally {
      btn.disabled = false;
      btn.textContent = "\u{1F510} Login to DiceCloud";
    }
  }
  async function logout() {
    await clearAuthToken();
    closeAuthModal();
  }
  async function checkAndUpdateAuthToken() {
    try {
      if (typeof SupabaseTokenManager === "undefined") {
        console.log("\u26A0\uFE0F SupabaseTokenManager not available, skipping auth token check");
        return;
      }
      const supabaseManager = new SupabaseTokenManager();
      const result = await browserAPI5.storage.local.get(["diceCloudToken", "dicecloud_auth_token", "username", "tokenExpires", "diceCloudUserId", "authId"]);
      console.log("\u{1F50D} Storage contents:", {
        diceCloudToken: result.diceCloudToken ? "***found***" : "NOT FOUND",
        dicecloud_auth_token: result.dicecloud_auth_token ? "***found***" : "NOT FOUND",
        username: result.username,
        diceCloudUserId: result.diceCloudUserId
      });
      const token = result.diceCloudToken || result.dicecloud_auth_token;
      if (!token) {
        console.log("\u26A0\uFE0F No auth token found, skipping auth token check");
        return;
      }
      console.log("\u{1F50D} Checking auth token validity...");
      console.log("\u{1F511} Using token:", token ? "***found***" : "NOT FOUND");
      try {
        const syncResult = await supabaseManager.storeToken({
          token,
          userId: result.diceCloudUserId || result.username,
          tokenExpires: result.tokenExpires || new Date(Date.now() + 24 * 60 * 60 * 1e3).toISOString(),
          username: result.username || "DiceCloud User"
        });
        if (syncResult.success) {
          console.log("\u2705 Auth token synced to database");
        } else {
          console.log("\u26A0\uFE0F Failed to sync auth token to database:", syncResult.error);
        }
      } catch (syncError) {
        console.log("\u26A0\uFE0F Database sync failed:", syncError);
      }
      const sessionCheck = await supabaseManager.checkSessionValidity();
      if (!sessionCheck.valid) {
        console.log("\u26A0\uFE0F Auth token session is invalid, attempting to refresh...");
        const refreshResult = await supabaseManager.refreshToken();
        if (refreshResult.success) {
          console.log("\u2705 Auth token refreshed successfully");
          await browserAPI5.storage.local.set({
            diceCloudToken: refreshResult.token,
            tokenExpires: refreshResult.expires,
            diceCloudUserId: refreshResult.userId
          });
          try {
            await supabaseManager.storeToken({
              token: refreshResult.token,
              userId: refreshResult.userId,
              expires: refreshResult.expires,
              lastChecked: (/* @__PURE__ */ new Date()).toISOString()
            });
            console.log("\u2705 Refreshed token synced to database");
          } catch (refreshSyncError) {
            console.log("\u26A0\uFE0F Failed to sync refreshed token:", refreshSyncError);
          }
          await updateAuthStatus();
          showNotification("\u2705 Authentication refreshed", "success");
        } else {
          console.log("\u274C Failed to refresh auth token");
          showNotification("\u274C Authentication expired. Please log in again.", "error");
        }
      } else {
        console.log("\u2705 Auth token is valid and synced");
      }
    } catch (error) {
      console.error("\u274C Error checking auth token:", error);
    }
  }
  function updateSupabaseAuthUI(user) {
    console.log("\u{1F504} Updating Supabase auth UI, user:", user);
    const loginView = document.getElementById("supabase-login-view");
    const loggedInView = document.getElementById("supabase-logged-in-view");
    const emailDisplay = document.getElementById("supabase-user-email");
    if (user) {
      console.log("\u2705 User signed in, showing logged in view");
      loginView.classList.add("hidden");
      loggedInView.classList.remove("hidden");
      if (emailDisplay) {
        emailDisplay.textContent = user.email;
      }
    } else {
      console.log("\u274C No user, showing login view");
      loginView.classList.remove("hidden");
      loggedInView.classList.add("hidden");
    }
  }
  async function init4() {
    console.log("Initializing CarmaClouds popup...");
    const settings = await getSettings();
    const lastTab = settings.lastActiveTab || "rollcloud";
    document.querySelectorAll(".tab-button").forEach((btn) => {
      btn.addEventListener("click", () => {
        const tabName = btn.dataset.tab;
        if (tabName) {
          switchTab(tabName);
        } else {
          console.warn("Tab button missing data-tab attribute:", btn);
        }
      });
    });
    document.getElementById("settings-button").addEventListener("click", openSettingsModal);
    document.getElementById("close-settings").addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeSettingsModal();
    });
    document.getElementById("clear-local-data-btn").addEventListener("click", handleClearLocalData);
    document.getElementById("clear-cloud-data-btn").addEventListener("click", handleClearCloudData);
    document.getElementById("refresh-button").addEventListener("click", async () => {
      const activeTab = document.querySelector(".tab-button.active")?.dataset.tab;
      if (activeTab) {
        await checkAndUpdateAuthToken();
        loadedAdapters[activeTab] = null;
        await switchTab(activeTab);
      }
    });
    document.getElementById("settings-modal").addEventListener("click", (e) => {
      if (e.target.id === "settings-modal") {
        closeSettingsModal();
      }
    });
    document.getElementById("dicecloud-auth-button").addEventListener("click", openAuthModal);
    document.getElementById("close-dicecloud-auth").addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeAuthModal();
    });
    document.getElementById("dicecloud-auth-modal").addEventListener("click", (e) => {
      if (e.target.id === "dicecloud-auth-modal") {
        closeAuthModal();
      }
    });
    document.getElementById("autoConnectBtn").addEventListener("click", autoConnect);
    document.getElementById("usernameLoginForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const username = document.getElementById("username").value;
      const password = document.getElementById("password").value;
      manualLogin(username, password);
    });
    document.getElementById("logoutBtn").addEventListener("click", logout);
    document.querySelectorAll("[data-auth-tab]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const tabName = btn.dataset.authTab;
        document.querySelectorAll("[data-auth-tab]").forEach((b) => {
          b.classList.toggle("active", b.dataset.authTab === tabName);
        });
        document.querySelectorAll(".auth-tab-pane").forEach((pane) => {
          pane.style.display = pane.id === `${tabName}-auth-content` ? "block" : "none";
        });
      });
    });
    const passwordToggle = document.getElementById("supabase-password-toggle");
    const passwordField = document.getElementById("supabase-password");
    if (passwordToggle && passwordField) {
      const eyeIcon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
      const eyeSlashIcon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>';
      passwordToggle.addEventListener("click", () => {
        if (passwordField.type === "password") {
          passwordField.type = "text";
          passwordToggle.innerHTML = eyeSlashIcon;
          passwordToggle.setAttribute("aria-label", "Hide password");
        } else {
          passwordField.type = "password";
          passwordToggle.innerHTML = eyeIcon;
          passwordToggle.setAttribute("aria-label", "Show password");
        }
      });
    }
    function formatAuthError(error) {
      const message = error?.message || "";
      if (message.includes("Invalid login credentials")) {
        return "Incorrect email or password. Please try again.";
      }
      if (message.includes("Email not confirmed")) {
        return "Please check your email and click the confirmation link before signing in.";
      }
      if (message.includes("User already registered")) {
        return "An account with this email already exists. Try signing in instead.";
      }
      if (message.includes("Password should be at least 6 characters")) {
        return "Password must be at least 6 characters long.";
      }
      if (message.includes("invalid format") || message.includes("Unable to validate email")) {
        return "Please enter a valid email address.";
      }
      if (message.includes("rate limit") || message.includes("Email rate limit exceeded")) {
        return "Too many attempts. Please wait a few minutes and try again.";
      }
      if (message.includes("Signup requires email")) {
        return "Please enter your email address.";
      }
      if (message.includes("network") || message.includes("fetch")) {
        return "Network error. Please check your connection and try again.";
      }
      return "Authentication failed. Please try again.";
    }
    function showSuccessMessage(message) {
      const successDiv = document.getElementById("supabase-auth-success");
      const errorDiv = document.getElementById("supabase-auth-error");
      if (!successDiv)
        return;
      errorDiv.classList.add("hidden");
      successDiv.textContent = message;
      successDiv.classList.remove("hidden");
      successDiv.style.opacity = "1";
      setTimeout(() => {
        successDiv.style.opacity = "0";
        setTimeout(() => {
          successDiv.classList.add("hidden");
        }, 300);
      }, 2e3);
    }
    const supabase2 = window.supabaseClient;
    if (supabase2) {
      const { data: { session } } = await supabase2.auth.getSession();
      updateSupabaseAuthUI(session?.user);
      supabase2.auth.onAuthStateChange((event, session2) => {
        updateSupabaseAuthUI(session2?.user);
      });
      document.getElementById("supabase-auth-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("supabase-email").value.trim();
        const password = document.getElementById("supabase-password").value;
        const errorDiv = document.getElementById("supabase-auth-error");
        const signInBtn = document.getElementById("supabase-signin-btn");
        if (signInBtn) {
          signInBtn.disabled = true;
          signInBtn.textContent = "Signing in...";
        }
        try {
          console.log("\u{1F510} Attempting sign in...");
          const { data, error } = await supabase2.auth.signInWithPassword({ email, password });
          console.log("\u{1F510} Sign in response:", { data, error });
          if (error)
            throw error;
          errorDiv.classList.add("hidden");
          console.log("\u2705 Sign in successful, showing success message");
          showSuccessMessage("\u2705 Signed in successfully!");
        } catch (error) {
          console.error("\u274C Sign in error:", error);
          errorDiv.textContent = formatAuthError(error);
          errorDiv.classList.remove("hidden");
        } finally {
          if (signInBtn) {
            signInBtn.disabled = false;
            signInBtn.textContent = "Sign In";
          }
        }
      });
      document.getElementById("supabase-signup-btn").addEventListener("click", async () => {
        console.log("\u{1F510} Sign up button clicked");
        const email = document.getElementById("supabase-email").value.trim();
        const password = document.getElementById("supabase-password").value;
        const errorDiv = document.getElementById("supabase-auth-error");
        const signUpBtn = document.getElementById("supabase-signup-btn");
        console.log(`\u{1F4E7} Email: ${email}, Password length: ${password?.length}`);
        if (!email || !password) {
          console.log("\u274C Missing email or password");
          errorDiv.textContent = "Please enter email and password";
          errorDiv.classList.remove("hidden");
          return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          console.log("\u274C Invalid email format");
          errorDiv.textContent = "Please enter a valid email address";
          errorDiv.classList.remove("hidden");
          return;
        }
        if (password.length < 6) {
          console.log("\u274C Password too short");
          errorDiv.textContent = "Password must be at least 6 characters long";
          errorDiv.classList.remove("hidden");
          return;
        }
        if (signUpBtn) {
          signUpBtn.disabled = true;
          signUpBtn.textContent = "Creating account...";
        }
        try {
          console.log("\u{1F510} Attempting sign up...");
          const { data, error } = await supabase2.auth.signUp({ email, password });
          console.log("\u{1F510} Sign up response:", { data, error });
          if (error)
            throw error;
          errorDiv.classList.add("hidden");
          console.log("\u2705 Sign up successful, user:", data?.user);
          showSuccessMessage("\u2705 Account created successfully!");
        } catch (error) {
          console.error("\u274C Sign up error:", error);
          errorDiv.textContent = formatAuthError(error);
          errorDiv.classList.remove("hidden");
        } finally {
          if (signUpBtn) {
            signUpBtn.disabled = false;
            signUpBtn.textContent = "Sign Up";
          }
        }
      });
      document.getElementById("supabase-signout-btn").addEventListener("click", async () => {
        try {
          await supabase2.auth.signOut();
        } catch (error) {
          console.error("Error signing out:", error);
        }
      });
    }
    await updateAuthStatus();
    document.getElementById("open-website").addEventListener("click", (e) => {
      e.preventDefault();
      browserAPI5.tabs.create({ url: "https://carmaclouds.vercel.app" });
    });
    document.getElementById("open-github").addEventListener("click", (e) => {
      e.preventDefault();
      browserAPI5.tabs.create({ url: "https://github.com/CarmaNayeli/carmaclouds" });
    });
    document.getElementById("open-issues").addEventListener("click", (e) => {
      e.preventDefault();
      browserAPI5.tabs.create({ url: "https://github.com/CarmaNayeli/carmaclouds/issues" });
    });
    document.getElementById("open-sponsor").addEventListener("click", (e) => {
      e.preventDefault();
      browserAPI5.tabs.create({ url: "https://github.com/sponsors/CarmaNayeli/" });
    });
    const syncBtn = document.getElementById("syncToCarmaCloudsBtn");
    if (syncBtn) {
      syncBtn.addEventListener("click", handleSyncToCarmaClouds);
    }
    await switchTab(lastTab);
  }
  async function handleSyncToCarmaClouds() {
    const btn = document.getElementById("syncToCarmaCloudsBtn");
    const statusDiv = document.getElementById("syncStatus");
    if (!btn || !statusDiv)
      return;
    const originalText = btn.innerHTML;
    try {
      btn.disabled = true;
      btn.innerHTML = "\u23F3 Syncing...";
      statusDiv.textContent = "Fetching character data from DiceCloud...";
      statusDiv.style.color = "#b0b0b0";
      const response = await browserAPI5.runtime.sendMessage({ action: "getCharacterData" });
      if (!response || !response.success || !response.data) {
        throw new Error("No character data available. Please sync from DiceCloud first.");
      }
      const characterData = response.data;
      console.log("\u{1F4E6} Character data received:", characterData);
      statusDiv.textContent = "Storing character locally...";
      const existingData = await browserAPI5.storage.local.get("carmaclouds_characters");
      const characters2 = existingData.carmaclouds_characters || [];
      const existingIndex = characters2.findIndex((c) => c.id === characterData.id);
      if (existingIndex >= 0) {
        characters2[existingIndex] = characterData;
      } else {
        characters2.unshift(characterData);
      }
      await browserAPI5.storage.local.set({ carmaclouds_characters: characters2 });
      console.log("\u2705 Character stored in local storage");
      statusDiv.textContent = "Syncing to database...";
      if (typeof SupabaseTokenManager !== "undefined") {
        const supabaseManager = new SupabaseTokenManager();
        const authResult = await browserAPI5.storage.local.get(["diceCloudUserId", "username"]);
        const dbResult = await supabaseManager.storeCharacter({
          ...characterData,
          user_id_dicecloud: authResult.diceCloudUserId,
          username: authResult.username
        });
        if (dbResult.success) {
          console.log("\u2705 Character synced to database");
          statusDiv.textContent = "\u2705 Character synced successfully!";
          statusDiv.style.color = "#16a75a";
          btn.innerHTML = "\u2705 Synced!";
          const activeTab = document.querySelector(".tab-button.active");
          if (activeTab) {
            await switchTab(activeTab.dataset.tab);
          }
        } else {
          throw new Error(dbResult.error || "Failed to store character");
        }
      } else {
        throw new Error("SupabaseTokenManager not available");
      }
      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.disabled = false;
      }, 2e3);
    } catch (error) {
      console.error("\u274C Sync error:", error);
      statusDiv.textContent = `\u274C Error: ${error.message}`;
      statusDiv.style.color = "#ff6b6b";
      btn.innerHTML = "\u274C Failed";
      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.disabled = false;
      }, 3e3);
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init4);
  } else {
    init4();
  }
})();
//# sourceMappingURL=popup.js.map
