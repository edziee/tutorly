// Used by the service files while a function is still a placeholder.
// Replace the call with the real code, and delete the import when a file has
// no placeholders left.
export function notImplemented(functionName, owner) {
  return new Error(
    `${functionName} is not implemented yet (owner: ${owner}). See docs/members for the task.`,
  );
}
