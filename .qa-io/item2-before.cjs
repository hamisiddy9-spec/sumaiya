var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// node_modules/zod/v3/external.js
var external_exports = {};
__export(external_exports, {
  BRAND: () => BRAND,
  DIRTY: () => DIRTY,
  EMPTY_PATH: () => EMPTY_PATH,
  INVALID: () => INVALID,
  NEVER: () => NEVER,
  OK: () => OK,
  ParseStatus: () => ParseStatus,
  Schema: () => ZodType,
  ZodAny: () => ZodAny,
  ZodArray: () => ZodArray,
  ZodBigInt: () => ZodBigInt,
  ZodBoolean: () => ZodBoolean,
  ZodBranded: () => ZodBranded,
  ZodCatch: () => ZodCatch,
  ZodDate: () => ZodDate,
  ZodDefault: () => ZodDefault,
  ZodDiscriminatedUnion: () => ZodDiscriminatedUnion,
  ZodEffects: () => ZodEffects,
  ZodEnum: () => ZodEnum,
  ZodError: () => ZodError,
  ZodFirstPartyTypeKind: () => ZodFirstPartyTypeKind,
  ZodFunction: () => ZodFunction,
  ZodIntersection: () => ZodIntersection,
  ZodIssueCode: () => ZodIssueCode,
  ZodLazy: () => ZodLazy,
  ZodLiteral: () => ZodLiteral,
  ZodMap: () => ZodMap,
  ZodNaN: () => ZodNaN,
  ZodNativeEnum: () => ZodNativeEnum,
  ZodNever: () => ZodNever,
  ZodNull: () => ZodNull,
  ZodNullable: () => ZodNullable,
  ZodNumber: () => ZodNumber,
  ZodObject: () => ZodObject,
  ZodOptional: () => ZodOptional,
  ZodParsedType: () => ZodParsedType,
  ZodPipeline: () => ZodPipeline,
  ZodPromise: () => ZodPromise,
  ZodReadonly: () => ZodReadonly,
  ZodRecord: () => ZodRecord,
  ZodSchema: () => ZodType,
  ZodSet: () => ZodSet,
  ZodString: () => ZodString,
  ZodSymbol: () => ZodSymbol,
  ZodTransformer: () => ZodEffects,
  ZodTuple: () => ZodTuple,
  ZodType: () => ZodType,
  ZodUndefined: () => ZodUndefined,
  ZodUnion: () => ZodUnion,
  ZodUnknown: () => ZodUnknown,
  ZodVoid: () => ZodVoid,
  addIssueToContext: () => addIssueToContext,
  any: () => anyType,
  array: () => arrayType,
  bigint: () => bigIntType,
  boolean: () => booleanType,
  coerce: () => coerce,
  custom: () => custom,
  date: () => dateType,
  datetimeRegex: () => datetimeRegex,
  defaultErrorMap: () => en_default,
  discriminatedUnion: () => discriminatedUnionType,
  effect: () => effectsType,
  enum: () => enumType,
  function: () => functionType,
  getErrorMap: () => getErrorMap,
  getParsedType: () => getParsedType,
  instanceof: () => instanceOfType,
  intersection: () => intersectionType,
  isAborted: () => isAborted,
  isAsync: () => isAsync,
  isDirty: () => isDirty,
  isValid: () => isValid,
  late: () => late,
  lazy: () => lazyType,
  literal: () => literalType,
  makeIssue: () => makeIssue,
  map: () => mapType,
  nan: () => nanType,
  nativeEnum: () => nativeEnumType,
  never: () => neverType,
  null: () => nullType,
  nullable: () => nullableType,
  number: () => numberType,
  object: () => objectType,
  objectUtil: () => objectUtil,
  oboolean: () => oboolean,
  onumber: () => onumber,
  optional: () => optionalType,
  ostring: () => ostring,
  pipeline: () => pipelineType,
  preprocess: () => preprocessType,
  promise: () => promiseType,
  quotelessJson: () => quotelessJson,
  record: () => recordType,
  set: () => setType,
  setErrorMap: () => setErrorMap,
  strictObject: () => strictObjectType,
  string: () => stringType,
  symbol: () => symbolType,
  transformer: () => effectsType,
  tuple: () => tupleType,
  undefined: () => undefinedType,
  union: () => unionType,
  unknown: () => unknownType,
  util: () => util,
  void: () => voidType
});

// node_modules/zod/v3/helpers/util.js
var util;
(function(util2) {
  util2.assertEqual = (_) => {
  };
  function assertIs(_arg) {
  }
  util2.assertIs = assertIs;
  function assertNever(_x) {
    throw new Error();
  }
  util2.assertNever = assertNever;
  util2.arrayToEnum = (items) => {
    const obj2 = {};
    for (const item of items) {
      obj2[item] = item;
    }
    return obj2;
  };
  util2.getValidEnumValues = (obj2) => {
    const validKeys = util2.objectKeys(obj2).filter((k) => typeof obj2[obj2[k]] !== "number");
    const filtered = {};
    for (const k of validKeys) {
      filtered[k] = obj2[k];
    }
    return util2.objectValues(filtered);
  };
  util2.objectValues = (obj2) => {
    return util2.objectKeys(obj2).map(function(e) {
      return obj2[e];
    });
  };
  util2.objectKeys = typeof Object.keys === "function" ? (obj2) => Object.keys(obj2) : (object) => {
    const keys = [];
    for (const key in object) {
      if (Object.prototype.hasOwnProperty.call(object, key)) {
        keys.push(key);
      }
    }
    return keys;
  };
  util2.find = (arr2, checker) => {
    for (const item of arr2) {
      if (checker(item))
        return item;
    }
    return void 0;
  };
  util2.isInteger = typeof Number.isInteger === "function" ? (val) => Number.isInteger(val) : (val) => typeof val === "number" && Number.isFinite(val) && Math.floor(val) === val;
  function joinValues(array, separator = " | ") {
    return array.map((val) => typeof val === "string" ? `'${val}'` : val).join(separator);
  }
  util2.joinValues = joinValues;
  util2.jsonStringifyReplacer = (_, value) => {
    if (typeof value === "bigint") {
      return value.toString();
    }
    return value;
  };
})(util || (util = {}));
var objectUtil;
(function(objectUtil2) {
  objectUtil2.mergeShapes = (first, second) => {
    return {
      ...first,
      ...second
      // second overwrites first
    };
  };
})(objectUtil || (objectUtil = {}));
var ZodParsedType = util.arrayToEnum([
  "string",
  "nan",
  "number",
  "integer",
  "float",
  "boolean",
  "date",
  "bigint",
  "symbol",
  "function",
  "undefined",
  "null",
  "array",
  "object",
  "unknown",
  "promise",
  "void",
  "never",
  "map",
  "set"
]);
var getParsedType = (data) => {
  const t = typeof data;
  switch (t) {
    case "undefined":
      return ZodParsedType.undefined;
    case "string":
      return ZodParsedType.string;
    case "number":
      return Number.isNaN(data) ? ZodParsedType.nan : ZodParsedType.number;
    case "boolean":
      return ZodParsedType.boolean;
    case "function":
      return ZodParsedType.function;
    case "bigint":
      return ZodParsedType.bigint;
    case "symbol":
      return ZodParsedType.symbol;
    case "object":
      if (Array.isArray(data)) {
        return ZodParsedType.array;
      }
      if (data === null) {
        return ZodParsedType.null;
      }
      if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") {
        return ZodParsedType.promise;
      }
      if (typeof Map !== "undefined" && data instanceof Map) {
        return ZodParsedType.map;
      }
      if (typeof Set !== "undefined" && data instanceof Set) {
        return ZodParsedType.set;
      }
      if (typeof Date !== "undefined" && data instanceof Date) {
        return ZodParsedType.date;
      }
      return ZodParsedType.object;
    default:
      return ZodParsedType.unknown;
  }
};

// node_modules/zod/v3/ZodError.js
var ZodIssueCode = util.arrayToEnum([
  "invalid_type",
  "invalid_literal",
  "custom",
  "invalid_union",
  "invalid_union_discriminator",
  "invalid_enum_value",
  "unrecognized_keys",
  "invalid_arguments",
  "invalid_return_type",
  "invalid_date",
  "invalid_string",
  "too_small",
  "too_big",
  "invalid_intersection_types",
  "not_multiple_of",
  "not_finite"
]);
var quotelessJson = (obj2) => {
  const json = JSON.stringify(obj2, null, 2);
  return json.replace(/"([^"]+)":/g, "$1:");
};
var ZodError = class _ZodError extends Error {
  get errors() {
    return this.issues;
  }
  constructor(issues) {
    super();
    this.issues = [];
    this.addIssue = (sub) => {
      this.issues = [...this.issues, sub];
    };
    this.addIssues = (subs = []) => {
      this.issues = [...this.issues, ...subs];
    };
    const actualProto = new.target.prototype;
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(this, actualProto);
    } else {
      this.__proto__ = actualProto;
    }
    this.name = "ZodError";
    this.issues = issues;
  }
  format(_mapper) {
    const mapper = _mapper || function(issue) {
      return issue.message;
    };
    const fieldErrors = { _errors: [] };
    const processError = (error) => {
      for (const issue of error.issues) {
        if (issue.code === "invalid_union") {
          issue.unionErrors.map(processError);
        } else if (issue.code === "invalid_return_type") {
          processError(issue.returnTypeError);
        } else if (issue.code === "invalid_arguments") {
          processError(issue.argumentsError);
        } else if (issue.path.length === 0) {
          fieldErrors._errors.push(mapper(issue));
        } else {
          let curr = fieldErrors;
          let i = 0;
          while (i < issue.path.length) {
            const el = issue.path[i];
            const terminal = i === issue.path.length - 1;
            if (!terminal) {
              curr[el] = curr[el] || { _errors: [] };
            } else {
              curr[el] = curr[el] || { _errors: [] };
              curr[el]._errors.push(mapper(issue));
            }
            curr = curr[el];
            i++;
          }
        }
      }
    };
    processError(this);
    return fieldErrors;
  }
  static assert(value) {
    if (!(value instanceof _ZodError)) {
      throw new Error(`Not a ZodError: ${value}`);
    }
  }
  toString() {
    return this.message;
  }
  get message() {
    return JSON.stringify(this.issues, util.jsonStringifyReplacer, 2);
  }
  get isEmpty() {
    return this.issues.length === 0;
  }
  flatten(mapper = (issue) => issue.message) {
    const fieldErrors = {};
    const formErrors = [];
    for (const sub of this.issues) {
      if (sub.path.length > 0) {
        const firstEl = sub.path[0];
        fieldErrors[firstEl] = fieldErrors[firstEl] || [];
        fieldErrors[firstEl].push(mapper(sub));
      } else {
        formErrors.push(mapper(sub));
      }
    }
    return { formErrors, fieldErrors };
  }
  get formErrors() {
    return this.flatten();
  }
};
ZodError.create = (issues) => {
  const error = new ZodError(issues);
  return error;
};

// node_modules/zod/v3/locales/en.js
var errorMap = (issue, _ctx) => {
  let message;
  switch (issue.code) {
    case ZodIssueCode.invalid_type:
      if (issue.received === ZodParsedType.undefined) {
        message = "Required";
      } else {
        message = `Expected ${issue.expected}, received ${issue.received}`;
      }
      break;
    case ZodIssueCode.invalid_literal:
      message = `Invalid literal value, expected ${JSON.stringify(issue.expected, util.jsonStringifyReplacer)}`;
      break;
    case ZodIssueCode.unrecognized_keys:
      message = `Unrecognized key(s) in object: ${util.joinValues(issue.keys, ", ")}`;
      break;
    case ZodIssueCode.invalid_union:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_union_discriminator:
      message = `Invalid discriminator value. Expected ${util.joinValues(issue.options)}`;
      break;
    case ZodIssueCode.invalid_enum_value:
      message = `Invalid enum value. Expected ${util.joinValues(issue.options)}, received '${issue.received}'`;
      break;
    case ZodIssueCode.invalid_arguments:
      message = `Invalid function arguments`;
      break;
    case ZodIssueCode.invalid_return_type:
      message = `Invalid function return type`;
      break;
    case ZodIssueCode.invalid_date:
      message = `Invalid date`;
      break;
    case ZodIssueCode.invalid_string:
      if (typeof issue.validation === "object") {
        if ("includes" in issue.validation) {
          message = `Invalid input: must include "${issue.validation.includes}"`;
          if (typeof issue.validation.position === "number") {
            message = `${message} at one or more positions greater than or equal to ${issue.validation.position}`;
          }
        } else if ("startsWith" in issue.validation) {
          message = `Invalid input: must start with "${issue.validation.startsWith}"`;
        } else if ("endsWith" in issue.validation) {
          message = `Invalid input: must end with "${issue.validation.endsWith}"`;
        } else {
          util.assertNever(issue.validation);
        }
      } else if (issue.validation !== "regex") {
        message = `Invalid ${issue.validation}`;
      } else {
        message = "Invalid";
      }
      break;
    case ZodIssueCode.too_small:
      if (issue.type === "array")
        message = `Array must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `more than`} ${issue.minimum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `over`} ${issue.minimum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
      else if (issue.type === "bigint")
        message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
      else if (issue.type === "date")
        message = `Date must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${new Date(Number(issue.minimum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.too_big:
      if (issue.type === "array")
        message = `Array must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `less than`} ${issue.maximum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `under`} ${issue.maximum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
      else if (issue.type === "bigint")
        message = `BigInt must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
      else if (issue.type === "date")
        message = `Date must be ${issue.exact ? `exactly` : issue.inclusive ? `smaller than or equal to` : `smaller than`} ${new Date(Number(issue.maximum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.custom:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_intersection_types:
      message = `Intersection results could not be merged`;
      break;
    case ZodIssueCode.not_multiple_of:
      message = `Number must be a multiple of ${issue.multipleOf}`;
      break;
    case ZodIssueCode.not_finite:
      message = "Number must be finite";
      break;
    default:
      message = _ctx.defaultError;
      util.assertNever(issue);
  }
  return { message };
};
var en_default = errorMap;

// node_modules/zod/v3/errors.js
var overrideErrorMap = en_default;
function setErrorMap(map) {
  overrideErrorMap = map;
}
function getErrorMap() {
  return overrideErrorMap;
}

// node_modules/zod/v3/helpers/parseUtil.js
var makeIssue = (params) => {
  const { data, path, errorMaps, issueData } = params;
  const fullPath = [...path, ...issueData.path || []];
  const fullIssue = {
    ...issueData,
    path: fullPath
  };
  if (issueData.message !== void 0) {
    return {
      ...issueData,
      path: fullPath,
      message: issueData.message
    };
  }
  let errorMessage = "";
  const maps = errorMaps.filter((m) => !!m).slice().reverse();
  for (const map of maps) {
    errorMessage = map(fullIssue, { data, defaultError: errorMessage }).message;
  }
  return {
    ...issueData,
    path: fullPath,
    message: errorMessage
  };
};
var EMPTY_PATH = [];
function addIssueToContext(ctx, issueData) {
  const overrideMap = getErrorMap();
  const issue = makeIssue({
    issueData,
    data: ctx.data,
    path: ctx.path,
    errorMaps: [
      ctx.common.contextualErrorMap,
      // contextual error map is first priority
      ctx.schemaErrorMap,
      // then schema-bound map if available
      overrideMap,
      // then global override map
      overrideMap === en_default ? void 0 : en_default
      // then global default map
    ].filter((x) => !!x)
  });
  ctx.common.issues.push(issue);
}
var ParseStatus = class _ParseStatus {
  constructor() {
    this.value = "valid";
  }
  dirty() {
    if (this.value === "valid")
      this.value = "dirty";
  }
  abort() {
    if (this.value !== "aborted")
      this.value = "aborted";
  }
  static mergeArray(status, results) {
    const arrayValue = [];
    for (const s of results) {
      if (s.status === "aborted")
        return INVALID;
      if (s.status === "dirty")
        status.dirty();
      arrayValue.push(s.value);
    }
    return { status: status.value, value: arrayValue };
  }
  static async mergeObjectAsync(status, pairs) {
    const syncPairs = [];
    for (const pair of pairs) {
      const key = await pair.key;
      const value = await pair.value;
      syncPairs.push({
        key,
        value
      });
    }
    return _ParseStatus.mergeObjectSync(status, syncPairs);
  }
  static mergeObjectSync(status, pairs) {
    const finalObject = {};
    for (const pair of pairs) {
      const { key, value } = pair;
      if (key.status === "aborted")
        return INVALID;
      if (value.status === "aborted")
        return INVALID;
      if (key.status === "dirty")
        status.dirty();
      if (value.status === "dirty")
        status.dirty();
      if (key.value !== "__proto__" && (typeof value.value !== "undefined" || pair.alwaysSet)) {
        finalObject[key.value] = value.value;
      }
    }
    return { status: status.value, value: finalObject };
  }
};
var INVALID = Object.freeze({
  status: "aborted"
});
var DIRTY = (value) => ({ status: "dirty", value });
var OK = (value) => ({ status: "valid", value });
var isAborted = (x) => x.status === "aborted";
var isDirty = (x) => x.status === "dirty";
var isValid = (x) => x.status === "valid";
var isAsync = (x) => typeof Promise !== "undefined" && x instanceof Promise;

// node_modules/zod/v3/helpers/errorUtil.js
var errorUtil;
(function(errorUtil2) {
  errorUtil2.errToObj = (message) => typeof message === "string" ? { message } : message || {};
  errorUtil2.toString = (message) => typeof message === "string" ? message : message?.message;
})(errorUtil || (errorUtil = {}));

// node_modules/zod/v3/types.js
var ParseInputLazyPath = class {
  constructor(parent, value, path, key) {
    this._cachedPath = [];
    this.parent = parent;
    this.data = value;
    this._path = path;
    this._key = key;
  }
  get path() {
    if (!this._cachedPath.length) {
      if (Array.isArray(this._key)) {
        this._cachedPath.push(...this._path, ...this._key);
      } else {
        this._cachedPath.push(...this._path, this._key);
      }
    }
    return this._cachedPath;
  }
};
var handleResult = (ctx, result) => {
  if (isValid(result)) {
    return { success: true, data: result.value };
  } else {
    if (!ctx.common.issues.length) {
      throw new Error("Validation failed but no issues detected.");
    }
    return {
      success: false,
      get error() {
        if (this._error)
          return this._error;
        const error = new ZodError(ctx.common.issues);
        this._error = error;
        return this._error;
      }
    };
  }
};
function processCreateParams(params) {
  if (!params)
    return {};
  const { errorMap: errorMap2, invalid_type_error, required_error, description } = params;
  if (errorMap2 && (invalid_type_error || required_error)) {
    throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
  }
  if (errorMap2)
    return { errorMap: errorMap2, description };
  const customMap = (iss, ctx) => {
    const { message } = params;
    if (iss.code === "invalid_enum_value") {
      return { message: message ?? ctx.defaultError };
    }
    if (typeof ctx.data === "undefined") {
      return { message: message ?? required_error ?? ctx.defaultError };
    }
    if (iss.code !== "invalid_type")
      return { message: ctx.defaultError };
    return { message: message ?? invalid_type_error ?? ctx.defaultError };
  };
  return { errorMap: customMap, description };
}
var ZodType = class {
  get description() {
    return this._def.description;
  }
  _getType(input) {
    return getParsedType(input.data);
  }
  _getOrReturnCtx(input, ctx) {
    return ctx || {
      common: input.parent.common,
      data: input.data,
      parsedType: getParsedType(input.data),
      schemaErrorMap: this._def.errorMap,
      path: input.path,
      parent: input.parent
    };
  }
  _processInputParams(input) {
    return {
      status: new ParseStatus(),
      ctx: {
        common: input.parent.common,
        data: input.data,
        parsedType: getParsedType(input.data),
        schemaErrorMap: this._def.errorMap,
        path: input.path,
        parent: input.parent
      }
    };
  }
  _parseSync(input) {
    const result = this._parse(input);
    if (isAsync(result)) {
      throw new Error("Synchronous parse encountered promise.");
    }
    return result;
  }
  _parseAsync(input) {
    const result = this._parse(input);
    return Promise.resolve(result);
  }
  parse(data, params) {
    const result = this.safeParse(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  safeParse(data, params) {
    const ctx = {
      common: {
        issues: [],
        async: params?.async ?? false,
        contextualErrorMap: params?.errorMap
      },
      path: params?.path || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const result = this._parseSync({ data, path: ctx.path, parent: ctx });
    return handleResult(ctx, result);
  }
  "~validate"(data) {
    const ctx = {
      common: {
        issues: [],
        async: !!this["~standard"].async
      },
      path: [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    if (!this["~standard"].async) {
      try {
        const result = this._parseSync({ data, path: [], parent: ctx });
        return isValid(result) ? {
          value: result.value
        } : {
          issues: ctx.common.issues
        };
      } catch (err) {
        if (err?.message?.toLowerCase()?.includes("encountered")) {
          this["~standard"].async = true;
        }
        ctx.common = {
          issues: [],
          async: true
        };
      }
    }
    return this._parseAsync({ data, path: [], parent: ctx }).then((result) => isValid(result) ? {
      value: result.value
    } : {
      issues: ctx.common.issues
    });
  }
  async parseAsync(data, params) {
    const result = await this.safeParseAsync(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  async safeParseAsync(data, params) {
    const ctx = {
      common: {
        issues: [],
        contextualErrorMap: params?.errorMap,
        async: true
      },
      path: params?.path || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const maybeAsyncResult = this._parse({ data, path: ctx.path, parent: ctx });
    const result = await (isAsync(maybeAsyncResult) ? maybeAsyncResult : Promise.resolve(maybeAsyncResult));
    return handleResult(ctx, result);
  }
  refine(check, message) {
    const getIssueProperties = (val) => {
      if (typeof message === "string" || typeof message === "undefined") {
        return { message };
      } else if (typeof message === "function") {
        return message(val);
      } else {
        return message;
      }
    };
    return this._refinement((val, ctx) => {
      const result = check(val);
      const setError = () => ctx.addIssue({
        code: ZodIssueCode.custom,
        ...getIssueProperties(val)
      });
      if (typeof Promise !== "undefined" && result instanceof Promise) {
        return result.then((data) => {
          if (!data) {
            setError();
            return false;
          } else {
            return true;
          }
        });
      }
      if (!result) {
        setError();
        return false;
      } else {
        return true;
      }
    });
  }
  refinement(check, refinementData) {
    return this._refinement((val, ctx) => {
      if (!check(val)) {
        ctx.addIssue(typeof refinementData === "function" ? refinementData(val, ctx) : refinementData);
        return false;
      } else {
        return true;
      }
    });
  }
  _refinement(refinement) {
    return new ZodEffects({
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "refinement", refinement }
    });
  }
  superRefine(refinement) {
    return this._refinement(refinement);
  }
  constructor(def) {
    this.spa = this.safeParseAsync;
    this._def = def;
    this.parse = this.parse.bind(this);
    this.safeParse = this.safeParse.bind(this);
    this.parseAsync = this.parseAsync.bind(this);
    this.safeParseAsync = this.safeParseAsync.bind(this);
    this.spa = this.spa.bind(this);
    this.refine = this.refine.bind(this);
    this.refinement = this.refinement.bind(this);
    this.superRefine = this.superRefine.bind(this);
    this.optional = this.optional.bind(this);
    this.nullable = this.nullable.bind(this);
    this.nullish = this.nullish.bind(this);
    this.array = this.array.bind(this);
    this.promise = this.promise.bind(this);
    this.or = this.or.bind(this);
    this.and = this.and.bind(this);
    this.transform = this.transform.bind(this);
    this.brand = this.brand.bind(this);
    this.default = this.default.bind(this);
    this.catch = this.catch.bind(this);
    this.describe = this.describe.bind(this);
    this.pipe = this.pipe.bind(this);
    this.readonly = this.readonly.bind(this);
    this.isNullable = this.isNullable.bind(this);
    this.isOptional = this.isOptional.bind(this);
    this["~standard"] = {
      version: 1,
      vendor: "zod",
      validate: (data) => this["~validate"](data)
    };
  }
  optional() {
    return ZodOptional.create(this, this._def);
  }
  nullable() {
    return ZodNullable.create(this, this._def);
  }
  nullish() {
    return this.nullable().optional();
  }
  array() {
    return ZodArray.create(this);
  }
  promise() {
    return ZodPromise.create(this, this._def);
  }
  or(option) {
    return ZodUnion.create([this, option], this._def);
  }
  and(incoming) {
    return ZodIntersection.create(this, incoming, this._def);
  }
  transform(transform) {
    return new ZodEffects({
      ...processCreateParams(this._def),
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "transform", transform }
    });
  }
  default(def) {
    const defaultValueFunc = typeof def === "function" ? def : () => def;
    return new ZodDefault({
      ...processCreateParams(this._def),
      innerType: this,
      defaultValue: defaultValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodDefault
    });
  }
  brand() {
    return new ZodBranded({
      typeName: ZodFirstPartyTypeKind.ZodBranded,
      type: this,
      ...processCreateParams(this._def)
    });
  }
  catch(def) {
    const catchValueFunc = typeof def === "function" ? def : () => def;
    return new ZodCatch({
      ...processCreateParams(this._def),
      innerType: this,
      catchValue: catchValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodCatch
    });
  }
  describe(description) {
    const This = this.constructor;
    return new This({
      ...this._def,
      description
    });
  }
  pipe(target) {
    return ZodPipeline.create(this, target);
  }
  readonly() {
    return ZodReadonly.create(this);
  }
  isOptional() {
    return this.safeParse(void 0).success;
  }
  isNullable() {
    return this.safeParse(null).success;
  }
};
var cuidRegex = /^c[^\s-]{8,}$/i;
var cuid2Regex = /^[0-9a-z]+$/;
var ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
var uuidRegex = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i;
var nanoidRegex = /^[a-z0-9_-]{21}$/i;
var jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
var durationRegex = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;
var emailRegex = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;
var _emojiRegex = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
var emojiRegex;
var ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
var ipv4CidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/;
var ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
var ipv6CidrRegex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
var base64Regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
var base64urlRegex = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/;
var dateRegexSource = `((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))`;
var dateRegex = new RegExp(`^${dateRegexSource}$`);
function timeRegexSource(args) {
  let secondsRegexSource = `[0-5]\\d`;
  if (args.precision) {
    secondsRegexSource = `${secondsRegexSource}\\.\\d{${args.precision}}`;
  } else if (args.precision == null) {
    secondsRegexSource = `${secondsRegexSource}(\\.\\d+)?`;
  }
  const secondsQuantifier = args.precision ? "+" : "?";
  return `([01]\\d|2[0-3]):[0-5]\\d(:${secondsRegexSource})${secondsQuantifier}`;
}
function timeRegex(args) {
  return new RegExp(`^${timeRegexSource(args)}$`);
}
function datetimeRegex(args) {
  let regex = `${dateRegexSource}T${timeRegexSource(args)}`;
  const opts = [];
  opts.push(args.local ? `Z?` : `Z`);
  if (args.offset)
    opts.push(`([+-]\\d{2}:?\\d{2})`);
  regex = `${regex}(${opts.join("|")})`;
  return new RegExp(`^${regex}$`);
}
function isValidIP(ip, version) {
  if ((version === "v4" || !version) && ipv4Regex.test(ip)) {
    return true;
  }
  if ((version === "v6" || !version) && ipv6Regex.test(ip)) {
    return true;
  }
  return false;
}
function isValidJWT(jwt, alg) {
  if (!jwtRegex.test(jwt))
    return false;
  try {
    const [header] = jwt.split(".");
    if (!header)
      return false;
    const base64 = header.replace(/-/g, "+").replace(/_/g, "/").padEnd(header.length + (4 - header.length % 4) % 4, "=");
    const decoded = JSON.parse(atob(base64));
    if (typeof decoded !== "object" || decoded === null)
      return false;
    if ("typ" in decoded && decoded?.typ !== "JWT")
      return false;
    if (!decoded.alg)
      return false;
    if (alg && decoded.alg !== alg)
      return false;
    return true;
  } catch {
    return false;
  }
}
function isValidCidr(ip, version) {
  if ((version === "v4" || !version) && ipv4CidrRegex.test(ip)) {
    return true;
  }
  if ((version === "v6" || !version) && ipv6CidrRegex.test(ip)) {
    return true;
  }
  return false;
}
var ZodString = class _ZodString extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = String(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.string) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.string,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const status = new ParseStatus();
    let ctx = void 0;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.length < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.length > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "length") {
        const tooBig = input.data.length > check.value;
        const tooSmall = input.data.length < check.value;
        if (tooBig || tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          if (tooBig) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_big,
              maximum: check.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check.message
            });
          } else if (tooSmall) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_small,
              minimum: check.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check.message
            });
          }
          status.dirty();
        }
      } else if (check.kind === "email") {
        if (!emailRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "email",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "emoji") {
        if (!emojiRegex) {
          emojiRegex = new RegExp(_emojiRegex, "u");
        }
        if (!emojiRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "emoji",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "uuid") {
        if (!uuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "uuid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "nanoid") {
        if (!nanoidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "nanoid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid") {
        if (!cuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid2") {
        if (!cuid2Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid2",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "ulid") {
        if (!ulidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ulid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "url") {
        try {
          new URL(input.data);
        } catch {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "url",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "regex") {
        check.regex.lastIndex = 0;
        const testResult = check.regex.test(input.data);
        if (!testResult) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "regex",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "trim") {
        input.data = input.data.trim();
      } else if (check.kind === "includes") {
        if (!input.data.includes(check.value, check.position)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { includes: check.value, position: check.position },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "toLowerCase") {
        input.data = input.data.toLowerCase();
      } else if (check.kind === "toUpperCase") {
        input.data = input.data.toUpperCase();
      } else if (check.kind === "startsWith") {
        if (!input.data.startsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { startsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "endsWith") {
        if (!input.data.endsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { endsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "datetime") {
        const regex = datetimeRegex(check);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "datetime",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "date") {
        const regex = dateRegex;
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "date",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "time") {
        const regex = timeRegex(check);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "time",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "duration") {
        if (!durationRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "duration",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "ip") {
        if (!isValidIP(input.data, check.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ip",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "jwt") {
        if (!isValidJWT(input.data, check.alg)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "jwt",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cidr") {
        if (!isValidCidr(input.data, check.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cidr",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "base64") {
        if (!base64Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "base64url") {
        if (!base64urlRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64url",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  _regex(regex, validation, message) {
    return this.refinement((data) => regex.test(data), {
      validation,
      code: ZodIssueCode.invalid_string,
      ...errorUtil.errToObj(message)
    });
  }
  _addCheck(check) {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  email(message) {
    return this._addCheck({ kind: "email", ...errorUtil.errToObj(message) });
  }
  url(message) {
    return this._addCheck({ kind: "url", ...errorUtil.errToObj(message) });
  }
  emoji(message) {
    return this._addCheck({ kind: "emoji", ...errorUtil.errToObj(message) });
  }
  uuid(message) {
    return this._addCheck({ kind: "uuid", ...errorUtil.errToObj(message) });
  }
  nanoid(message) {
    return this._addCheck({ kind: "nanoid", ...errorUtil.errToObj(message) });
  }
  cuid(message) {
    return this._addCheck({ kind: "cuid", ...errorUtil.errToObj(message) });
  }
  cuid2(message) {
    return this._addCheck({ kind: "cuid2", ...errorUtil.errToObj(message) });
  }
  ulid(message) {
    return this._addCheck({ kind: "ulid", ...errorUtil.errToObj(message) });
  }
  base64(message) {
    return this._addCheck({ kind: "base64", ...errorUtil.errToObj(message) });
  }
  base64url(message) {
    return this._addCheck({
      kind: "base64url",
      ...errorUtil.errToObj(message)
    });
  }
  jwt(options) {
    return this._addCheck({ kind: "jwt", ...errorUtil.errToObj(options) });
  }
  ip(options) {
    return this._addCheck({ kind: "ip", ...errorUtil.errToObj(options) });
  }
  cidr(options) {
    return this._addCheck({ kind: "cidr", ...errorUtil.errToObj(options) });
  }
  datetime(options) {
    if (typeof options === "string") {
      return this._addCheck({
        kind: "datetime",
        precision: null,
        offset: false,
        local: false,
        message: options
      });
    }
    return this._addCheck({
      kind: "datetime",
      precision: typeof options?.precision === "undefined" ? null : options?.precision,
      offset: options?.offset ?? false,
      local: options?.local ?? false,
      ...errorUtil.errToObj(options?.message)
    });
  }
  date(message) {
    return this._addCheck({ kind: "date", message });
  }
  time(options) {
    if (typeof options === "string") {
      return this._addCheck({
        kind: "time",
        precision: null,
        message: options
      });
    }
    return this._addCheck({
      kind: "time",
      precision: typeof options?.precision === "undefined" ? null : options?.precision,
      ...errorUtil.errToObj(options?.message)
    });
  }
  duration(message) {
    return this._addCheck({ kind: "duration", ...errorUtil.errToObj(message) });
  }
  regex(regex, message) {
    return this._addCheck({
      kind: "regex",
      regex,
      ...errorUtil.errToObj(message)
    });
  }
  includes(value, options) {
    return this._addCheck({
      kind: "includes",
      value,
      position: options?.position,
      ...errorUtil.errToObj(options?.message)
    });
  }
  startsWith(value, message) {
    return this._addCheck({
      kind: "startsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  endsWith(value, message) {
    return this._addCheck({
      kind: "endsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  min(minLength, message) {
    return this._addCheck({
      kind: "min",
      value: minLength,
      ...errorUtil.errToObj(message)
    });
  }
  max(maxLength, message) {
    return this._addCheck({
      kind: "max",
      value: maxLength,
      ...errorUtil.errToObj(message)
    });
  }
  length(len, message) {
    return this._addCheck({
      kind: "length",
      value: len,
      ...errorUtil.errToObj(message)
    });
  }
  /**
   * Equivalent to `.min(1)`
   */
  nonempty(message) {
    return this.min(1, errorUtil.errToObj(message));
  }
  trim() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "trim" }]
    });
  }
  toLowerCase() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "toLowerCase" }]
    });
  }
  toUpperCase() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "toUpperCase" }]
    });
  }
  get isDatetime() {
    return !!this._def.checks.find((ch) => ch.kind === "datetime");
  }
  get isDate() {
    return !!this._def.checks.find((ch) => ch.kind === "date");
  }
  get isTime() {
    return !!this._def.checks.find((ch) => ch.kind === "time");
  }
  get isDuration() {
    return !!this._def.checks.find((ch) => ch.kind === "duration");
  }
  get isEmail() {
    return !!this._def.checks.find((ch) => ch.kind === "email");
  }
  get isURL() {
    return !!this._def.checks.find((ch) => ch.kind === "url");
  }
  get isEmoji() {
    return !!this._def.checks.find((ch) => ch.kind === "emoji");
  }
  get isUUID() {
    return !!this._def.checks.find((ch) => ch.kind === "uuid");
  }
  get isNANOID() {
    return !!this._def.checks.find((ch) => ch.kind === "nanoid");
  }
  get isCUID() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid");
  }
  get isCUID2() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid2");
  }
  get isULID() {
    return !!this._def.checks.find((ch) => ch.kind === "ulid");
  }
  get isIP() {
    return !!this._def.checks.find((ch) => ch.kind === "ip");
  }
  get isCIDR() {
    return !!this._def.checks.find((ch) => ch.kind === "cidr");
  }
  get isBase64() {
    return !!this._def.checks.find((ch) => ch.kind === "base64");
  }
  get isBase64url() {
    return !!this._def.checks.find((ch) => ch.kind === "base64url");
  }
  get minLength() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxLength() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
};
ZodString.create = (params) => {
  return new ZodString({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodString,
    coerce: params?.coerce ?? false,
    ...processCreateParams(params)
  });
};
function floatSafeRemainder(val, step) {
  const valDecCount = (val.toString().split(".")[1] || "").length;
  const stepDecCount = (step.toString().split(".")[1] || "").length;
  const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
  const valInt = Number.parseInt(val.toFixed(decCount).replace(".", ""));
  const stepInt = Number.parseInt(step.toFixed(decCount).replace(".", ""));
  return valInt % stepInt / 10 ** decCount;
}
var ZodNumber = class _ZodNumber extends ZodType {
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
    this.step = this.multipleOf;
  }
  _parse(input) {
    if (this._def.coerce) {
      input.data = Number(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.number) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.number,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    let ctx = void 0;
    const status = new ParseStatus();
    for (const check of this._def.checks) {
      if (check.kind === "int") {
        if (!util.isInteger(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: "integer",
            received: "float",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (floatSafeRemainder(input.data, check.value) !== 0) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "finite") {
        if (!Number.isFinite(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_finite,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new _ZodNumber({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check) {
    return new _ZodNumber({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  int(message) {
    return this._addCheck({
      kind: "int",
      message: errorUtil.toString(message)
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  finite(message) {
    return this._addCheck({
      kind: "finite",
      message: errorUtil.toString(message)
    });
  }
  safe(message) {
    return this._addCheck({
      kind: "min",
      inclusive: true,
      value: Number.MIN_SAFE_INTEGER,
      message: errorUtil.toString(message)
    })._addCheck({
      kind: "max",
      inclusive: true,
      value: Number.MAX_SAFE_INTEGER,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
  get isInt() {
    return !!this._def.checks.find((ch) => ch.kind === "int" || ch.kind === "multipleOf" && util.isInteger(ch.value));
  }
  get isFinite() {
    let max = null;
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "finite" || ch.kind === "int" || ch.kind === "multipleOf") {
        return true;
      } else if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      } else if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return Number.isFinite(min) && Number.isFinite(max);
  }
};
ZodNumber.create = (params) => {
  return new ZodNumber({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodNumber,
    coerce: params?.coerce || false,
    ...processCreateParams(params)
  });
};
var ZodBigInt = class _ZodBigInt extends ZodType {
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
  }
  _parse(input) {
    if (this._def.coerce) {
      try {
        input.data = BigInt(input.data);
      } catch {
        return this._getInvalidInput(input);
      }
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.bigint) {
      return this._getInvalidInput(input);
    }
    let ctx = void 0;
    const status = new ParseStatus();
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            type: "bigint",
            minimum: check.value,
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            type: "bigint",
            maximum: check.value,
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (input.data % check.value !== BigInt(0)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  _getInvalidInput(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.bigint,
      received: ctx.parsedType
    });
    return INVALID;
  }
  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new _ZodBigInt({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check) {
    return new _ZodBigInt({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
};
ZodBigInt.create = (params) => {
  return new ZodBigInt({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodBigInt,
    coerce: params?.coerce ?? false,
    ...processCreateParams(params)
  });
};
var ZodBoolean = class extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = Boolean(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.boolean) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.boolean,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodBoolean.create = (params) => {
  return new ZodBoolean({
    typeName: ZodFirstPartyTypeKind.ZodBoolean,
    coerce: params?.coerce || false,
    ...processCreateParams(params)
  });
};
var ZodDate = class _ZodDate extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = new Date(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.date) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.date,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    if (Number.isNaN(input.data.getTime())) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_date
      });
      return INVALID;
    }
    const status = new ParseStatus();
    let ctx = void 0;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.getTime() < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            message: check.message,
            inclusive: true,
            exact: false,
            minimum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.getTime() > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            message: check.message,
            inclusive: true,
            exact: false,
            maximum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return {
      status: status.value,
      value: new Date(input.data.getTime())
    };
  }
  _addCheck(check) {
    return new _ZodDate({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  min(minDate, message) {
    return this._addCheck({
      kind: "min",
      value: minDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  max(maxDate, message) {
    return this._addCheck({
      kind: "max",
      value: maxDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  get minDate() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min != null ? new Date(min) : null;
  }
  get maxDate() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max != null ? new Date(max) : null;
  }
};
ZodDate.create = (params) => {
  return new ZodDate({
    checks: [],
    coerce: params?.coerce || false,
    typeName: ZodFirstPartyTypeKind.ZodDate,
    ...processCreateParams(params)
  });
};
var ZodSymbol = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.symbol) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.symbol,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodSymbol.create = (params) => {
  return new ZodSymbol({
    typeName: ZodFirstPartyTypeKind.ZodSymbol,
    ...processCreateParams(params)
  });
};
var ZodUndefined = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.undefined,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodUndefined.create = (params) => {
  return new ZodUndefined({
    typeName: ZodFirstPartyTypeKind.ZodUndefined,
    ...processCreateParams(params)
  });
};
var ZodNull = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.null) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.null,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodNull.create = (params) => {
  return new ZodNull({
    typeName: ZodFirstPartyTypeKind.ZodNull,
    ...processCreateParams(params)
  });
};
var ZodAny = class extends ZodType {
  constructor() {
    super(...arguments);
    this._any = true;
  }
  _parse(input) {
    return OK(input.data);
  }
};
ZodAny.create = (params) => {
  return new ZodAny({
    typeName: ZodFirstPartyTypeKind.ZodAny,
    ...processCreateParams(params)
  });
};
var ZodUnknown = class extends ZodType {
  constructor() {
    super(...arguments);
    this._unknown = true;
  }
  _parse(input) {
    return OK(input.data);
  }
};
ZodUnknown.create = (params) => {
  return new ZodUnknown({
    typeName: ZodFirstPartyTypeKind.ZodUnknown,
    ...processCreateParams(params)
  });
};
var ZodNever = class extends ZodType {
  _parse(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.never,
      received: ctx.parsedType
    });
    return INVALID;
  }
};
ZodNever.create = (params) => {
  return new ZodNever({
    typeName: ZodFirstPartyTypeKind.ZodNever,
    ...processCreateParams(params)
  });
};
var ZodVoid = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.void,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodVoid.create = (params) => {
  return new ZodVoid({
    typeName: ZodFirstPartyTypeKind.ZodVoid,
    ...processCreateParams(params)
  });
};
var ZodArray = class _ZodArray extends ZodType {
  _parse(input) {
    const { ctx, status } = this._processInputParams(input);
    const def = this._def;
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (def.exactLength !== null) {
      const tooBig = ctx.data.length > def.exactLength.value;
      const tooSmall = ctx.data.length < def.exactLength.value;
      if (tooBig || tooSmall) {
        addIssueToContext(ctx, {
          code: tooBig ? ZodIssueCode.too_big : ZodIssueCode.too_small,
          minimum: tooSmall ? def.exactLength.value : void 0,
          maximum: tooBig ? def.exactLength.value : void 0,
          type: "array",
          inclusive: true,
          exact: true,
          message: def.exactLength.message
        });
        status.dirty();
      }
    }
    if (def.minLength !== null) {
      if (ctx.data.length < def.minLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.minLength.message
        });
        status.dirty();
      }
    }
    if (def.maxLength !== null) {
      if (ctx.data.length > def.maxLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.maxLength.message
        });
        status.dirty();
      }
    }
    if (ctx.common.async) {
      return Promise.all([...ctx.data].map((item, i) => {
        return def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i));
      })).then((result2) => {
        return ParseStatus.mergeArray(status, result2);
      });
    }
    const result = [...ctx.data].map((item, i) => {
      return def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i));
    });
    return ParseStatus.mergeArray(status, result);
  }
  get element() {
    return this._def.type;
  }
  min(minLength, message) {
    return new _ZodArray({
      ...this._def,
      minLength: { value: minLength, message: errorUtil.toString(message) }
    });
  }
  max(maxLength, message) {
    return new _ZodArray({
      ...this._def,
      maxLength: { value: maxLength, message: errorUtil.toString(message) }
    });
  }
  length(len, message) {
    return new _ZodArray({
      ...this._def,
      exactLength: { value: len, message: errorUtil.toString(message) }
    });
  }
  nonempty(message) {
    return this.min(1, message);
  }
};
ZodArray.create = (schema, params) => {
  return new ZodArray({
    type: schema,
    minLength: null,
    maxLength: null,
    exactLength: null,
    typeName: ZodFirstPartyTypeKind.ZodArray,
    ...processCreateParams(params)
  });
};
function deepPartialify(schema) {
  if (schema instanceof ZodObject) {
    const newShape = {};
    for (const key in schema.shape) {
      const fieldSchema = schema.shape[key];
      newShape[key] = ZodOptional.create(deepPartialify(fieldSchema));
    }
    return new ZodObject({
      ...schema._def,
      shape: () => newShape
    });
  } else if (schema instanceof ZodArray) {
    return new ZodArray({
      ...schema._def,
      type: deepPartialify(schema.element)
    });
  } else if (schema instanceof ZodOptional) {
    return ZodOptional.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodNullable) {
    return ZodNullable.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodTuple) {
    return ZodTuple.create(schema.items.map((item) => deepPartialify(item)));
  } else {
    return schema;
  }
}
var ZodObject = class _ZodObject extends ZodType {
  constructor() {
    super(...arguments);
    this._cached = null;
    this.nonstrict = this.passthrough;
    this.augment = this.extend;
  }
  _getCached() {
    if (this._cached !== null)
      return this._cached;
    const shape = this._def.shape();
    const keys = util.objectKeys(shape);
    this._cached = { shape, keys };
    return this._cached;
  }
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.object) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const { status, ctx } = this._processInputParams(input);
    const { shape, keys: shapeKeys } = this._getCached();
    const extraKeys = [];
    if (!(this._def.catchall instanceof ZodNever && this._def.unknownKeys === "strip")) {
      for (const key in ctx.data) {
        if (!shapeKeys.includes(key)) {
          extraKeys.push(key);
        }
      }
    }
    const pairs = [];
    for (const key of shapeKeys) {
      const keyValidator = shape[key];
      const value = ctx.data[key];
      pairs.push({
        key: { status: "valid", value: key },
        value: keyValidator._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (this._def.catchall instanceof ZodNever) {
      const unknownKeys = this._def.unknownKeys;
      if (unknownKeys === "passthrough") {
        for (const key of extraKeys) {
          pairs.push({
            key: { status: "valid", value: key },
            value: { status: "valid", value: ctx.data[key] }
          });
        }
      } else if (unknownKeys === "strict") {
        if (extraKeys.length > 0) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.unrecognized_keys,
            keys: extraKeys
          });
          status.dirty();
        }
      } else if (unknownKeys === "strip") {
      } else {
        throw new Error(`Internal ZodObject error: invalid unknownKeys value.`);
      }
    } else {
      const catchall = this._def.catchall;
      for (const key of extraKeys) {
        const value = ctx.data[key];
        pairs.push({
          key: { status: "valid", value: key },
          value: catchall._parse(
            new ParseInputLazyPath(ctx, value, ctx.path, key)
            //, ctx.child(key), value, getParsedType(value)
          ),
          alwaysSet: key in ctx.data
        });
      }
    }
    if (ctx.common.async) {
      return Promise.resolve().then(async () => {
        const syncPairs = [];
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          syncPairs.push({
            key,
            value,
            alwaysSet: pair.alwaysSet
          });
        }
        return syncPairs;
      }).then((syncPairs) => {
        return ParseStatus.mergeObjectSync(status, syncPairs);
      });
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get shape() {
    return this._def.shape();
  }
  strict(message) {
    errorUtil.errToObj;
    return new _ZodObject({
      ...this._def,
      unknownKeys: "strict",
      ...message !== void 0 ? {
        errorMap: (issue, ctx) => {
          const defaultError = this._def.errorMap?.(issue, ctx).message ?? ctx.defaultError;
          if (issue.code === "unrecognized_keys")
            return {
              message: errorUtil.errToObj(message).message ?? defaultError
            };
          return {
            message: defaultError
          };
        }
      } : {}
    });
  }
  strip() {
    return new _ZodObject({
      ...this._def,
      unknownKeys: "strip"
    });
  }
  passthrough() {
    return new _ZodObject({
      ...this._def,
      unknownKeys: "passthrough"
    });
  }
  // const AugmentFactory =
  //   <Def extends ZodObjectDef>(def: Def) =>
  //   <Augmentation extends ZodRawShape>(
  //     augmentation: Augmentation
  //   ): ZodObject<
  //     extendShape<ReturnType<Def["shape"]>, Augmentation>,
  //     Def["unknownKeys"],
  //     Def["catchall"]
  //   > => {
  //     return new ZodObject({
  //       ...def,
  //       shape: () => ({
  //         ...def.shape(),
  //         ...augmentation,
  //       }),
  //     }) as any;
  //   };
  extend(augmentation) {
    return new _ZodObject({
      ...this._def,
      shape: () => ({
        ...this._def.shape(),
        ...augmentation
      })
    });
  }
  /**
   * Prior to zod@1.0.12 there was a bug in the
   * inferred type of merged objects. Please
   * upgrade if you are experiencing issues.
   */
  merge(merging) {
    const merged = new _ZodObject({
      unknownKeys: merging._def.unknownKeys,
      catchall: merging._def.catchall,
      shape: () => ({
        ...this._def.shape(),
        ...merging._def.shape()
      }),
      typeName: ZodFirstPartyTypeKind.ZodObject
    });
    return merged;
  }
  // merge<
  //   Incoming extends AnyZodObject,
  //   Augmentation extends Incoming["shape"],
  //   NewOutput extends {
  //     [k in keyof Augmentation | keyof Output]: k extends keyof Augmentation
  //       ? Augmentation[k]["_output"]
  //       : k extends keyof Output
  //       ? Output[k]
  //       : never;
  //   },
  //   NewInput extends {
  //     [k in keyof Augmentation | keyof Input]: k extends keyof Augmentation
  //       ? Augmentation[k]["_input"]
  //       : k extends keyof Input
  //       ? Input[k]
  //       : never;
  //   }
  // >(
  //   merging: Incoming
  // ): ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"],
  //   NewOutput,
  //   NewInput
  // > {
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  setKey(key, schema) {
    return this.augment({ [key]: schema });
  }
  // merge<Incoming extends AnyZodObject>(
  //   merging: Incoming
  // ): //ZodObject<T & Incoming["_shape"], UnknownKeys, Catchall> = (merging) => {
  // ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"]
  // > {
  //   // const mergedShape = objectUtil.mergeShapes(
  //   //   this._def.shape(),
  //   //   merging._def.shape()
  //   // );
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  catchall(index) {
    return new _ZodObject({
      ...this._def,
      catchall: index
    });
  }
  pick(mask) {
    const shape = {};
    for (const key of util.objectKeys(mask)) {
      if (mask[key] && this.shape[key]) {
        shape[key] = this.shape[key];
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => shape
    });
  }
  omit(mask) {
    const shape = {};
    for (const key of util.objectKeys(this.shape)) {
      if (!mask[key]) {
        shape[key] = this.shape[key];
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => shape
    });
  }
  /**
   * @deprecated
   */
  deepPartial() {
    return deepPartialify(this);
  }
  partial(mask) {
    const newShape = {};
    for (const key of util.objectKeys(this.shape)) {
      const fieldSchema = this.shape[key];
      if (mask && !mask[key]) {
        newShape[key] = fieldSchema;
      } else {
        newShape[key] = fieldSchema.optional();
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => newShape
    });
  }
  required(mask) {
    const newShape = {};
    for (const key of util.objectKeys(this.shape)) {
      if (mask && !mask[key]) {
        newShape[key] = this.shape[key];
      } else {
        const fieldSchema = this.shape[key];
        let newField = fieldSchema;
        while (newField instanceof ZodOptional) {
          newField = newField._def.innerType;
        }
        newShape[key] = newField;
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => newShape
    });
  }
  keyof() {
    return createZodEnum(util.objectKeys(this.shape));
  }
};
ZodObject.create = (shape, params) => {
  return new ZodObject({
    shape: () => shape,
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject.strictCreate = (shape, params) => {
  return new ZodObject({
    shape: () => shape,
    unknownKeys: "strict",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject.lazycreate = (shape, params) => {
  return new ZodObject({
    shape,
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
var ZodUnion = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const options = this._def.options;
    function handleResults(results) {
      for (const result of results) {
        if (result.result.status === "valid") {
          return result.result;
        }
      }
      for (const result of results) {
        if (result.result.status === "dirty") {
          ctx.common.issues.push(...result.ctx.common.issues);
          return result.result;
        }
      }
      const unionErrors = results.map((result) => new ZodError(result.ctx.common.issues));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
    if (ctx.common.async) {
      return Promise.all(options.map(async (option) => {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        return {
          result: await option._parseAsync({
            data: ctx.data,
            path: ctx.path,
            parent: childCtx
          }),
          ctx: childCtx
        };
      })).then(handleResults);
    } else {
      let dirty = void 0;
      const issues = [];
      for (const option of options) {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        const result = option._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: childCtx
        });
        if (result.status === "valid") {
          return result;
        } else if (result.status === "dirty" && !dirty) {
          dirty = { result, ctx: childCtx };
        }
        if (childCtx.common.issues.length) {
          issues.push(childCtx.common.issues);
        }
      }
      if (dirty) {
        ctx.common.issues.push(...dirty.ctx.common.issues);
        return dirty.result;
      }
      const unionErrors = issues.map((issues2) => new ZodError(issues2));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
  }
  get options() {
    return this._def.options;
  }
};
ZodUnion.create = (types, params) => {
  return new ZodUnion({
    options: types,
    typeName: ZodFirstPartyTypeKind.ZodUnion,
    ...processCreateParams(params)
  });
};
var getDiscriminator = (type) => {
  if (type instanceof ZodLazy) {
    return getDiscriminator(type.schema);
  } else if (type instanceof ZodEffects) {
    return getDiscriminator(type.innerType());
  } else if (type instanceof ZodLiteral) {
    return [type.value];
  } else if (type instanceof ZodEnum) {
    return type.options;
  } else if (type instanceof ZodNativeEnum) {
    return util.objectValues(type.enum);
  } else if (type instanceof ZodDefault) {
    return getDiscriminator(type._def.innerType);
  } else if (type instanceof ZodUndefined) {
    return [void 0];
  } else if (type instanceof ZodNull) {
    return [null];
  } else if (type instanceof ZodOptional) {
    return [void 0, ...getDiscriminator(type.unwrap())];
  } else if (type instanceof ZodNullable) {
    return [null, ...getDiscriminator(type.unwrap())];
  } else if (type instanceof ZodBranded) {
    return getDiscriminator(type.unwrap());
  } else if (type instanceof ZodReadonly) {
    return getDiscriminator(type.unwrap());
  } else if (type instanceof ZodCatch) {
    return getDiscriminator(type._def.innerType);
  } else {
    return [];
  }
};
var ZodDiscriminatedUnion = class _ZodDiscriminatedUnion extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const discriminator = this.discriminator;
    const discriminatorValue = ctx.data[discriminator];
    const option = this.optionsMap.get(discriminatorValue);
    if (!option) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union_discriminator,
        options: Array.from(this.optionsMap.keys()),
        path: [discriminator]
      });
      return INVALID;
    }
    if (ctx.common.async) {
      return option._parseAsync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    } else {
      return option._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    }
  }
  get discriminator() {
    return this._def.discriminator;
  }
  get options() {
    return this._def.options;
  }
  get optionsMap() {
    return this._def.optionsMap;
  }
  /**
   * The constructor of the discriminated union schema. Its behaviour is very similar to that of the normal z.union() constructor.
   * However, it only allows a union of objects, all of which need to share a discriminator property. This property must
   * have a different value for each object in the union.
   * @param discriminator the name of the discriminator property
   * @param types an array of object schemas
   * @param params
   */
  static create(discriminator, options, params) {
    const optionsMap = /* @__PURE__ */ new Map();
    for (const type of options) {
      const discriminatorValues = getDiscriminator(type.shape[discriminator]);
      if (!discriminatorValues.length) {
        throw new Error(`A discriminator value for key \`${discriminator}\` could not be extracted from all schema options`);
      }
      for (const value of discriminatorValues) {
        if (optionsMap.has(value)) {
          throw new Error(`Discriminator property ${String(discriminator)} has duplicate value ${String(value)}`);
        }
        optionsMap.set(value, type);
      }
    }
    return new _ZodDiscriminatedUnion({
      typeName: ZodFirstPartyTypeKind.ZodDiscriminatedUnion,
      discriminator,
      options,
      optionsMap,
      ...processCreateParams(params)
    });
  }
};
function mergeValues(a, b) {
  const aType = getParsedType(a);
  const bType = getParsedType(b);
  if (a === b) {
    return { valid: true, data: a };
  } else if (aType === ZodParsedType.object && bType === ZodParsedType.object) {
    const bKeys = util.objectKeys(b);
    const sharedKeys = util.objectKeys(a).filter((key) => bKeys.indexOf(key) !== -1);
    const newObj = { ...a, ...b };
    for (const key of sharedKeys) {
      const sharedValue = mergeValues(a[key], b[key]);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newObj[key] = sharedValue.data;
    }
    return { valid: true, data: newObj };
  } else if (aType === ZodParsedType.array && bType === ZodParsedType.array) {
    if (a.length !== b.length) {
      return { valid: false };
    }
    const newArray = [];
    for (let index = 0; index < a.length; index++) {
      const itemA = a[index];
      const itemB = b[index];
      const sharedValue = mergeValues(itemA, itemB);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newArray.push(sharedValue.data);
    }
    return { valid: true, data: newArray };
  } else if (aType === ZodParsedType.date && bType === ZodParsedType.date && +a === +b) {
    return { valid: true, data: a };
  } else {
    return { valid: false };
  }
}
var ZodIntersection = class extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const handleParsed = (parsedLeft, parsedRight) => {
      if (isAborted(parsedLeft) || isAborted(parsedRight)) {
        return INVALID;
      }
      const merged = mergeValues(parsedLeft.value, parsedRight.value);
      if (!merged.valid) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_intersection_types
        });
        return INVALID;
      }
      if (isDirty(parsedLeft) || isDirty(parsedRight)) {
        status.dirty();
      }
      return { status: status.value, value: merged.data };
    };
    if (ctx.common.async) {
      return Promise.all([
        this._def.left._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        }),
        this._def.right._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        })
      ]).then(([left, right]) => handleParsed(left, right));
    } else {
      return handleParsed(this._def.left._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }), this._def.right._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }));
    }
  }
};
ZodIntersection.create = (left, right, params) => {
  return new ZodIntersection({
    left,
    right,
    typeName: ZodFirstPartyTypeKind.ZodIntersection,
    ...processCreateParams(params)
  });
};
var ZodTuple = class _ZodTuple extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (ctx.data.length < this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_small,
        minimum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      return INVALID;
    }
    const rest = this._def.rest;
    if (!rest && ctx.data.length > this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_big,
        maximum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      status.dirty();
    }
    const items = [...ctx.data].map((item, itemIndex) => {
      const schema = this._def.items[itemIndex] || this._def.rest;
      if (!schema)
        return null;
      return schema._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex));
    }).filter((x) => !!x);
    if (ctx.common.async) {
      return Promise.all(items).then((results) => {
        return ParseStatus.mergeArray(status, results);
      });
    } else {
      return ParseStatus.mergeArray(status, items);
    }
  }
  get items() {
    return this._def.items;
  }
  rest(rest) {
    return new _ZodTuple({
      ...this._def,
      rest
    });
  }
};
ZodTuple.create = (schemas, params) => {
  if (!Array.isArray(schemas)) {
    throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
  }
  return new ZodTuple({
    items: schemas,
    typeName: ZodFirstPartyTypeKind.ZodTuple,
    rest: null,
    ...processCreateParams(params)
  });
};
var ZodRecord = class _ZodRecord extends ZodType {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const pairs = [];
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    for (const key in ctx.data) {
      pairs.push({
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, key)),
        value: valueType._parse(new ParseInputLazyPath(ctx, ctx.data[key], ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (ctx.common.async) {
      return ParseStatus.mergeObjectAsync(status, pairs);
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get element() {
    return this._def.valueType;
  }
  static create(first, second, third) {
    if (second instanceof ZodType) {
      return new _ZodRecord({
        keyType: first,
        valueType: second,
        typeName: ZodFirstPartyTypeKind.ZodRecord,
        ...processCreateParams(third)
      });
    }
    return new _ZodRecord({
      keyType: ZodString.create(),
      valueType: first,
      typeName: ZodFirstPartyTypeKind.ZodRecord,
      ...processCreateParams(second)
    });
  }
};
var ZodMap = class extends ZodType {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.map) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.map,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    const pairs = [...ctx.data.entries()].map(([key, value], index) => {
      return {
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [index, "key"])),
        value: valueType._parse(new ParseInputLazyPath(ctx, value, ctx.path, [index, "value"]))
      };
    });
    if (ctx.common.async) {
      const finalMap = /* @__PURE__ */ new Map();
      return Promise.resolve().then(async () => {
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          if (key.status === "aborted" || value.status === "aborted") {
            return INVALID;
          }
          if (key.status === "dirty" || value.status === "dirty") {
            status.dirty();
          }
          finalMap.set(key.value, value.value);
        }
        return { status: status.value, value: finalMap };
      });
    } else {
      const finalMap = /* @__PURE__ */ new Map();
      for (const pair of pairs) {
        const key = pair.key;
        const value = pair.value;
        if (key.status === "aborted" || value.status === "aborted") {
          return INVALID;
        }
        if (key.status === "dirty" || value.status === "dirty") {
          status.dirty();
        }
        finalMap.set(key.value, value.value);
      }
      return { status: status.value, value: finalMap };
    }
  }
};
ZodMap.create = (keyType, valueType, params) => {
  return new ZodMap({
    valueType,
    keyType,
    typeName: ZodFirstPartyTypeKind.ZodMap,
    ...processCreateParams(params)
  });
};
var ZodSet = class _ZodSet extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.set) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.set,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const def = this._def;
    if (def.minSize !== null) {
      if (ctx.data.size < def.minSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.minSize.message
        });
        status.dirty();
      }
    }
    if (def.maxSize !== null) {
      if (ctx.data.size > def.maxSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.maxSize.message
        });
        status.dirty();
      }
    }
    const valueType = this._def.valueType;
    function finalizeSet(elements2) {
      const parsedSet = /* @__PURE__ */ new Set();
      for (const element of elements2) {
        if (element.status === "aborted")
          return INVALID;
        if (element.status === "dirty")
          status.dirty();
        parsedSet.add(element.value);
      }
      return { status: status.value, value: parsedSet };
    }
    const elements = [...ctx.data.values()].map((item, i) => valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i)));
    if (ctx.common.async) {
      return Promise.all(elements).then((elements2) => finalizeSet(elements2));
    } else {
      return finalizeSet(elements);
    }
  }
  min(minSize, message) {
    return new _ZodSet({
      ...this._def,
      minSize: { value: minSize, message: errorUtil.toString(message) }
    });
  }
  max(maxSize, message) {
    return new _ZodSet({
      ...this._def,
      maxSize: { value: maxSize, message: errorUtil.toString(message) }
    });
  }
  size(size, message) {
    return this.min(size, message).max(size, message);
  }
  nonempty(message) {
    return this.min(1, message);
  }
};
ZodSet.create = (valueType, params) => {
  return new ZodSet({
    valueType,
    minSize: null,
    maxSize: null,
    typeName: ZodFirstPartyTypeKind.ZodSet,
    ...processCreateParams(params)
  });
};
var ZodFunction = class _ZodFunction extends ZodType {
  constructor() {
    super(...arguments);
    this.validate = this.implement;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.function) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.function,
        received: ctx.parsedType
      });
      return INVALID;
    }
    function makeArgsIssue(args, error) {
      return makeIssue({
        data: args,
        path: ctx.path,
        errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode.invalid_arguments,
          argumentsError: error
        }
      });
    }
    function makeReturnsIssue(returns, error) {
      return makeIssue({
        data: returns,
        path: ctx.path,
        errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode.invalid_return_type,
          returnTypeError: error
        }
      });
    }
    const params = { errorMap: ctx.common.contextualErrorMap };
    const fn = ctx.data;
    if (this._def.returns instanceof ZodPromise) {
      const me = this;
      return OK(async function(...args) {
        const error = new ZodError([]);
        const parsedArgs = await me._def.args.parseAsync(args, params).catch((e) => {
          error.addIssue(makeArgsIssue(args, e));
          throw error;
        });
        const result = await Reflect.apply(fn, this, parsedArgs);
        const parsedReturns = await me._def.returns._def.type.parseAsync(result, params).catch((e) => {
          error.addIssue(makeReturnsIssue(result, e));
          throw error;
        });
        return parsedReturns;
      });
    } else {
      const me = this;
      return OK(function(...args) {
        const parsedArgs = me._def.args.safeParse(args, params);
        if (!parsedArgs.success) {
          throw new ZodError([makeArgsIssue(args, parsedArgs.error)]);
        }
        const result = Reflect.apply(fn, this, parsedArgs.data);
        const parsedReturns = me._def.returns.safeParse(result, params);
        if (!parsedReturns.success) {
          throw new ZodError([makeReturnsIssue(result, parsedReturns.error)]);
        }
        return parsedReturns.data;
      });
    }
  }
  parameters() {
    return this._def.args;
  }
  returnType() {
    return this._def.returns;
  }
  args(...items) {
    return new _ZodFunction({
      ...this._def,
      args: ZodTuple.create(items).rest(ZodUnknown.create())
    });
  }
  returns(returnType) {
    return new _ZodFunction({
      ...this._def,
      returns: returnType
    });
  }
  implement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  strictImplement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  static create(args, returns, params) {
    return new _ZodFunction({
      args: args ? args : ZodTuple.create([]).rest(ZodUnknown.create()),
      returns: returns || ZodUnknown.create(),
      typeName: ZodFirstPartyTypeKind.ZodFunction,
      ...processCreateParams(params)
    });
  }
};
var ZodLazy = class extends ZodType {
  get schema() {
    return this._def.getter();
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const lazySchema = this._def.getter();
    return lazySchema._parse({ data: ctx.data, path: ctx.path, parent: ctx });
  }
};
ZodLazy.create = (getter, params) => {
  return new ZodLazy({
    getter,
    typeName: ZodFirstPartyTypeKind.ZodLazy,
    ...processCreateParams(params)
  });
};
var ZodLiteral = class extends ZodType {
  _parse(input) {
    if (input.data !== this._def.value) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_literal,
        expected: this._def.value
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
  get value() {
    return this._def.value;
  }
};
ZodLiteral.create = (value, params) => {
  return new ZodLiteral({
    value,
    typeName: ZodFirstPartyTypeKind.ZodLiteral,
    ...processCreateParams(params)
  });
};
function createZodEnum(values, params) {
  return new ZodEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodEnum,
    ...processCreateParams(params)
  });
}
var ZodEnum = class _ZodEnum extends ZodType {
  _parse(input) {
    if (typeof input.data !== "string") {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (!this._cache) {
      this._cache = new Set(this._def.values);
    }
    if (!this._cache.has(input.data)) {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get options() {
    return this._def.values;
  }
  get enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Values() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  extract(values, newDef = this._def) {
    return _ZodEnum.create(values, {
      ...this._def,
      ...newDef
    });
  }
  exclude(values, newDef = this._def) {
    return _ZodEnum.create(this.options.filter((opt) => !values.includes(opt)), {
      ...this._def,
      ...newDef
    });
  }
};
ZodEnum.create = createZodEnum;
var ZodNativeEnum = class extends ZodType {
  _parse(input) {
    const nativeEnumValues = util.getValidEnumValues(this._def.values);
    const ctx = this._getOrReturnCtx(input);
    if (ctx.parsedType !== ZodParsedType.string && ctx.parsedType !== ZodParsedType.number) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (!this._cache) {
      this._cache = new Set(util.getValidEnumValues(this._def.values));
    }
    if (!this._cache.has(input.data)) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get enum() {
    return this._def.values;
  }
};
ZodNativeEnum.create = (values, params) => {
  return new ZodNativeEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodNativeEnum,
    ...processCreateParams(params)
  });
};
var ZodPromise = class extends ZodType {
  unwrap() {
    return this._def.type;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.promise && ctx.common.async === false) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.promise,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const promisified = ctx.parsedType === ZodParsedType.promise ? ctx.data : Promise.resolve(ctx.data);
    return OK(promisified.then((data) => {
      return this._def.type.parseAsync(data, {
        path: ctx.path,
        errorMap: ctx.common.contextualErrorMap
      });
    }));
  }
};
ZodPromise.create = (schema, params) => {
  return new ZodPromise({
    type: schema,
    typeName: ZodFirstPartyTypeKind.ZodPromise,
    ...processCreateParams(params)
  });
};
var ZodEffects = class extends ZodType {
  innerType() {
    return this._def.schema;
  }
  sourceType() {
    return this._def.schema._def.typeName === ZodFirstPartyTypeKind.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const effect = this._def.effect || null;
    const checkCtx = {
      addIssue: (arg) => {
        addIssueToContext(ctx, arg);
        if (arg.fatal) {
          status.abort();
        } else {
          status.dirty();
        }
      },
      get path() {
        return ctx.path;
      }
    };
    checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx);
    if (effect.type === "preprocess") {
      const processed = effect.transform(ctx.data, checkCtx);
      if (ctx.common.async) {
        return Promise.resolve(processed).then(async (processed2) => {
          if (status.value === "aborted")
            return INVALID;
          const result = await this._def.schema._parseAsync({
            data: processed2,
            path: ctx.path,
            parent: ctx
          });
          if (result.status === "aborted")
            return INVALID;
          if (result.status === "dirty")
            return DIRTY(result.value);
          if (status.value === "dirty")
            return DIRTY(result.value);
          return result;
        });
      } else {
        if (status.value === "aborted")
          return INVALID;
        const result = this._def.schema._parseSync({
          data: processed,
          path: ctx.path,
          parent: ctx
        });
        if (result.status === "aborted")
          return INVALID;
        if (result.status === "dirty")
          return DIRTY(result.value);
        if (status.value === "dirty")
          return DIRTY(result.value);
        return result;
      }
    }
    if (effect.type === "refinement") {
      const executeRefinement = (acc) => {
        const result = effect.refinement(acc, checkCtx);
        if (ctx.common.async) {
          return Promise.resolve(result);
        }
        if (result instanceof Promise) {
          throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
        }
        return acc;
      };
      if (ctx.common.async === false) {
        const inner = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inner.status === "aborted")
          return INVALID;
        if (inner.status === "dirty")
          status.dirty();
        executeRefinement(inner.value);
        return { status: status.value, value: inner.value };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((inner) => {
          if (inner.status === "aborted")
            return INVALID;
          if (inner.status === "dirty")
            status.dirty();
          return executeRefinement(inner.value).then(() => {
            return { status: status.value, value: inner.value };
          });
        });
      }
    }
    if (effect.type === "transform") {
      if (ctx.common.async === false) {
        const base = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (!isValid(base))
          return INVALID;
        const result = effect.transform(base.value, checkCtx);
        if (result instanceof Promise) {
          throw new Error(`Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.`);
        }
        return { status: status.value, value: result };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((base) => {
          if (!isValid(base))
            return INVALID;
          return Promise.resolve(effect.transform(base.value, checkCtx)).then((result) => ({
            status: status.value,
            value: result
          }));
        });
      }
    }
    util.assertNever(effect);
  }
};
ZodEffects.create = (schema, effect, params) => {
  return new ZodEffects({
    schema,
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    effect,
    ...processCreateParams(params)
  });
};
ZodEffects.createWithPreprocess = (preprocess, schema, params) => {
  return new ZodEffects({
    schema,
    effect: { type: "preprocess", transform: preprocess },
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    ...processCreateParams(params)
  });
};
var ZodOptional = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.undefined) {
      return OK(void 0);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodOptional.create = (type, params) => {
  return new ZodOptional({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodOptional,
    ...processCreateParams(params)
  });
};
var ZodNullable = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.null) {
      return OK(null);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodNullable.create = (type, params) => {
  return new ZodNullable({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodNullable,
    ...processCreateParams(params)
  });
};
var ZodDefault = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    let data = ctx.data;
    if (ctx.parsedType === ZodParsedType.undefined) {
      data = this._def.defaultValue();
    }
    return this._def.innerType._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  removeDefault() {
    return this._def.innerType;
  }
};
ZodDefault.create = (type, params) => {
  return new ZodDefault({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodDefault,
    defaultValue: typeof params.default === "function" ? params.default : () => params.default,
    ...processCreateParams(params)
  });
};
var ZodCatch = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const newCtx = {
      ...ctx,
      common: {
        ...ctx.common,
        issues: []
      }
    };
    const result = this._def.innerType._parse({
      data: newCtx.data,
      path: newCtx.path,
      parent: {
        ...newCtx
      }
    });
    if (isAsync(result)) {
      return result.then((result2) => {
        return {
          status: "valid",
          value: result2.status === "valid" ? result2.value : this._def.catchValue({
            get error() {
              return new ZodError(newCtx.common.issues);
            },
            input: newCtx.data
          })
        };
      });
    } else {
      return {
        status: "valid",
        value: result.status === "valid" ? result.value : this._def.catchValue({
          get error() {
            return new ZodError(newCtx.common.issues);
          },
          input: newCtx.data
        })
      };
    }
  }
  removeCatch() {
    return this._def.innerType;
  }
};
ZodCatch.create = (type, params) => {
  return new ZodCatch({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodCatch,
    catchValue: typeof params.catch === "function" ? params.catch : () => params.catch,
    ...processCreateParams(params)
  });
};
var ZodNaN = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.nan) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.nan,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
};
ZodNaN.create = (params) => {
  return new ZodNaN({
    typeName: ZodFirstPartyTypeKind.ZodNaN,
    ...processCreateParams(params)
  });
};
var BRAND = Symbol("zod_brand");
var ZodBranded = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const data = ctx.data;
    return this._def.type._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  unwrap() {
    return this._def.type;
  }
};
var ZodPipeline = class _ZodPipeline extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.common.async) {
      const handleAsync = async () => {
        const inResult = await this._def.in._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inResult.status === "aborted")
          return INVALID;
        if (inResult.status === "dirty") {
          status.dirty();
          return DIRTY(inResult.value);
        } else {
          return this._def.out._parseAsync({
            data: inResult.value,
            path: ctx.path,
            parent: ctx
          });
        }
      };
      return handleAsync();
    } else {
      const inResult = this._def.in._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
      if (inResult.status === "aborted")
        return INVALID;
      if (inResult.status === "dirty") {
        status.dirty();
        return {
          status: "dirty",
          value: inResult.value
        };
      } else {
        return this._def.out._parseSync({
          data: inResult.value,
          path: ctx.path,
          parent: ctx
        });
      }
    }
  }
  static create(a, b) {
    return new _ZodPipeline({
      in: a,
      out: b,
      typeName: ZodFirstPartyTypeKind.ZodPipeline
    });
  }
};
var ZodReadonly = class extends ZodType {
  _parse(input) {
    const result = this._def.innerType._parse(input);
    const freeze = (data) => {
      if (isValid(data)) {
        data.value = Object.freeze(data.value);
      }
      return data;
    };
    return isAsync(result) ? result.then((data) => freeze(data)) : freeze(result);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodReadonly.create = (type, params) => {
  return new ZodReadonly({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodReadonly,
    ...processCreateParams(params)
  });
};
function cleanParams(params, data) {
  const p = typeof params === "function" ? params(data) : typeof params === "string" ? { message: params } : params;
  const p2 = typeof p === "string" ? { message: p } : p;
  return p2;
}
function custom(check, _params = {}, fatal) {
  if (check)
    return ZodAny.create().superRefine((data, ctx) => {
      const r = check(data);
      if (r instanceof Promise) {
        return r.then((r2) => {
          if (!r2) {
            const params = cleanParams(_params, data);
            const _fatal = params.fatal ?? fatal ?? true;
            ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
          }
        });
      }
      if (!r) {
        const params = cleanParams(_params, data);
        const _fatal = params.fatal ?? fatal ?? true;
        ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
      }
      return;
    });
  return ZodAny.create();
}
var late = {
  object: ZodObject.lazycreate
};
var ZodFirstPartyTypeKind;
(function(ZodFirstPartyTypeKind2) {
  ZodFirstPartyTypeKind2["ZodString"] = "ZodString";
  ZodFirstPartyTypeKind2["ZodNumber"] = "ZodNumber";
  ZodFirstPartyTypeKind2["ZodNaN"] = "ZodNaN";
  ZodFirstPartyTypeKind2["ZodBigInt"] = "ZodBigInt";
  ZodFirstPartyTypeKind2["ZodBoolean"] = "ZodBoolean";
  ZodFirstPartyTypeKind2["ZodDate"] = "ZodDate";
  ZodFirstPartyTypeKind2["ZodSymbol"] = "ZodSymbol";
  ZodFirstPartyTypeKind2["ZodUndefined"] = "ZodUndefined";
  ZodFirstPartyTypeKind2["ZodNull"] = "ZodNull";
  ZodFirstPartyTypeKind2["ZodAny"] = "ZodAny";
  ZodFirstPartyTypeKind2["ZodUnknown"] = "ZodUnknown";
  ZodFirstPartyTypeKind2["ZodNever"] = "ZodNever";
  ZodFirstPartyTypeKind2["ZodVoid"] = "ZodVoid";
  ZodFirstPartyTypeKind2["ZodArray"] = "ZodArray";
  ZodFirstPartyTypeKind2["ZodObject"] = "ZodObject";
  ZodFirstPartyTypeKind2["ZodUnion"] = "ZodUnion";
  ZodFirstPartyTypeKind2["ZodDiscriminatedUnion"] = "ZodDiscriminatedUnion";
  ZodFirstPartyTypeKind2["ZodIntersection"] = "ZodIntersection";
  ZodFirstPartyTypeKind2["ZodTuple"] = "ZodTuple";
  ZodFirstPartyTypeKind2["ZodRecord"] = "ZodRecord";
  ZodFirstPartyTypeKind2["ZodMap"] = "ZodMap";
  ZodFirstPartyTypeKind2["ZodSet"] = "ZodSet";
  ZodFirstPartyTypeKind2["ZodFunction"] = "ZodFunction";
  ZodFirstPartyTypeKind2["ZodLazy"] = "ZodLazy";
  ZodFirstPartyTypeKind2["ZodLiteral"] = "ZodLiteral";
  ZodFirstPartyTypeKind2["ZodEnum"] = "ZodEnum";
  ZodFirstPartyTypeKind2["ZodEffects"] = "ZodEffects";
  ZodFirstPartyTypeKind2["ZodNativeEnum"] = "ZodNativeEnum";
  ZodFirstPartyTypeKind2["ZodOptional"] = "ZodOptional";
  ZodFirstPartyTypeKind2["ZodNullable"] = "ZodNullable";
  ZodFirstPartyTypeKind2["ZodDefault"] = "ZodDefault";
  ZodFirstPartyTypeKind2["ZodCatch"] = "ZodCatch";
  ZodFirstPartyTypeKind2["ZodPromise"] = "ZodPromise";
  ZodFirstPartyTypeKind2["ZodBranded"] = "ZodBranded";
  ZodFirstPartyTypeKind2["ZodPipeline"] = "ZodPipeline";
  ZodFirstPartyTypeKind2["ZodReadonly"] = "ZodReadonly";
})(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));
var instanceOfType = (cls, params = {
  message: `Input not instance of ${cls.name}`
}) => custom((data) => data instanceof cls, params);
var stringType = ZodString.create;
var numberType = ZodNumber.create;
var nanType = ZodNaN.create;
var bigIntType = ZodBigInt.create;
var booleanType = ZodBoolean.create;
var dateType = ZodDate.create;
var symbolType = ZodSymbol.create;
var undefinedType = ZodUndefined.create;
var nullType = ZodNull.create;
var anyType = ZodAny.create;
var unknownType = ZodUnknown.create;
var neverType = ZodNever.create;
var voidType = ZodVoid.create;
var arrayType = ZodArray.create;
var objectType = ZodObject.create;
var strictObjectType = ZodObject.strictCreate;
var unionType = ZodUnion.create;
var discriminatedUnionType = ZodDiscriminatedUnion.create;
var intersectionType = ZodIntersection.create;
var tupleType = ZodTuple.create;
var recordType = ZodRecord.create;
var mapType = ZodMap.create;
var setType = ZodSet.create;
var functionType = ZodFunction.create;
var lazyType = ZodLazy.create;
var literalType = ZodLiteral.create;
var enumType = ZodEnum.create;
var nativeEnumType = ZodNativeEnum.create;
var promiseType = ZodPromise.create;
var effectsType = ZodEffects.create;
var optionalType = ZodOptional.create;
var nullableType = ZodNullable.create;
var preprocessType = ZodEffects.createWithPreprocess;
var pipelineType = ZodPipeline.create;
var ostring = () => stringType().optional();
var onumber = () => numberType().optional();
var oboolean = () => booleanType().optional();
var coerce = {
  string: (arg) => ZodString.create({ ...arg, coerce: true }),
  number: (arg) => ZodNumber.create({ ...arg, coerce: true }),
  boolean: (arg) => ZodBoolean.create({
    ...arg,
    coerce: true
  }),
  bigint: (arg) => ZodBigInt.create({ ...arg, coerce: true }),
  date: (arg) => ZodDate.create({ ...arg, coerce: true })
};
var NEVER = INVALID;

// packages/utils/src/cv-shape.ts
var obj = (v) => {
  let cur = v;
  for (let depth = 0; depth < 2; depth++) {
    if (typeof cur !== "string")
      break;
    try {
      cur = JSON.parse(cur);
    } catch {
      return {};
    }
  }
  return cur && typeof cur === "object" && !Array.isArray(cur) ? cur : {};
};
var arr = (v) => Array.isArray(v) ? v.map(obj) : [];
var str = (v) => typeof v === "string" ? v : v == null ? "" : String(v);
var pick = (a, ...keys) => {
  for (const k of keys) {
    const v = a[k];
    if (v !== void 0 && v !== null && v !== "")
      return v;
  }
  return void 0;
};
function fill(target, from, map) {
  for (const [dest, src] of Object.entries(map)) {
    if (target[dest] === void 0 || target[dest] === "" || target[dest] === null) {
      const v = pick(from, src);
      if (v !== void 0)
        target[dest] = v;
    }
  }
  return target;
}
function personalBlock(raw) {
  return obj(pick(raw, "personalInfo", "personal", "personalDetails"));
}
function mapPersonal(raw, to) {
  const src = personalBlock(raw);
  const out2 = { ...src };
  if (to === "native") {
    fill(out2, src, { headline: "jobTitle", profilePhoto: "photo" });
    if (out2.jobTitle === void 0)
      out2.jobTitle = pick(src, "headline") ?? "";
  } else {
    fill(out2, src, { jobTitle: "headline", photo: "profilePhoto" });
    if (out2.headline === void 0)
      out2.headline = pick(src, "jobTitle") ?? "";
  }
  if (out2.fullName === void 0)
    out2.fullName = "";
  if (out2.email === void 0)
    out2.email = "";
  return out2;
}
function mapExperience(items, to) {
  return items.map((e) => {
    const out2 = { ...e };
    if (to === "native") {
      fill(out2, e, { title: "position", company: "employer" });
      if (out2.position === void 0)
        out2.position = pick(e, "title") ?? "";
    } else {
      fill(out2, e, { position: "title", employer: "company" });
      if (out2.title === void 0)
        out2.title = pick(e, "position") ?? "";
    }
    if (out2.keyAchievements === void 0)
      out2.keyAchievements = [];
    return out2;
  });
}
function mapEducation(items, to) {
  return items.map((e) => {
    const out2 = { ...e };
    if (to === "native")
      fill(out2, e, { graduationDate: "endDate" });
    else
      fill(out2, e, { endDate: "graduationDate" });
    return out2;
  });
}
function mapLanguages(items, to) {
  return items.map((l) => {
    const out2 = { ...l };
    if (to === "native")
      fill(out2, l, { language: "name" });
    else
      fill(out2, l, { name: "language" });
    return out2;
  });
}
function mapCertifications(items, to) {
  return items.map((c) => {
    const out2 = { ...c };
    if (to === "native")
      fill(out2, c, { issueDate: "date", credentialUrl: "url" });
    else
      fill(out2, c, { date: "issueDate", url: "credentialUrl" });
    return out2;
  });
}
function convert(raw, to) {
  const src = obj(raw);
  return {
    ...src,
    [to === "native" ? "personalInfo" : "personal"]: mapPersonal(src, to),
    summary: str(pick(src, "summary", "professionalSummary") ?? ""),
    experience: mapExperience(arr(src.experience), to),
    education: mapEducation(arr(src.education), to),
    skills: arr(src.skills).map((s) => ({ ...s, name: str(pick(s, "name", "skill") ?? "") })),
    certifications: mapCertifications(arr(src.certifications), to),
    languages: mapLanguages(arr(src.languages), to)
  };
}
function toStoredCvData(raw) {
  return convert(raw, "stored");
}

// apps/web/lib/templates/registry.ts
var TEMPLATE_REGISTRY = {
  "aberdare": {
    "id": "aberdare",
    "name": "Aberdare",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "professional-minimal",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "alpine": {
    "id": "alpine",
    "name": "Alpine",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "professional-minimal",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "altus": {
    "id": "altus",
    "name": "Altus",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "modern-specialist",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "apex": {
    "id": "apex",
    "name": "Apex",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "ats-optimized",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "ascent": {
    "id": "ascent",
    "name": "Ascent",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "athens": {
    "id": "athens",
    "name": "Athens",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "professional-minimal",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "athi": {
    "id": "athi",
    "name": "Athi",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "atlanta": {
    "id": "atlanta",
    "name": "Atlanta",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "professional-minimal",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "atlas-v2": {
    "id": "atlas-v2",
    "name": "Atlas v2",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "atlas": {
    "id": "atlas",
    "name": "Atlas",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "aurora-edge": {
    "id": "aurora-edge",
    "name": "Aurora Edge",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "aurora-two": {
    "id": "aurora-two",
    "name": "Aurora Two",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "austin": {
    "id": "austin",
    "name": "Austin",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "avant-garde-cv": {
    "id": "avant-garde-cv",
    "name": "Avant Garde",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "awash": {
    "id": "awash",
    "name": "Awash",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "axis": {
    "id": "axis",
    "name": "Axis",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "baltimore": {
    "id": "baltimore",
    "name": "Baltimore",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "bangweulu": {
    "id": "bangweulu",
    "name": "Bangweulu",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "baro": {
    "id": "baro",
    "name": "Baro",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "baroque-cv": {
    "id": "baroque-cv",
    "name": "Baroque",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "baskerville-cv": {
    "id": "baskerville-cv",
    "name": "Baskerville",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "bauhaus": {
    "id": "bauhaus",
    "name": "Bauhaus",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "bento": {
    "id": "bento",
    "name": "Bento",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "berlin": {
    "id": "berlin",
    "name": "Berlin",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "bloom": {
    "id": "bloom",
    "name": "Bloom",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "bodoni-cv": {
    "id": "bodoni-cv",
    "name": "Bodoni",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "boston": {
    "id": "boston",
    "name": "Boston",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "brisk": {
    "id": "brisk",
    "name": "Brisk",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "brutalist-cv": {
    "id": "brutalist-cv",
    "name": "Brutalist",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "budapest": {
    "id": "budapest",
    "name": "Budapest",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "busia": {
    "id": "busia",
    "name": "Busia",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "cameo": {
    "id": "cameo",
    "name": "Cameo",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "canvas-magazine": {
    "id": "canvas-magazine",
    "name": "Canvas Magazine",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "canyon": {
    "id": "canyon",
    "name": "Canyon",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "capsule": {
    "id": "capsule",
    "name": "Capsule",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "carbon": {
    "id": "carbon",
    "name": "Carbon",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "cascade": {
    "id": "cascade",
    "name": "Cascade",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "caslon": {
    "id": "caslon",
    "name": "Caslon",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "cavendish": {
    "id": "cavendish",
    "name": "Cavendish",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "celeste": {
    "id": "celeste",
    "name": "Celeste",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "charlotte": {
    "id": "charlotte",
    "name": "Charlotte",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "chicago": {
    "id": "chicago",
    "name": "Chicago",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "chrome": {
    "id": "chrome",
    "name": "Chrome",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "cincinnati": {
    "id": "cincinnati",
    "name": "Cincinnati",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "cipher": {
    "id": "cipher",
    "name": "Cipher",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "cirrus": {
    "id": "cirrus",
    "name": "Cirrus",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "clarendon-cv": {
    "id": "clarendon-cv",
    "name": "Clarendon",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "classical-cv": {
    "id": "classical-cv",
    "name": "Classical",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "clean-cv": {
    "id": "clean-cv",
    "name": "Clean",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "cobalt": {
    "id": "cobalt",
    "name": "Cobalt",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "cobblestone": {
    "id": "cobblestone",
    "name": "Cobblestone",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "cocoa": {
    "id": "cocoa",
    "name": "Cocoa",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "collage": {
    "id": "collage",
    "name": "Collage",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "console": {
    "id": "console",
    "name": "Console",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "constructivist": {
    "id": "constructivist",
    "name": "Constructivist",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "contour": {
    "id": "contour",
    "name": "Contour",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "copenhagen": {
    "id": "copenhagen",
    "name": "Copenhagen",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "coral": {
    "id": "coral",
    "name": "Coral",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "cosmos": {
    "id": "cosmos",
    "name": "Cosmos",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "crimson": {
    "id": "crimson",
    "name": "Crimson",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "cumulus": {
    "id": "cumulus",
    "name": "Cumulus",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "cunene": {
    "id": "cunene",
    "name": "Cunene",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "dadaist": {
    "id": "dadaist",
    "name": "Dadaist",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "dallas": {
    "id": "dallas",
    "name": "Dallas",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "de-stijl": {
    "id": "de-stijl",
    "name": "De Stijl",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "deco-cv": {
    "id": "deco-cv",
    "name": "Deco",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "delta": {
    "id": "delta",
    "name": "Delta",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "denim": {
    "id": "denim",
    "name": "Denim",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "denver": {
    "id": "denver",
    "name": "Denver",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "detroit": {
    "id": "detroit",
    "name": "Detroit",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "diani": {
    "id": "diani",
    "name": "Diani",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "didot-cv": {
    "id": "didot-cv",
    "name": "Didot",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "dubai": {
    "id": "dubai",
    "name": "Dubai",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "dublin": {
    "id": "dublin",
    "name": "Dublin",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "dusk": {
    "id": "dusk",
    "name": "Dusk",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "eclipse": {
    "id": "eclipse",
    "name": "Eclipse",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "edge": {
    "id": "edge",
    "name": "Edge",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "ember": {
    "id": "ember",
    "name": "Ember",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "equinox": {
    "id": "equinox",
    "name": "Equinox",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "estuary": {
    "id": "estuary",
    "name": "Estuary",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "ewaso": {
    "id": "ewaso",
    "name": "Ewaso",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "executive-one": {
    "id": "executive-one",
    "name": "Executive One",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "fjord": {
    "id": "fjord",
    "name": "Fjord",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "flux": {
    "id": "flux",
    "name": "Flux",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "folio": {
    "id": "folio",
    "name": "Folio",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "fractal": {
    "id": "fractal",
    "name": "Fractal",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "futura-cv": {
    "id": "futura-cv",
    "name": "Futura",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "futurism-cv": {
    "id": "futurism-cv",
    "name": "Futurism",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "galana": {
    "id": "galana",
    "name": "Galana",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "gambia-cv": {
    "id": "gambia-cv",
    "name": "Gambia",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "garamond-cv": {
    "id": "garamond-cv",
    "name": "Garamond",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "garissa": {
    "id": "garissa",
    "name": "Garissa",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "gash": {
    "id": "gash",
    "name": "Gash",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "geneva": {
    "id": "geneva",
    "name": "Geneva",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "graphite": {
    "id": "graphite",
    "name": "Graphite",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "gravity": {
    "id": "gravity",
    "name": "Gravity",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "grid": {
    "id": "grid",
    "name": "Grid",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "haven": {
    "id": "haven",
    "name": "Haven",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "helsinki": {
    "id": "helsinki",
    "name": "Helsinki",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "herald-cv": {
    "id": "herald-cv",
    "name": "Herald",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "herald": {
    "id": "herald",
    "name": "Herald",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "highland": {
    "id": "highland",
    "name": "Highland",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "homabay": {
    "id": "homabay",
    "name": "Homabay",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "horizon": {
    "id": "horizon",
    "name": "Horizon",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "houston": {
    "id": "houston",
    "name": "Houston",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "imperial": {
    "id": "imperial",
    "name": "Imperial",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "impressionist-cv": {
    "id": "impressionist-cv",
    "name": "Impressionist",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "indianapolis": {
    "id": "indianapolis",
    "name": "Indianapolis",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "inset": {
    "id": "inset",
    "name": "Inset",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "istanbul": {
    "id": "istanbul",
    "name": "Istanbul",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "jade": {
    "id": "jade",
    "name": "Jade",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "kagera": {
    "id": "kagera",
    "name": "Kagera",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "kajiado": {
    "id": "kajiado",
    "name": "Kajiado",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "kariba": {
    "id": "kariba",
    "name": "Kariba",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "kavango": {
    "id": "kavango",
    "name": "Kavango",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "kericho": {
    "id": "kericho",
    "name": "Kericho",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "kibo": {
    "id": "kibo",
    "name": "Kibo",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "kilimanjaro": {
    "id": "kilimanjaro",
    "name": "Kilimanjaro",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "kioo": {
    "id": "kioo",
    "name": "Kioo",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "kisii": {
    "id": "kisii",
    "name": "Kisii",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "kitale": {
    "id": "kitale",
    "name": "Kitale",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "lagoon": {
    "id": "lagoon",
    "name": "Lagoon",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "laikipia": {
    "id": "laikipia",
    "name": "Laikipia",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "lamu": {
    "id": "lamu",
    "name": "Lamu",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "ledge": {
    "id": "ledge",
    "name": "Ledge",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "ledger": {
    "id": "ledger",
    "name": "Ledger",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "limpopo-cv": {
    "id": "limpopo-cv",
    "name": "Limpopo",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "linen": {
    "id": "linen",
    "name": "Linen",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "lisbon": {
    "id": "lisbon",
    "name": "Lisbon",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "lodge": {
    "id": "lodge",
    "name": "Lodge",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "louisville": {
    "id": "louisville",
    "name": "Louisville",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "lukuga": {
    "id": "lukuga",
    "name": "Lukuga",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "lunar": {
    "id": "lunar",
    "name": "Lunar",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "machakos": {
    "id": "machakos",
    "name": "Machakos",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "madrid": {
    "id": "madrid",
    "name": "Madrid",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "malachite": {
    "id": "malachite",
    "name": "Malachite",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "malindi": {
    "id": "malindi",
    "name": "Malindi",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "mareb": {
    "id": "mareb",
    "name": "Mareb",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "margin": {
    "id": "margin",
    "name": "Margin",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "marlowe": {
    "id": "marlowe",
    "name": "Marlowe",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "marsabit": {
    "id": "marsabit",
    "name": "Marsabit",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "melbourne": {
    "id": "melbourne",
    "name": "Melbourne",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "memphis": {
    "id": "memphis",
    "name": "Memphis",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "meridian": {
    "id": "meridian",
    "name": "Meridian",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "mesa": {
    "id": "mesa",
    "name": "Mesa",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "metro": {
    "id": "metro",
    "name": "Metro",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "miami-cv": {
    "id": "miami-cv",
    "name": "Miami",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "migori": {
    "id": "migori",
    "name": "Migori",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "minneapolis": {
    "id": "minneapolis",
    "name": "Minneapolis",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "modernist-cv": {
    "id": "modernist-cv",
    "name": "Modernist",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "mombasa": {
    "id": "mombasa",
    "name": "Mombasa",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "monarch": {
    "id": "monarch",
    "name": "Monarch",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "mono-cv": {
    "id": "mono-cv",
    "name": "Mono",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "montage": {
    "id": "montage",
    "name": "Montage",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "montreal": {
    "id": "montreal",
    "name": "Montreal",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "mosaic": {
    "id": "mosaic",
    "name": "Mosaic",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "moyale": {
    "id": "moyale",
    "name": "Moyale",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "muse": {
    "id": "muse",
    "name": "Muse",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "nairobi": {
    "id": "nairobi",
    "name": "Nairobi",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "nakuru": {
    "id": "nakuru",
    "name": "Nakuru",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "narok": {
    "id": "narok",
    "name": "Narok",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "narrative": {
    "id": "narrative",
    "name": "Narrative",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "nashville": {
    "id": "nashville",
    "name": "Nashville",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "nebula": {
    "id": "nebula",
    "name": "Nebula",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "neoclassical-cv": {
    "id": "neoclassical-cv",
    "name": "Neoclassical",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "neon": {
    "id": "neon",
    "name": "Neon",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "neural": {
    "id": "neural",
    "name": "Neural",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "nile": {
    "id": "nile",
    "name": "Nile",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "nimbus": {
    "id": "nimbus",
    "name": "Nimbus",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "nordic-minimal": {
    "id": "nordic-minimal",
    "name": "Nordic Minimal",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "nova": {
    "id": "nova",
    "name": "Nova",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "nuru": {
    "id": "nuru",
    "name": "Nuru",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "ocean": {
    "id": "ocean",
    "name": "Ocean",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "okavango": {
    "id": "okavango",
    "name": "Okavango",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "onyx": {
    "id": "onyx",
    "name": "Onyx",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "orbit": {
    "id": "orbit",
    "name": "Orbit",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "oslo": {
    "id": "oslo",
    "name": "Oslo",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "oxford": {
    "id": "oxford",
    "name": "Oxford",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "palatino-cv": {
    "id": "palatino-cv",
    "name": "Palatino",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "panorama": {
    "id": "panorama",
    "name": "Panorama",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "parallax": {
    "id": "parallax",
    "name": "Parallax",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "peel": {
    "id": "peel",
    "name": "Peel",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "pemba": {
    "id": "pemba",
    "name": "Pemba",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "phoenix": {
    "id": "phoenix",
    "name": "Phoenix",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "photon": {
    "id": "photon",
    "name": "Photon",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "pier": {
    "id": "pier",
    "name": "Pier",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "pittsburgh": {
    "id": "pittsburgh",
    "name": "Pittsburgh",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "plateau": {
    "id": "plateau",
    "name": "Plateau",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "portland": {
    "id": "portland",
    "name": "Portland",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "prague": {
    "id": "prague",
    "name": "Prague",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "prism": {
    "id": "prism",
    "name": "Prism",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "pulsar": {
    "id": "pulsar",
    "name": "Pulsar",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "quantum": {
    "id": "quantum",
    "name": "Quantum",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "quasar": {
    "id": "quasar",
    "name": "Quasar",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "rail": {
    "id": "rail",
    "name": "Rail",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "raleigh": {
    "id": "raleigh",
    "name": "Raleigh",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "regent": {
    "id": "regent",
    "name": "Regent",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "relief": {
    "id": "relief",
    "name": "Relief",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "ribbon": {
    "id": "ribbon",
    "name": "Ribbon",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "richmond": {
    "id": "richmond",
    "name": "Richmond",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "rift": {
    "id": "rift",
    "name": "Rift",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "riso": {
    "id": "riso",
    "name": "Riso",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "rockwell-cv": {
    "id": "rockwell-cv",
    "name": "Rockwell",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "rufiji": {
    "id": "rufiji",
    "name": "Rufiji",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "ruvuma": {
    "id": "ruvuma",
    "name": "Ruvuma",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "ruwenzori": {
    "id": "ruwenzori",
    "name": "Ruwenzori",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "sabaki": {
    "id": "sabaki",
    "name": "Sabaki",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "sacramento": {
    "id": "sacramento",
    "name": "Sacramento",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "sahara": {
    "id": "sahara",
    "name": "Sahara",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "samburu": {
    "id": "samburu",
    "name": "Samburu",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "savanna": {
    "id": "savanna",
    "name": "Savanna",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "script-cv": {
    "id": "script-cv",
    "name": "Script",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "seattle": {
    "id": "seattle",
    "name": "Seattle",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "serengeti": {
    "id": "serengeti",
    "name": "Serengeti",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "serif-cv": {
    "id": "serif-cv",
    "name": "Serif",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "silhouette": {
    "id": "silhouette",
    "name": "Silhouette",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "silicon-pro": {
    "id": "silicon-pro",
    "name": "Silicon Pro",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "singapore-cv": {
    "id": "singapore-cv",
    "name": "Singapore",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "slab": {
    "id": "slab",
    "name": "Slab",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "slate-two": {
    "id": "slate-two",
    "name": "Slate Two",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "slate-v2": {
    "id": "slate-v2",
    "name": "Slate v2",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "solaris": {
    "id": "solaris",
    "name": "Solaris",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "solstice": {
    "id": "solstice",
    "name": "Solstice",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "st-louis": {
    "id": "st-louis",
    "name": "St Louis",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "stellar": {
    "id": "stellar",
    "name": "Stellar",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "stockholm": {
    "id": "stockholm",
    "name": "Stockholm",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "storm": {
    "id": "storm",
    "name": "Storm",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "stratus": {
    "id": "stratus",
    "name": "Stratus",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "stripe": {
    "id": "stripe",
    "name": "Stripe",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "structuralist": {
    "id": "structuralist",
    "name": "Structuralist",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "studio": {
    "id": "studio",
    "name": "Studio",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "suprematist": {
    "id": "suprematist",
    "name": "Suprematist",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "sydney-cv": {
    "id": "sydney-cv",
    "name": "Sydney",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "tableau": {
    "id": "tableau",
    "name": "Tableau",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "tampa": {
    "id": "tampa",
    "name": "Tampa",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "tana": {
    "id": "tana",
    "name": "Tana",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "tanganyika": {
    "id": "tanganyika",
    "name": "Tanganyika",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "tekeze": {
    "id": "tekeze",
    "name": "Tekeze",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "tempo": {
    "id": "tempo",
    "name": "Tempo",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "terracotta": {
    "id": "terracotta",
    "name": "Terracotta",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "ticker": {
    "id": "ticker",
    "name": "Ticker",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "titan": {
    "id": "titan",
    "name": "Titan",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "tokyo-grid": {
    "id": "tokyo-grid",
    "name": "Tokyo Grid",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "toronto": {
    "id": "toronto",
    "name": "Toronto",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "trace": {
    "id": "trace",
    "name": "Trace",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "turkana": {
    "id": "turkana",
    "name": "Turkana",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "ubuntu": {
    "id": "ubuntu",
    "name": "Ubuntu",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "vancouver": {
    "id": "vancouver",
    "name": "Vancouver",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "vector": {
    "id": "vector",
    "name": "Vector",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "veldt": {
    "id": "veldt",
    "name": "Veldt",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "verdant": {
    "id": "verdant",
    "name": "Verdant",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "vertex": {
    "id": "vertex",
    "name": "Vertex",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "vibe": {
    "id": "vibe",
    "name": "Vibe",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "victoria": {
    "id": "victoria",
    "name": "Victoria",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "vienna": {
    "id": "vienna",
    "name": "Vienna",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "vignette": {
    "id": "vignette",
    "name": "Vignette",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "voi": {
    "id": "voi",
    "name": "Voi",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "volta-cv": {
    "id": "volta-cv",
    "name": "Volta",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "wajir": {
    "id": "wajir",
    "name": "Wajir",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "warsaw": {
    "id": "warsaw",
    "name": "Warsaw",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "watamu": {
    "id": "watamu",
    "name": "Watamu",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "zahabu": {
    "id": "zahabu",
    "name": "Zahabu",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "zanzibar": {
    "id": "zanzibar",
    "name": "Zanzibar",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "zege": {
    "id": "zege",
    "name": "Zege",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "zenith": {
    "id": "zenith",
    "name": "Zenith",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "zurich": {
    "id": "zurich",
    "name": "Zurich",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
};

// apps/web/lib/templates/curation.ts
var CURATED_CV_TEMPLATE_IDS = [
  // Premium flagships
  "rift",
  "zahabu",
  "nuru",
  "pemba",
  "malachite",
  "coral",
  "kioo",
  // Contemporary / experimental
  "bento",
  "zege",
  "console",
  "riso",
  "vibe",
  "neon",
  // Timeless / professional
  "regent",
  "marlowe",
  "cavendish",
  "haven",
  // Sidebar
  "nakuru",
  "ubuntu",
  "mombasa",
  "aurora-edge",
  "metro",
  "meridian",
  // Header / two-column
  "serengeti",
  "nairobi",
  "atlas",
  "eclipse",
  "horizon",
  "nova",
  // Classic / serif
  "kilimanjaro",
  "victoria",
  "monarch",
  "oxford",
  "titan",
  // Creative / editorial
  "zanzibar",
  "canvas-magazine",
  "vertex",
  "muse",
  "narrative",
  "tokyo-grid",
  // Minimal / ATS
  "sahara",
  "nordic-minimal",
  "berlin",
  "grid",
  "stripe",
  "serif-cv",
  "mono-cv"
];

// apps/web/types/index.ts
var personalInfoSchema = external_exports.object({
  fullName: external_exports.string().default(""),
  jobTitle: external_exports.string().default(""),
  email: external_exports.string().default(""),
  phone: external_exports.string().default(""),
  location: external_exports.string().default(""),
  linkedin: external_exports.string().optional(),
  website: external_exports.string().optional(),
  photo: external_exports.string().optional()
});
var experienceEntrySchema = external_exports.object({
  id: external_exports.string().default(""),
  company: external_exports.string().default(""),
  position: external_exports.string().default(""),
  location: external_exports.string().optional(),
  startDate: external_exports.string().default(""),
  endDate: external_exports.string().default(""),
  current: external_exports.boolean().default(false),
  description: external_exports.string().default("")
});
var educationEntrySchema = external_exports.object({
  id: external_exports.string().default(""),
  institution: external_exports.string().default(""),
  degree: external_exports.string().default(""),
  field: external_exports.string().default(""),
  startDate: external_exports.string().default(""),
  endDate: external_exports.string().default(""),
  grade: external_exports.string().optional(),
  description: external_exports.string().optional()
});
var skillEntrySchema = external_exports.object({
  id: external_exports.string(),
  name: external_exports.string(),
  level: external_exports.union([external_exports.literal(1), external_exports.literal(2), external_exports.literal(3), external_exports.literal(4), external_exports.literal(5)])
});
var languageEntrySchema = external_exports.object({
  id: external_exports.string(),
  name: external_exports.string(),
  proficiency: external_exports.enum(["Native", "Fluent", "Advanced", "Intermediate", "Basic"])
});
var certificationEntrySchema = external_exports.object({
  id: external_exports.string(),
  name: external_exports.string(),
  issuer: external_exports.string(),
  date: external_exports.string(),
  url: external_exports.string().optional()
});
var projectEntrySchema = external_exports.object({
  id: external_exports.string(),
  name: external_exports.string(),
  description: external_exports.string(),
  role: external_exports.string().optional(),
  url: external_exports.string().optional(),
  date: external_exports.string().optional()
});
var refereeEntrySchema = external_exports.object({
  id: external_exports.string(),
  name: external_exports.string(),
  title: external_exports.string(),
  company: external_exports.string(),
  email: external_exports.string(),
  phone: external_exports.string()
});
function looseArray(item) {
  return external_exports.array(external_exports.unknown()).default([]).transform(
    (raw) => raw.flatMap((entry) => {
      const parsed = item.safeParse(entry);
      return parsed.success ? [parsed.data] : [];
    })
  );
}
function looseOptionalArray(item) {
  return external_exports.array(external_exports.unknown()).optional().transform(
    (raw) => raw === void 0 ? void 0 : raw.flatMap((entry) => {
      const parsed = item.safeParse(entry);
      return parsed.success ? [parsed.data] : [];
    })
  );
}
var cvDataSchema = external_exports.object({
  // `.catch` rather than `.default` so a *malformed* personal block survives too,
  // not just a missing one. Losing a name is survivable; losing the CV is not.
  personal: personalInfoSchema.catch({ fullName: "", jobTitle: "", email: "", phone: "", location: "" }),
  summary: external_exports.string().default(""),
  // Each array drops the entries it cannot read instead of failing, so one
  // malformed row costs the user that entry and nothing else.
  experience: looseArray(experienceEntrySchema),
  education: looseArray(educationEntrySchema),
  skills: looseArray(skillEntrySchema),
  // Optional-with-default so CVs saved before projects existed still parse.
  projects: looseArray(projectEntrySchema),
  languages: looseArray(languageEntrySchema),
  certifications: looseArray(certificationEntrySchema),
  referees: looseArray(refereeEntrySchema),
  hobbies: external_exports.string().default(""),
  hiddenSections: looseOptionalArray(external_exports.string()),
  sectionOrder: looseOptionalArray(external_exports.string()),
  density: external_exports.enum(["compact", "normal", "airy"]).optional(),
  mode: external_exports.string().optional()
});
function unwrapStoredJson(data) {
  let candidate = data;
  for (let i = 0; i < 2 && typeof candidate === "string"; i++) {
    try {
      candidate = JSON.parse(candidate);
    } catch {
      break;
    }
  }
  return candidate;
}
var CV_ARRAY_SECTIONS = [
  ["experience", experienceEntrySchema],
  ["education", educationEntrySchema],
  ["skills", skillEntrySchema],
  ["projects", projectEntrySchema],
  ["languages", languageEntrySchema],
  ["certifications", certificationEntrySchema],
  ["referees", refereeEntrySchema]
];
function salvageCvData(candidate) {
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate))
    return null;
  const raw = candidate;
  const salvaged = { ...raw };
  for (const [section, rowSchema] of CV_ARRAY_SECTIONS) {
    const rows = raw[section];
    if (rows === void 0)
      continue;
    salvaged[section] = Array.isArray(rows) ? rows.filter((row) => rowSchema.safeParse(row).success) : [];
  }
  if (typeof raw.summary !== "string")
    salvaged.summary = "";
  if (typeof raw.hobbies !== "string")
    salvaged.hobbies = "";
  const result = cvDataSchema.safeParse(salvaged);
  return result.success ? result.data : null;
}
function parseCVData(data) {
  const candidate = unwrapStoredJson(data);
  const normalized = toStoredCvData(candidate);
  const result = cvDataSchema.safeParse(normalized);
  if (result.success)
    return result.data;
  return salvageCvData(normalized) ?? createEmptyCVData();
}
var achievementEntrySchema = external_exports.object({
  id: external_exports.string(),
  title: external_exports.string(),
  description: external_exports.string().optional(),
  date: external_exports.string().optional(),
  category: external_exports.string().optional()
});
var volunteerEntrySchema = external_exports.object({
  id: external_exports.string(),
  organization: external_exports.string(),
  role: external_exports.string(),
  startDate: external_exports.string().optional(),
  endDate: external_exports.string().optional(),
  current: external_exports.boolean().optional(),
  description: external_exports.string().optional()
});
var careerPreferencesSchema = external_exports.object({
  targetRoles: external_exports.array(external_exports.string()).default([]),
  preferredLocations: external_exports.array(external_exports.string()).default([]),
  remotePreference: external_exports.enum(["remote", "hybrid", "onsite", ""]).default(""),
  salaryExpectation: external_exports.string().optional(),
  noticePeriod: external_exports.string().optional(),
  workAuthorization: external_exports.string().optional(),
  availability: external_exports.string().optional(),
  careerGoals: external_exports.string().optional()
});
var factMetaSchema = external_exports.object({
  status: external_exports.enum(["confirmed", "needs-confirmation", "ai-suggested", "inferred", "unverified"]).optional(),
  source: external_exports.string().max(64).optional(),
  confidence: external_exports.number().min(0).max(1).optional(),
  updatedAt: external_exports.string().optional()
});
var careerProfileSchema = external_exports.object({
  personal: personalInfoSchema,
  summary: external_exports.string(),
  experience: external_exports.array(experienceEntrySchema).default([]),
  education: external_exports.array(educationEntrySchema).default([]),
  skills: external_exports.array(skillEntrySchema).default([]),
  certifications: external_exports.array(certificationEntrySchema).default([]),
  languages: external_exports.array(languageEntrySchema).default([]),
  projects: external_exports.array(projectEntrySchema).default([]),
  achievements: external_exports.array(achievementEntrySchema).default([]),
  volunteer: external_exports.array(volunteerEntrySchema).default([]),
  references: external_exports.array(refereeEntrySchema).default([]),
  preferences: careerPreferencesSchema.default({
    targetRoles: [],
    preferredLocations: [],
    remotePreference: ""
  }),
  factMeta: external_exports.record(external_exports.string(), factMetaSchema).optional()
});
function createEmptyCVData() {
  return {
    personal: { fullName: "", jobTitle: "", email: "", phone: "", location: "" },
    summary: "",
    experience: [],
    education: [],
    skills: [],
    projects: [],
    languages: [],
    certifications: [],
    referees: [],
    hobbies: ""
  };
}
var TEMPLATE_PRESENTATION = [
  { id: "rift", description: "Premium colour sidebar \xB7 photo ring \xB7 skill bars", previewColor: "#12433D", style: "sidebar", popular: true },
  { id: "zahabu", description: "Dark charcoal \xB7 gold accent \xB7 timeline", previewColor: "#F2A93B", style: "sidebar", popular: true },
  { id: "nuru", description: "Infographic \xB7 stat strip \xB7 skill rings", previewColor: "#C13E14", style: "creative", popular: true },
  { id: "pemba", description: "Editorial serif \xB7 masthead \xB7 drop cap", previewColor: "#B57A18", style: "creative", popular: true },
  { id: "malachite", description: "Two-column \xB7 chip skills \xB7 ring photo", previewColor: "#0E7490", style: "header", popular: true },
  { id: "coral", description: "Accent header bars \xB7 timeline \xB7 photo", previewColor: "#E4572E", style: "sidebar", popular: true },
  { id: "kioo", description: "Full-height photo column \xB7 charcoal panel", previewColor: "#1E3A5F", style: "sidebar", popular: true },
  { id: "bento", description: "Bento-grid of rounded cards \xB7 contemporary", previewColor: "#4F46E5", style: "creative", popular: true },
  { id: "zege", description: "Neo-brutalist \xB7 thick borders \xB7 hard shadows", previewColor: "#3D5AFE", style: "creative", popular: true },
  { id: "console", description: "Terminal \xB7 monospace \xB7 ascii meters", previewColor: "#3FB950", style: "creative", popular: true },
  { id: "riso", description: "Risograph poster \xB7 offset colour \xB7 numbered", previewColor: "#F0466E", style: "creative", popular: true },
  { id: "vibe", description: "Vibrant gradient header \xB7 gradient meters", previewColor: "#6366F1", style: "creative", popular: true },
  { id: "neon", description: "Dark \xB7 sleek \xB7 gradient bars on cards", previewColor: "#22D3EE", style: "creative", popular: true },
  { id: "regent", description: "Executive \xB7 serif header \xB7 gold rule \xB7 two-column", previewColor: "#1E3A5F", style: "classic", popular: true },
  { id: "marlowe", description: "Elegant serif \xB7 centered \xB7 refined", previewColor: "#8A6D3B", style: "classic", popular: true },
  { id: "cavendish", description: "Academic \xB7 long-form \xB7 ruled sections", previewColor: "#7F1D1D", style: "classic", popular: true },
  { id: "haven", description: "Clean \xB7 calm \xB7 rounded \xB7 people-facing roles", previewColor: "#0E9488", style: "minimal", popular: true },
  { id: "nakuru", description: "Modern sidebar \xB7 skill bars", previewColor: "#DA4A1C", style: "sidebar", popular: true },
  { id: "kilimanjaro", description: "Classic centered serif", previewColor: "#211A15", style: "classic" },
  { id: "serengeti", description: "Header band \xB7 two-column", previewColor: "#12433D", style: "header" },
  { id: "zanzibar", description: "Editorial display serif", previewColor: "#7C3AED", style: "creative" },
  { id: "nile", description: "Classic traditional", previewColor: "#1D4ED8", style: "classic" },
  { id: "ubuntu", description: "Executive dark sidebar", previewColor: "#F2A93B", style: "sidebar" },
  { id: "savanna", description: "Minimal \xB7 timeline margin", previewColor: "#B57A18", style: "header" },
  { id: "sahara", description: "Ultra-minimal whitespace", previewColor: "#6B7280", style: "minimal" },
  { id: "nairobi", description: "Corporate ledger rule", previewColor: "#1E3A5F", style: "header" },
  { id: "mombasa", description: "Photo header \xB7 portrait", previewColor: "#0E7490", style: "sidebar" },
  { id: "victoria", description: "Elegant serif \xB7 executive", previewColor: "#7A5410", style: "classic" },
  { id: "canvas-magazine", description: "Editorial magazine feel", previewColor: "#7C3AED", style: "creative" },
  { id: "monarch", description: "Classic prestigious layout", previewColor: "#B45309", style: "classic" },
  { id: "vertex", description: "Diagonal accent header", previewColor: "#0891B2", style: "creative" },
  { id: "berlin", description: "Brutalist minimal density", previewColor: "#111827", style: "minimal" },
  { id: "atlas", description: "Dark header band with cards", previewColor: "#2563EB", style: "header" },
  { id: "aurora-edge", description: "Sidebar with pill skills", previewColor: "#2563EB", style: "sidebar" },
  { id: "nordic-minimal", description: "Ultra-clean single column", previewColor: "#0F172A", style: "minimal" },
  { id: "executive-one", description: "Centered serif classic", previewColor: "#1E293B", style: "classic" },
  { id: "tokyo-grid", description: "Dark sidebar, bold red header", previewColor: "#DC2626", style: "creative" },
  { id: "silicon-pro", description: "Tech header band with bars", previewColor: "#2563EB", style: "header" },
  { id: "eclipse", description: "Dark full header executive", previewColor: "#0F172A", style: "header" },
  { id: "muse", description: "Creative pink sidebar", previewColor: "#EC4899", style: "creative" },
  { id: "titan", description: "Bold navy authority", previewColor: "#1E3A8A", style: "classic" },
  { id: "alpine", description: "Airy green minimal", previewColor: "#10B981", style: "minimal" },
  { id: "nova", description: "Purple header two-column", previewColor: "#8B5CF6", style: "header" },
  { id: "oxford", description: "Academic centered layout", previewColor: "#374151", style: "classic" },
  { id: "metro", description: "Urban sidebar with stripe", previewColor: "#2563EB", style: "sidebar" },
  { id: "horizon", description: "Orange banner three-column", previewColor: "#F97316", style: "creative" },
  { id: "ascent", description: "Green header timeline", previewColor: "#059669", style: "header" },
  { id: "imperial", description: "Prestigious deep crimson", previewColor: "#7C2D12", style: "classic" },
  { id: "meridian", description: "Dark sidebar, accent dots", previewColor: "#0F172A", style: "sidebar", popular: true },
  { id: "apex", description: "Bold header, timeline body", previewColor: "#1E293B", style: "header", popular: true },
  { id: "studio", description: "Editorial single-column", previewColor: "#6366F1", style: "minimal", popular: true },
  { id: "grid", description: "ATS-strict, machine-readable", previewColor: "#0F172A", style: "minimal", popular: true },
  { id: "narrative", description: "Bold header, editorial story", previewColor: "#7C3AED", style: "creative", popular: true },
  { id: "cascade", description: "Dark header, left skill column, right story", previewColor: "#0F172A", style: "creative" },
  { id: "dusk", description: "Dark left column, accent-line right body", previewColor: "#1E293B", style: "creative" },
  { id: "verdant", description: "Green header, pill labels, two-column", previewColor: "#059669", style: "creative" },
  { id: "terracotta", description: "Warm amber header, ruled section dividers", previewColor: "#B45309", style: "creative" },
  { id: "slate-two", description: "Steel blue, two-col, grid skill display", previewColor: "#334155", style: "creative" },
  { id: "carbon", description: "Near-black header+left, timeline-v2 body", previewColor: "#059669", style: "creative" },
  { id: "aurora-two", description: "Violet header, pill labels, airy body", previewColor: "#6D28D9", style: "creative" },
  { id: "crimson", description: "Deep red, box sections, two-column", previewColor: "#DC2626", style: "creative" },
  { id: "ocean", description: "Ocean blue, numbered sections, timeline", previewColor: "#0369A1", style: "creative" },
  { id: "graphite", description: "Near-black, ruled labels, grid skills, compact", previewColor: "#404040", style: "creative" },
  { id: "jade", description: "Forest green, pill skills, accent lines", previewColor: "#059669", style: "creative" },
  { id: "ember", description: "Deep orange, timeline-v2 body", previewColor: "#EA580C", style: "creative" },
  { id: "cobalt", description: "Deep blue, airy two-column layout", previewColor: "#1D4ED8", style: "creative" },
  { id: "storm", description: "Steel, numbered+tag-rated, ruled body", previewColor: "#374151", style: "creative" },
  { id: "bloom", description: "Pink, pill labels, card body, two-column", previewColor: "#DB2777", style: "creative" },
  { id: "stripe", description: "8px left accent band, clean single column", previewColor: "#1D4ED8", style: "minimal" },
  { id: "rail", description: "12px rail, timeline, accent lines", previewColor: "#059669", style: "minimal" },
  { id: "inset", description: "6px band, ruled sections, airy", previewColor: "#7C3AED", style: "minimal" },
  { id: "ribbon", description: "10px ribbon, pill section labels, photo", previewColor: "#DC2626", style: "minimal" },
  { id: "edge", description: "Wide 16px edge, card experience, rounded photo", previewColor: "#0F172A", style: "minimal" },
  { id: "axis", description: "Black band, timeline-v2 experience", previewColor: "#0F172A", style: "minimal" },
  { id: "ledger", description: "Dark band, numbered headers, table exp, grid skills", previewColor: "#1E293B", style: "minimal" },
  { id: "serif-cv", description: "Warm paper bg, ruled sections, bar skills", previewColor: "#78350F", style: "minimal" },
  { id: "flux", description: "10px band, box headers, chip skills", previewColor: "#6D28D9", style: "minimal" },
  { id: "tempo", description: "Accent name, dot sections, dot skills, timeline", previewColor: "#0891B2", style: "minimal" },
  { id: "margin", description: "Slate band, square photo, tag-rated skills", previewColor: "#374151", style: "minimal" },
  { id: "script-cv", description: "Warm background, timeline-v2, accent lines", previewColor: "#B45309", style: "minimal" },
  { id: "mono-cv", description: "Black band, no section headers, ultra compact", previewColor: "#111827", style: "minimal" },
  { id: "pier", description: "Teal band, pill labels, grid skills", previewColor: "#0369A1", style: "minimal" },
  { id: "herald", description: "Dark band, ruled sections, table layout, rounded photo", previewColor: "#0F172A", style: "minimal" },
  { id: "kibo", description: "Dark sidebar, pill labels, numbered mains, grid skills", previewColor: "#0F172A", style: "sidebar" },
  { id: "lodge", description: "Charcoal, dot sidebar, ruled main, tag-rated, timeline-v2", previewColor: "#1E293B", style: "sidebar" },
  { id: "brisk", description: "Dark, tag sidebar, pill main, table experience", previewColor: "#111827", style: "sidebar" },
  { id: "chrome", description: "Light sidebar, numbered main, grid skills", previewColor: "#1D4ED8", style: "sidebar" },
  { id: "linen", description: "Warm cream sidebar, ruled sections, airy", previewColor: "#D97706", style: "sidebar" },
  { id: "denim", description: "Ice blue sidebar, pill mains, card experience", previewColor: "#1D4ED8", style: "sidebar" },
  { id: "cocoa", description: "Warm yellow sidebar, numbered, tag-rated skills", previewColor: "#B45309", style: "sidebar" },
  { id: "slate-v2", description: "White-ish sidebar, ruled main, grid, timeline-v2", previewColor: "#374151", style: "sidebar" },
  { id: "onyx", description: "Near-black, pill sidebar, accent lines, compact", previewColor: "#6D28D9", style: "sidebar" },
  { id: "cobblestone", description: "Warm dark, numbered main, table exp, timeline", previewColor: "#1C1917", style: "sidebar" },
  { id: "capsule", description: "Pill section labels, accent name, solid divider", previewColor: "#7C3AED", style: "minimal" },
  { id: "ledge", description: "Ruled sections, grid skills, no divider", previewColor: "#0F172A", style: "minimal" },
  { id: "ticker", description: "Centered, numbered, timeline-v2 experience", previewColor: "#DC2626", style: "minimal" },
  { id: "slab", description: "Numbered headers, table experience, tag-rated skills", previewColor: "#374151", style: "minimal" },
  { id: "peel", description: "Centered, pill labels, chip skills, card exp, airy", previewColor: "#BE185D", style: "minimal" },
  { id: "trace", description: "Ruled sections, dotted divider, left-aligned", previewColor: "#0891B2", style: "minimal" },
  { id: "clean-cv", description: "No section labels, grid skills, ultra compact", previewColor: "#1E293B", style: "minimal" },
  { id: "herald-cv", description: "Centered, numbered, dot skills, accent name", previewColor: "#1D4ED8", style: "minimal" },
  { id: "folio", description: "Pill labels, tag-rated skills, timeline-v2, airy", previewColor: "#059669", style: "minimal" },
  { id: "atlas-v2", description: "Numbered, chip skills, card blocks, accent name", previewColor: "#0F172A", style: "minimal" },
  { id: "ruwenzori", description: "Dark slate sidebar, bar skills", previewColor: "#0F172A", style: "sidebar" },
  { id: "turkana", description: "Charcoal sidebar, dot skills, timeline", previewColor: "#1E293B", style: "sidebar" },
  { id: "aberdare", description: "Dark charcoal, compact, rounded photo", previewColor: "#111827", style: "sidebar" },
  { id: "samburu", description: "Wide dark sidebar, accent lines", previewColor: "#0F172A", style: "sidebar" },
  { id: "laikipia", description: "Deep navy, card experience blocks", previewColor: "#1A1A2E", style: "sidebar" },
  { id: "marsabit", description: "Square photo, airy spacing", previewColor: "#1E293B", style: "sidebar" },
  { id: "malindi", description: "Borderless sections, accent lines", previewColor: "#0F172A", style: "sidebar" },
  { id: "watamu", description: "Narrow compact sidebar, skills only", previewColor: "#111827", style: "sidebar" },
  { id: "diani", description: "Wide airy sidebar, full sections", previewColor: "#1E293B", style: "sidebar" },
  { id: "lamu", description: "Midnight blue, card layout", previewColor: "#0D1B2A", style: "sidebar" },
  { id: "busia", description: "Square photo, borderless sections", previewColor: "#0F172A", style: "sidebar" },
  { id: "homabay", description: "Charcoal sidebar, rounded photo, timeline", previewColor: "#1E293B", style: "sidebar" },
  { id: "migori", description: "Dot-style sections throughout", previewColor: "#111827", style: "sidebar" },
  { id: "kisii", description: "Deep navy, chip skills", previewColor: "#1A1A2E", style: "sidebar" },
  { id: "kericho", description: "Minimal sections, card experience", previewColor: "#0F172A", style: "sidebar" },
  { id: "kitale", description: "Rounded photo, airy, accent lines", previewColor: "#1E293B", style: "sidebar" },
  { id: "machakos", description: "Midnight, timeline, dot labels", previewColor: "#0D1B2A", style: "sidebar" },
  { id: "kajiado", description: "Narrow, square photo, compact", previewColor: "#111827", style: "sidebar" },
  { id: "narok", description: "Full sidebar sections, airy layout", previewColor: "#1A1A2E", style: "sidebar" },
  { id: "voi", description: "Card experience, timeline, rounded photo", previewColor: "#0F172A", style: "sidebar" },
  { id: "wajir", description: "Box sections, dot labels, compact", previewColor: "#1E293B", style: "sidebar" },
  { id: "garissa", description: "Square photo, chip skills", previewColor: "#111827", style: "sidebar" },
  { id: "moyale", description: "Midnight, airy, dot sections, timeline", previewColor: "#0D1B2A", style: "sidebar" },
  { id: "tanganyika", description: "Teal accent sidebar, clean underlines", previewColor: "#0891B2", style: "sidebar" },
  { id: "bangweulu", description: "Purple accent, timeline, dot sections", previewColor: "#7C3AED", style: "sidebar" },
  { id: "okavango", description: "Green accent, airy, full sidebar sections", previewColor: "#059669", style: "sidebar" },
  { id: "kariba", description: "Red accent, square photo, compact", previewColor: "#DC2626", style: "sidebar" },
  { id: "rufiji", description: "Amber accent, wide sidebar, timeline", previewColor: "#D97706", style: "sidebar" },
  { id: "ruvuma", description: "Pink accent, card experience", previewColor: "#BE185D", style: "sidebar" },
  { id: "kagera", description: "Blue accent, rounded, compact", previewColor: "#0369A1", style: "sidebar" },
  { id: "lukuga", description: "Forest green, full sections", previewColor: "#065F46", style: "sidebar" },
  { id: "volta-cv", description: "Brown accent, square photo, card blocks", previewColor: "#7C2D12", style: "sidebar" },
  { id: "gambia-cv", description: "Royal blue accent sidebar", previewColor: "#1D4ED8", style: "sidebar" },
  { id: "cunene", description: "Slate accent, narrow, compact", previewColor: "#374151", style: "sidebar" },
  { id: "limpopo-cv", description: "Teal-green, wide airy sidebar", previewColor: "#0F766E", style: "sidebar" },
  { id: "kavango", description: "Violet accent, compact, dot labels", previewColor: "#6D28D9", style: "sidebar" },
  { id: "tana", description: "Deep ocean blue, square photo", previewColor: "#0C4A6E", style: "sidebar" },
  { id: "ewaso", description: "Warm brown, card experience", previewColor: "#78350F", style: "sidebar" },
  { id: "galana", description: "Deep green accent sidebar", previewColor: "#166534", style: "sidebar" },
  { id: "sabaki", description: "Navy accent, dot labels, accent lines", previewColor: "#1E3A5F", style: "sidebar" },
  { id: "athi", description: "Deep rose, square photo, timeline", previewColor: "#831843", style: "sidebar" },
  { id: "awash", description: "Deep plum, card blocks, airy", previewColor: "#4A044E", style: "sidebar" },
  { id: "baro", description: "Dark amber, compact, rounded photo", previewColor: "#422006", style: "sidebar" },
  { id: "tekeze", description: "Steel blue accent, timeline", previewColor: "#1C3A5E", style: "sidebar" },
  { id: "mareb", description: "Dark forest green, accent lines", previewColor: "#14532D", style: "sidebar" },
  { id: "gash", description: "Indigo accent, square photo, dot sections", previewColor: "#1E1B4B", style: "sidebar" },
  { id: "geneva", description: "Slate header, centered contact row", previewColor: "#0F172A", style: "header" },
  { id: "zurich", description: "Charcoal header, photo right", previewColor: "#1E293B", style: "header" },
  { id: "vienna", description: "Dark header, amber subtext, card blocks", previewColor: "#B45309", style: "header" },
  { id: "stockholm", description: "Midnight header, green sub, airy body", previewColor: "#059669", style: "header" },
  { id: "oslo", description: "Deep navy, violet accent, compact", previewColor: "#7C3AED", style: "header" },
  { id: "copenhagen", description: "Slate header, pink sub, photo right", previewColor: "#BE185D", style: "header" },
  { id: "helsinki", description: "Charcoal, cyan accent, timeline", previewColor: "#0891B2", style: "header" },
  { id: "dublin", description: "Dark, emerald accent, clean body", previewColor: "#059669", style: "header" },
  { id: "warsaw", description: "Midnight, orange accent, card blocks", previewColor: "#EA580C", style: "header" },
  { id: "prague", description: "Deep navy, purple, photo right, airy", previewColor: "#7C3AED", style: "header" },
  { id: "budapest", description: "Slate, amber sub, dot-label sections", previewColor: "#D97706", style: "header" },
  { id: "lisbon", description: "Charcoal, cyan, compact body", previewColor: "#0891B2", style: "header" },
  { id: "madrid", description: "Dark, rose accent, photo right", previewColor: "#E11D48", style: "header" },
  { id: "athens", description: "Midnight, light blue sub, clean body", previewColor: "#1D4ED8", style: "header" },
  { id: "istanbul", description: "Deep navy, pink, card experience", previewColor: "#DB2777", style: "header" },
  { id: "dubai", description: "Slate, gold sub, photo right, airy", previewColor: "#D97706", style: "header" },
  { id: "singapore-cv", description: "Charcoal, mint, chip skills", previewColor: "#059669", style: "header" },
  { id: "sydney-cv", description: "Dark, sky blue sub, dot sections", previewColor: "#0284C7", style: "header" },
  { id: "melbourne", description: "Midnight, lavender, compact", previewColor: "#6D28D9", style: "header" },
  { id: "toronto", description: "Deep navy, red-pink accent", previewColor: "#DC2626", style: "header" },
  { id: "montreal", description: "Slate, green, card timeline", previewColor: "#166534", style: "header" },
  { id: "vancouver", description: "Charcoal, pink, photo right, airy", previewColor: "#E11D48", style: "header" },
  { id: "chicago", description: "Dark, ice cyan, accent lines", previewColor: "#0891B2", style: "header" },
  { id: "boston", description: "Midnight, purple sub, timeline", previewColor: "#7C3AED", style: "header" },
  { id: "seattle", description: "Dark header, skill aside, timeline", previewColor: "#0F172A", style: "header" },
  { id: "portland", description: "Charcoal, narrow aside, accent lines", previewColor: "#1E293B", style: "header" },
  { id: "austin", description: "Dark, full aside, card blocks", previewColor: "#111827", style: "header" },
  { id: "nashville", description: "Midnight, compact, box aside", previewColor: "#0D1B2A", style: "header" },
  { id: "atlanta", description: "Deep navy, airy, accent lines", previewColor: "#1A1A2E", style: "header" },
  { id: "houston", description: "Slate, wide aside, box sections", previewColor: "#0F172A", style: "header" },
  { id: "denver", description: "Charcoal, narrow aside, card body", previewColor: "#1E293B", style: "header" },
  { id: "dallas", description: "Dark, dot sections, skill aside", previewColor: "#111827", style: "header" },
  { id: "minneapolis", description: "Midnight, accent lines, aside skills", previewColor: "#0D1B2A", style: "header" },
  { id: "indianapolis", description: "Deep navy, compact, box aside", previewColor: "#1A1A2E", style: "header" },
  { id: "charlotte", description: "Slate, card blocks, aside with hobbies", previewColor: "#0F172A", style: "header" },
  { id: "baltimore", description: "Charcoal, airy body, dot sections", previewColor: "#1E293B", style: "header" },
  { id: "tampa", description: "Dark, narrow aside, accent lines", previewColor: "#111827", style: "header" },
  { id: "sacramento", description: "Midnight, compact, slim aside", previewColor: "#0D1B2A", style: "header" },
  { id: "pittsburgh", description: "Deep navy, wide aside, box layout", previewColor: "#1A1A2E", style: "header" },
  { id: "cincinnati", description: "Slate, card timeline, accent lines", previewColor: "#0F172A", style: "header" },
  { id: "louisville", description: "Charcoal, clean underline sections", previewColor: "#1E293B", style: "header" },
  { id: "richmond", description: "Dark, airy body, dot labels", previewColor: "#111827", style: "header" },
  { id: "raleigh", description: "Midnight, compact, narrow aside", previewColor: "#0D1B2A", style: "header" },
  { id: "miami-cv", description: "Deep navy, timeline, hobbies in aside", previewColor: "#1A1A2E", style: "header" },
  { id: "phoenix", description: "Slate, box sections, skill aside", previewColor: "#0F172A", style: "header" },
  { id: "detroit", description: "Charcoal, card layout, dot sections", previewColor: "#1E293B", style: "header" },
  { id: "memphis", description: "Dark, compact, chip skills", previewColor: "#111827", style: "header" },
  { id: "st-louis", description: "Midnight, wide aside, full sections", previewColor: "#0D1B2A", style: "header" },
  { id: "bauhaus", description: "Left-aligned, solid divider, compact", previewColor: "#0F172A", style: "minimal" },
  { id: "futura-cv", description: "Blue accent name, accent-line sections", previewColor: "#1D4ED8", style: "minimal" },
  { id: "bodoni-cv", description: "No divider, borderless, generous whitespace", previewColor: "#111827", style: "minimal" },
  { id: "garamond-cv", description: "Dotted divider, dot-label sections", previewColor: "#374151", style: "minimal" },
  { id: "caslon", description: "Tag labels, compact, solid divider", previewColor: "#0F172A", style: "minimal" },
  { id: "palatino-cv", description: "No divider, accent name, airy", previewColor: "#1E293B", style: "minimal" },
  { id: "baskerville-cv", description: "Box sections, dotted divider", previewColor: "#374151", style: "minimal" },
  { id: "didot-cv", description: "Card experience, accent name, solid divider", previewColor: "#111827", style: "minimal" },
  { id: "clarendon-cv", description: "No divider, accent-line sections", previewColor: "#0F172A", style: "minimal" },
  { id: "rockwell-cv", description: "Dot sections, compact, solid divider", previewColor: "#1E293B", style: "minimal" },
  { id: "brutalist-cv", description: "Tag labels, accent name, borderless", previewColor: "#0F172A", style: "minimal" },
  { id: "modernist-cv", description: "Blue accent name, dotted divider", previewColor: "#1D4ED8", style: "minimal" },
  { id: "constructivist", description: "Red accent, box sections, compact", previewColor: "#DC2626", style: "minimal" },
  { id: "deco-cv", description: "Gold accent name, airy, accent lines", previewColor: "#B45309", style: "minimal" },
  { id: "structuralist", description: "Dot sections, dotted divider, slate", previewColor: "#374151", style: "minimal" },
  { id: "impressionist-cv", description: "Purple accent, borderless sections, airy", previewColor: "#7C3AED", style: "minimal" },
  { id: "baroque-cv", description: "Card experience, no divider, dark", previewColor: "#0F172A", style: "minimal" },
  { id: "classical-cv", description: "Tag labels, dotted divider, charcoal", previewColor: "#1E293B", style: "minimal" },
  { id: "neoclassical-cv", description: "Box sections, compact, solid divider", previewColor: "#111827", style: "minimal" },
  { id: "avant-garde-cv", description: "Violet accent name, accent lines", previewColor: "#6D28D9", style: "minimal" },
  { id: "de-stijl", description: "Blue, dot sections, card experience", previewColor: "#1D4ED8", style: "minimal" },
  { id: "suprematist", description: "Borderless, accent name, ultra-compact", previewColor: "#0F172A", style: "minimal" },
  { id: "dadaist", description: "Dotted divider, underline sections", previewColor: "#374151", style: "minimal" },
  { id: "futurism-cv", description: "Red accent name, tag labels, airy", previewColor: "#DC2626", style: "minimal" },
  { id: "nebula", description: "Centered violet name, airy whitespace", previewColor: "#6D28D9", style: "minimal" },
  { id: "cosmos", description: "Dark centered name, accent lines, airy", previewColor: "#1E293B", style: "minimal" },
  { id: "orbit", description: "Cyan, dot sections, dotted divider", previewColor: "#0891B2", style: "minimal" },
  { id: "solstice", description: "Amber name, tag labels, solid divider", previewColor: "#D97706", style: "minimal" },
  { id: "equinox", description: "No divider, borderless, spacious", previewColor: "#374151", style: "minimal" },
  { id: "zenith", description: "Purple name, underline sections", previewColor: "#7C3AED", style: "minimal" },
  { id: "solaris", description: "Amber, box sections, card experience", previewColor: "#F59E0B", style: "minimal" },
  { id: "lunar", description: "Dark centered, accent lines, spacious", previewColor: "#1E293B", style: "minimal" },
  { id: "stellar", description: "Dark, dot sections, dotted divider", previewColor: "#0F172A", style: "minimal" },
  { id: "stratus", description: "Slate, borderless, compact centered", previewColor: "#374151", style: "minimal" },
  { id: "nimbus", description: "Blue name, compact, no divider", previewColor: "#1D4ED8", style: "minimal" },
  { id: "cirrus", description: "Cyan, tag labels, dotted divider", previewColor: "#0891B2", style: "minimal" },
  { id: "cumulus", description: "Green name, box sections, airy", previewColor: "#059669", style: "minimal" },
  { id: "altus", description: "Slate, card experience, accent lines", previewColor: "#374151", style: "minimal" },
  { id: "celeste", description: "Pink name, dot sections, dotted divider", previewColor: "#BE185D", style: "minimal" },
  { id: "quantum", description: "Charcoal, borderless centered body", previewColor: "#1E293B", style: "minimal" },
  { id: "photon", description: "Sky blue name, airy, underline sections", previewColor: "#0284C7", style: "minimal" },
  { id: "quasar", description: "Purple, accent lines, dotted divider", previewColor: "#7C3AED", style: "minimal" },
  { id: "pulsar", description: "Dark name, tag labels, compact", previewColor: "#0F172A", style: "minimal" },
  { id: "gravity", description: "Slate, box sections, no divider", previewColor: "#374151", style: "minimal" },
  { id: "vector", description: "Blue name, dot sections, airy", previewColor: "#1D4ED8", style: "minimal" },
  { id: "neural", description: "Green, card experience, centered", previewColor: "#059669", style: "minimal" },
  { id: "cipher", description: "Red name, accent lines, no divider", previewColor: "#DC2626", style: "minimal" },
  { id: "prism", description: "Violet banner, card timeline, no aside", previewColor: "#8B5CF6", style: "creative" },
  { id: "mosaic", description: "Teal banner, skill aside, chip tags", previewColor: "#0891B2", style: "creative" },
  { id: "parallax", description: "Red banner, aside, card experience", previewColor: "#DC2626", style: "creative" },
  { id: "collage", description: "Amber banner, full aside, dot sections", previewColor: "#F59E0B", style: "creative" },
  { id: "panorama", description: "Green banner, single column, airy", previewColor: "#059669", style: "creative" },
  { id: "montage", description: "Pink banner, photo right, timeline", previewColor: "#BE185D", style: "creative" },
  { id: "fjord", description: "Ocean blue banner, airy single column", previewColor: "#0369A1", style: "creative" },
  { id: "canyon", description: "Brick banner, compact, aside", previewColor: "#7C2D12", style: "creative" },
  { id: "veldt", description: "Forest banner, tag labels", previewColor: "#166534", style: "creative" },
  { id: "fractal", description: "Light grey sidebar, purple accent lines", previewColor: "#6D28D9", style: "creative" },
  { id: "relief", description: "Ice blue sidebar, rounded photo", previewColor: "#1D4ED8", style: "creative" },
  { id: "tableau", description: "Lavender sidebar, square photo, cards", previewColor: "#7C3AED", style: "creative" },
  { id: "cameo", description: "Warm cream sidebar, amber accent", previewColor: "#D97706", style: "creative" },
  { id: "vignette", description: "Mint sidebar, airy accent lines", previewColor: "#059669", style: "creative" },
  { id: "lagoon", description: "Teal mint sidebar, rounded photo", previewColor: "#0F766E", style: "creative" },
  { id: "delta", description: "Sand sidebar, square photo, card body", previewColor: "#B45309", style: "creative" },
  { id: "plateau", description: "Near-white sidebar, navy accent", previewColor: "#1E3A8A", style: "creative" },
  { id: "highland", description: "Clean white sidebar, dark accent lines", previewColor: "#0F172A", style: "creative" },
  { id: "estuary", description: "Light blue sidebar, chip skills", previewColor: "#0891B2", style: "creative" },
  { id: "mesa", description: "Warm sand sidebar, compact, square", previewColor: "#92400E", style: "creative" },
  { id: "contour", description: "Slate-tint sidebar, box sections", previewColor: "#1E293B", style: "creative" },
  { id: "silhouette", description: "Barely-there sidebar, sharp accent lines", previewColor: "#0F172A", style: "creative" }
];
var TEMPLATES = TEMPLATE_PRESENTATION.map((t) => ({
  ...t,
  name: TEMPLATE_REGISTRY[t.id]?.name ?? t.id
}));
var CURATED_CV_TEMPLATES = CURATED_CV_TEMPLATE_IDS.map((id) => TEMPLATES.find((t) => t.id === id)).filter((t) => Boolean(t));
var VALID_TEMPLATE_IDS = new Set(TEMPLATES.map((t) => t.id));

// .qa-io/item2-parse.ts
var skills = (level) => ["TypeScript", "React", "Node.js", "PostgreSQL", "Docker", "AWS", "GraphQL", "Kubernetes", "Terraform"].map((name, i) => level === "__missing__" ? { id: `s${i}`, name } : { id: `s${i}`, name, level });
var cv = (level) => ({
  personal: { fullName: "Amina Joseph Mwakasege", jobTitle: "Software Engineer", email: "a@b.co", phone: "0712", location: "Dar es Salaam" },
  summary: "Software engineer with 6 years building payment platforms.",
  experience: [{ id: "e1", company: "Acme", position: "Engineer", startDate: "2020", endDate: "2024", current: false, description: "Built things." }],
  education: [{ id: "d1", institution: "UDSM", degree: "BSc", field: "CS", startDate: "2014", endDate: "2018" }],
  skills: skills(level),
  languages: [{ id: "l1", name: "Swahili", proficiency: "Native" }],
  certifications: [{ id: "c1", name: "AWS SAA", issuer: "Amazon", date: "2023" }],
  referees: [{ id: "r1", name: "Baraka Mushi", title: "CTO", company: "PayCo", email: "b@c.co", phone: "0713" }],
  hobbies: "Long-distance running."
});
var cases = [
  ["level:3 (all valid)", 3],
  ["level missing", "__missing__"],
  ["level:'3' (string)", "3"],
  ["level:0", 0],
  ["level:7", 7]
];
var out = {};
for (const [label, level] of cases) {
  const parsed = parseCVData(cv(level));
  out[label] = {
    skillsIn: 9,
    skillsOut: parsed.skills.length,
    skillNamesOut: parsed.skills.map((s) => s.name),
    levelsOut: parsed.skills.map((s) => s.level),
    experienceOut: parsed.experience.length,
    educationOut: parsed.education.length,
    certificationsOut: parsed.certifications.length,
    languagesOut: parsed.languages.length,
    refereesOut: parsed.referees.length,
    fullName: parsed.personal.fullName
  };
}
console.log(JSON.stringify(out, null, 1));
