interface RuleConditions {
  propertyTypes?: string[];
  conditionModifiers?: string[];
  weekdays?: number[]; // 0=Sunday..6=Saturday
}

/**
 * Evaluates a PricingRule.conditionsJson blob against the current booking
 * request. A rule matches if every condition group it declares intersects
 * with the request (a rule with no relevant keys always matches, letting
 * Admin define broad "applies to everything" rules).
 */
export function matchesRuleConditions(
  conditions: unknown,
  context: { propertyType: string; conditionModifiers: string[]; requestedDate: Date }
): boolean {
  const c = (conditions ?? {}) as RuleConditions;

  if (c.propertyTypes && !c.propertyTypes.includes(context.propertyType)) {
    return false;
  }

  if (
    c.conditionModifiers &&
    !c.conditionModifiers.some((mod) => context.conditionModifiers.includes(mod))
  ) {
    return false;
  }

  if (c.weekdays && !c.weekdays.includes(context.requestedDate.getUTCDay())) {
    return false;
  }

  return true;
}
