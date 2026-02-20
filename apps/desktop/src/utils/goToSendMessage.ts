export function goToSendMessage(prompt: string) {
  ;(window as any).__agentx_pending_message = prompt
  window.dispatchEvent(new CustomEvent("navigate", { detail: { page: "agentx" } }))
}
