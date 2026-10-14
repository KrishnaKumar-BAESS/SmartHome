import type { SmartHomeApi } from './agent-api';

/** The authenticated local service forwards scoped requests into this exact tab. */
export function connectAgentBridge(api: SmartHomeApi) {
  if (!window.location.pathname.startsWith('/house/')) return () => {};
  let stopped = false;
  let stream: EventSource | undefined;
  let retry: ReturnType<typeof setTimeout> | undefined;
  let tabId = '';
  const replies = new Set<AbortController>();
  const connect = async () => {
    if (stopped) return;
    const probe = new AbortController();
    replies.add(probe);
    try {
      const status = await fetch('/api/agent/bridge/status', {
        signal: probe.signal,
      });
      if (stopped || status.status === 404) return;
      if (!status.ok || !(await status.json()).ready) {
        if (!stopped)
          retry = setTimeout(() => {
            void connect();
          }, 5000);
        return;
      }
    } catch {
      if (!stopped)
        retry = setTimeout(() => {
          void connect();
        }, 5000);
      return;
    } finally {
      replies.delete(probe);
    }
    if (stopped) return;
    stream = new EventSource('/api/agent/bridge/events');
    stream.addEventListener('ready', (event: MessageEvent<string>) => {
      tabId = (JSON.parse(event.data) as { tabId: string }).tabId;
      document.documentElement.dataset.agentTab = tabId;
    });
    stream.onmessage = async (event: MessageEvent<string>) => {
      const call = JSON.parse(event.data) as {
        id: string;
        method: string;
        args: unknown[];
      };
      const thisTab = tabId;
      let reply: Record<string, unknown>;
      try {
        let result: unknown;
        switch (call.method) {
          case 'describe':
            result = api.describe();
            break;
          case 'getData':
            result = api.getData();
            break;
          case 'getState':
            result = api.getState();
            break;
          case 'query':
            result = api.query(
              call.args[0] as Parameters<SmartHomeApi['query']>[0],
            );
            break;
          case 'getRecord':
            result = api.getRecord(
              call.args[0] as Parameters<SmartHomeApi['getRecord']>[0],
              call.args[1] as string,
            );
            break;
          case 'execute':
            result = await api.execute(
              call.args[0] as Parameters<SmartHomeApi['execute']>[0],
            );
            break;
          default:
            throw new Error('Unknown bridge method.');
        }
        reply = { ok: true, result };
      } catch (error) {
        reply = {
          ok: false,
          error: {
            code: (error as { code?: string }).code ?? 'COMMAND_FAILED',
            message: error instanceof Error ? error.message : 'Command failed.',
          },
        };
      }
      if (stopped) return;
      const controller = new AbortController();
      replies.add(controller);
      try {
        await fetch('/api/agent/bridge/reply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: call.id, tabId: thisTab, ...reply }),
          signal: controller.signal,
        });
      } catch {
        /* Disconnection is reported to the program by the service timeout. */
      } finally {
        replies.delete(controller);
      }
    };
    stream.onerror = () => {
      stream?.close();
      delete document.documentElement.dataset.agentTab;
      // Signing in to admin enables the next connection without reloading the atlas.
      retry = setTimeout(connect, 5000);
    };
  };
  void connect();
  return () => {
    stopped = true;
    clearTimeout(retry);
    stream?.close();
    for (const controller of replies) controller.abort();
    delete document.documentElement.dataset.agentTab;
  };
}
