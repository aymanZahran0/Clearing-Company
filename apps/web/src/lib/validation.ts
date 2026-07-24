import * as yup from "yup";

const SAUDI_MOBILE_PATTERN = /^05\d{8}$/;

export function createSaudiMobileSchema(requiredMessage: string, invalidMessage: string) {
  return yup
    .string()
    .required(requiredMessage)
    .matches(SAUDI_MOBILE_PATTERN, invalidMessage);
}
