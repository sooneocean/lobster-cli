// LangGraph checkpointer adapter for lobster-cli state inspect/rollback
// Implement these two functions for your runtime.

export async function getThreadState(threadId: string) {
  // Example (pseudo):
  // const saver = await createCheckpointer(defaultCheckpointer)
  // return saver.get(threadId)
  return { thread_id: threadId, note: "TODO: implement checkpointer.get" };
}

export async function rollbackThread(threadId: string, step: string) {
  // Example (pseudo):
  // const saver = await createCheckpointer(defaultCheckpointer)
  // await saver.rollback(threadId, step)
  return { thread_id: threadId, step };
}
