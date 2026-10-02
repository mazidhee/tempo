/** Native commands stay in diagnostics; product errors describe recovery. */
export function guardError(
  error: unknown,
  operation: 'websites' | 'apps' | 'cleanup' = 'websites',
) {
  const raw = error instanceof Error ? error.message : String(error);
  if (/cancel(?:l)?ed|1223|denied|permission|elevation/i.test(raw))
    return operation === 'cleanup'
      ? 'Website cleanup needs permission. Choose Repair and approve the Windows prompt.'
      : 'Website blocking needs permission. App Guard remains available. Choose Retry websites and approve the Windows prompt.';
  return operation === 'apps'
    ? 'App Guard could not check or close a selected app. Refresh the running app list in Settings → Focus.'
    : operation === 'cleanup'
      ? 'Website cleanup could not be verified. Choose Repair in Settings → Focus.'
      : 'Website blocking could not start. App Guard remains available. Choose Retry websites in Settings → Focus.';
}
