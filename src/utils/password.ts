// Shared by the form (hint + validation) and Better Auth (server-side rule),
// so the two can't drift apart.
export const MIN_PASSWORD_LENGTH = 12;

export const PASSWORD_HINT = `At least ${MIN_PASSWORD_LENGTH} characters, with an uppercase letter, a lowercase letter, a number and a symbol`;
