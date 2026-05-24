let counter = 0;

export function nanoid(length = 12): string {
  const chars =
    "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  result += Date.now().toString(36);
  result += (++counter).toString(36);
  return result;
}
