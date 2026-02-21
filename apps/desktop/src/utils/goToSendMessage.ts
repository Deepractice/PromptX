export function goToSendMessage(prompt: string, options?: { roleResources?: string }) {
  ;(window as any).__agentx_pending_message = prompt
  ;(window as any).__agentx_pending_options = options
  window.dispatchEvent(new CustomEvent("navigate", { detail: { page: "agentx" } }))
}
