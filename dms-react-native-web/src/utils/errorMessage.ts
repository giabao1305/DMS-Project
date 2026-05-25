const vi = {
  connect: "Kh\u00f4ng k\u1ebft n\u1ed1i \u0111\u01b0\u1ee3c m\u00e1y ch\u1ee7. Vui l\u00f2ng ki\u1ec3m tra m\u1ea1ng ho\u1eb7c backend.",
  session: "Phi\u00ean \u0111\u0103ng nh\u1eadp kh\u00f4ng h\u1ee3p l\u1ec7 ho\u1eb7c \u0111\u00e3 h\u1ebft h\u1ea1n.",
  forbidden: "B\u1ea1n kh\u00f4ng c\u00f3 quy\u1ec1n th\u1ef1c hi\u1ec7n thao t\u00e1c n\u00e0y.",
  notFound: "Kh\u00f4ng t\u00ecm th\u1ea5y d\u1eef li\u1ec7u y\u00eau c\u1ea7u.",
  badRequest: "D\u1eef li\u1ec7u g\u1eedi l\u00ean ch\u01b0a h\u1ee3p l\u1ec7.",
  server: "M\u00e1y ch\u1ee7 \u0111ang g\u1eb7p s\u1ef1 c\u1ed1. Vui l\u00f2ng th\u1eed l\u1ea1i sau.",
  login: "Email ho\u1eb7c m\u1eadt kh\u1ea9u kh\u00f4ng ch\u00ednh x\u00e1c.",
  account: "Kh\u00f4ng t\u00ecm th\u1ea5y t\u00e0i kho\u1ea3n.",
  password: "M\u1eadt kh\u1ea9u kh\u00f4ng ch\u00ednh x\u00e1c.",
  currentPassword: "M\u1eadt kh\u1ea9u hi\u1ec7n t\u1ea1i kh\u00f4ng ch\u00ednh x\u00e1c.",
  expired: "Phi\u00ean \u0111\u0103ng nh\u1eadp \u0111\u00e3 h\u1ebft h\u1ea1n. Vui l\u00f2ng \u0111\u0103ng nh\u1eadp l\u1ea1i.",
  requestFailed: "Y\u00eau c\u1ea7u th\u1ea5t b\u1ea1i. M\u00e3 l\u1ed7i $1.",
  uploadFailed: "T\u1ea3i \u1ea3nh l\u00ean th\u1ea5t b\u1ea1i. M\u00e3 l\u1ed7i $1.",
  timeout: "K\u1ebft n\u1ed1i qu\u00e1 l\u00e2u. Vui l\u00f2ng th\u1eed l\u1ea1i.",
  duplicate: "D\u1eef li\u1ec7u n\u00e0y \u0111\u00e3 t\u1ed3n t\u1ea1i trong h\u1ec7 th\u1ed1ng.",
  invalidData: "D\u1eef li\u1ec7u g\u1eedi l\u00ean ch\u01b0a h\u1ee3p l\u1ec7. Vui l\u00f2ng ki\u1ec3m tra l\u1ea1i.",
  email: "Email ch\u01b0a \u0111\u00fang \u0111\u1ecbnh d\u1ea1ng.",
  passwordLength: "M\u1eadt kh\u1ea9u ch\u01b0a \u0111\u1ea1t \u0111\u1ed9 d\u00e0i t\u1ed1i thi\u1ec3u.",
  phone: "S\u1ed1 \u0111i\u1ec7n tho\u1ea1i ch\u01b0a \u0111\u00fang \u0111\u1ecbnh d\u1ea1ng.",
  required: "Vui l\u00f2ng nh\u1eadp \u0111\u1ea7y \u0111\u1ee7 th\u00f4ng tin b\u1eaft bu\u1ed9c.",
  visitTooFar: "B\u1ea1n \u0111ang \u1edf qu\u00e1 xa \u0111i\u1ec3m b\u00e1n. Vui l\u00f2ng \u0111\u1ebfn g\u1ea7n kh\u00e1ch h\u00e0ng h\u01a1n r\u1ed3i th\u1eed l\u1ea1i.",
  locationMissing: "Ch\u01b0a c\u00f3 t\u1ecda \u0111\u1ed9 c\u1ee7a \u0111i\u1ec3m b\u00e1n. Vui l\u00f2ng c\u1eadp nh\u1eadt v\u1ecb tr\u00ed kh\u00e1ch h\u00e0ng tr\u01b0\u1edbc khi vi\u1ebfng th\u0103m.",
  locationInvalid: "T\u1ecda \u0111\u1ed9 GPS ch\u01b0a h\u1ee3p l\u1ec7. Vui l\u00f2ng l\u1ea5y l\u1ea1i v\u1ecb tr\u00ed hi\u1ec7n t\u1ea1i.",
  unknown: "\u0110\u00e3 c\u00f3 l\u1ed7i x\u1ea3y ra. Vui l\u00f2ng th\u1eed l\u1ea1i.",
};

const exactMessages: Record<string, string> = {
  "Failed to fetch": vi.connect,
  "Network request failed": vi.connect,
  Unauthorized: vi.session,
  Forbidden: vi.forbidden,
  "Not Found": vi.notFound,
  "Bad Request": vi.badRequest,
  "Internal server error": vi.server,
  "Invalid credentials": vi.login,
  "Email or password is incorrect": vi.login,
  "User not found": vi.account,
  "Password is incorrect": vi.password,
  "Current password is incorrect": vi.currentPassword,
  "Token expired": vi.expired,
};

const patternMessages: Array<[RegExp, string, boolean?]> = [
  [/^Request failed \((\d+)\)$/i, vi.requestFailed, true],
  [/^Upload failed \((\d+)\)$/i, vi.uploadFailed, true],
  [/too\s*far|far\s*from|distance|outside.*radius|allowed radius|out of range|not within|beyond.*range/i, vi.visitTooFar],
  [/customer.*location.*(missing|required|not found)|location.*customer.*(missing|required|not found)|customer.*coordinate/i, vi.locationMissing],
  [/invalid.*(gps|location|coordinate)|(gps|location|coordinate).*invalid/i, vi.locationInvalid],
  [/timeout|aborted/i, vi.timeout],
  [/invalid credentials|wrong password|incorrect password/i, vi.login],
  [/unauthorized|jwt|token/i, vi.session],
  [/forbidden|permission|access denied/i, vi.forbidden],
  [/not found/i, vi.notFound],
  [/duplicate|already exists/i, vi.duplicate],
  [/validation|invalid|bad request/i, vi.invalidData],
  [/email.*(valid|invalid|format)/i, vi.email],
  [/password.*(short|length|minimum|min)/i, vi.passwordLength],
  [/phone.*(valid|invalid|format)/i, vi.phone],
  [/required|should not be empty|must not be empty/i, vi.required],
  [/server error|internal/i, vi.server],
  [/network|fetch|connection/i, vi.connect],
];

export function toVietnameseError(message?: string | null) {
  const value = message?.trim();
  if (!value) return vi.unknown;

  if (exactMessages[value]) return exactMessages[value];

  for (const [pattern, replacement, keepCaptures] of patternMessages) {
    if (pattern.test(value)) {
      return keepCaptures ? value.replace(pattern, replacement) : replacement;
    }
  }

  return value;
}
