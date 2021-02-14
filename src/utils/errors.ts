export const mapErrors = (errors: Record<string, string[]>): string[] =>
  Object.keys(errors)
    .map(key => errors[key].map(message => [key, message].join(" ")))
    .flat();
