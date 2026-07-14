import type { Request } from "express";
import { ApiError } from "@nuqaa-asir/shared";

/**
 * `noUncheckedIndexedAccess` makes every `req.params.x` read as
 * `string | undefined` (Express's ParamsDictionary has a string index
 * signature). Route params matched by the router are always present for a
 * matched route, so this narrows the type and throws a clear 400 in the
 * (should-be-impossible) case where Express didn't populate it.
 */
export function requireParam(req: Request, name: string): string {
  const value = req.params[name];
  if (!value) {
    throw new ApiError(400, "VALIDATION_ERROR", `Missing required route parameter: ${name}`);
  }
  return value;
}
