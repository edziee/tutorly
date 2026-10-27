export async function runStreakReminderOperation(operation, action) {
  try {
    return await action();
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    const wrapped = new Error(`Study streak reminder failed during ${operation}: ${detail}`);
    wrapped.cause = error;
    throw wrapped;
  }
}
