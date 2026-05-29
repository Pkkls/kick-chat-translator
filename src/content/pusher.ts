import { KICK_PUSHER_WS } from '~/shared/constants';
import { rootLogger } from '~/shared/logger';

const log = rootLogger.child('pusher');

interface PusherEvent {
  event: string;
  data: string;
  channel?: string;
}

interface KickChatMessage {
  id: string;
  chatroom_id: number;
  content: string;
  type?: string;
  created_at?: string;
  sender?: {
    id?: number;
    username?: string;
    slug?: string;
    identity?: { color?: string; badges?: { type: string }[] };
  };
}

export interface PusherMessageEvent {
  id: string;
  content: string;
  username: string;
  timestampMs: number;
  isBot: boolean;
  badges: string[];
}

type Handler = (msg: PusherMessageEvent) => void;

export class KickPusherClient {
  private ws: WebSocket | undefined;
  private socketId: string | undefined;
  private reconnectAttempt = 0;
  private subscribed = new Set<number>();
  private handler: Handler;
  private pingTimer: ReturnType<typeof setInterval> | undefined;
  private destroyed = false;

  constructor(handler: Handler) {
    this.handler = handler;
  }

  start(chatroomId: number): void {
    this.subscribed.add(chatroomId);
    this.connect();
  }

  switchChatroom(newId: number): void {
    for (const oldId of this.subscribed) {
      this.send({
        event: 'pusher:unsubscribe',
        data: { channel: `chatrooms.${oldId}.v2` },
      });
    }
    this.subscribed.clear();
    this.subscribed.add(newId);
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.subscribeAll();
    } else {
      this.connect();
    }
  }

  stop(): void {
    this.destroyed = true;
    if (this.pingTimer) clearInterval(this.pingTimer);
    this.ws?.close();
  }

  private connect(): void {
    if (this.destroyed) return;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }
    try {
      this.ws = new WebSocket(KICK_PUSHER_WS);
    } catch (err: unknown) {
      log.warn('WS construct failed', err);
      this.scheduleReconnect();
      return;
    }

    this.ws.addEventListener('open', () => {
      log.debug('WS open');
      this.reconnectAttempt = 0;
    });

    this.ws.addEventListener('message', (ev: MessageEvent<string>) => {
      this.onRaw(ev.data);
    });

    this.ws.addEventListener('close', (ev) => {
      log.debug('WS closed', ev.code);
      if (this.pingTimer) clearInterval(this.pingTimer);
      if (!this.destroyed) this.scheduleReconnect();
    });

    this.ws.addEventListener('error', () => {
      // Errors fire before close; close handler will reconnect
    });
  }

  private scheduleReconnect(): void {
    if (this.destroyed) return;
    this.reconnectAttempt += 1;
    const delay = Math.min(30_000, 1000 * 2 ** this.reconnectAttempt);
    setTimeout(() => this.connect(), delay);
  }

  private subscribeAll(): void {
    for (const id of this.subscribed) {
      this.send({
        event: 'pusher:subscribe',
        data: { channel: `chatrooms.${id}.v2` },
      });
    }
  }

  private send(payload: { event: string; data: unknown }): void {
    if (this.ws?.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify(payload));
  }

  private onRaw(raw: string): void {
    let frame: PusherEvent;
    try {
      frame = JSON.parse(raw) as PusherEvent;
    } catch {
      return;
    }

    switch (frame.event) {
      case 'pusher:connection_established': {
        try {
          const data = JSON.parse(frame.data) as { socket_id?: string };
          this.socketId = data.socket_id;
        } catch {
          /* ignore */
        }
        this.subscribeAll();
        this.startPing();
        return;
      }
      case 'pusher:pong':
      case 'pusher_internal:subscription_succeeded':
        return;
      case 'pusher:error': {
        log.warn('pusher error frame', frame.data);
        try {
          const data = JSON.parse(frame.data) as { code?: number };
          // 4001 = app key invalid; retrying won't help, give up for this session
          if (data.code === 4001) {
            this.destroyed = true;
            this.ws?.close();
          }
        } catch {
          /* ignore */
        }
        return;
      }
      case 'App\\Events\\ChatMessageEvent': {
        try {
          const msg = JSON.parse(frame.data) as KickChatMessage;
          if (!msg.id || !msg.content || !msg.sender?.username) return;
          if (msg.type && msg.type !== 'message' && msg.type !== 'reply') return;
          const ts = msg.created_at ? Date.parse(msg.created_at) : Date.now();
          const badges = msg.sender.identity?.badges?.map((b) => b.type) ?? [];
          this.handler({
            id: msg.id,
            content: msg.content,
            username: msg.sender.username.toLowerCase(),
            timestampMs: Number.isFinite(ts) ? ts : Date.now(),
            isBot: badges.includes('bot'),
            badges,
          });
        } catch (err: unknown) {
          log.warn('Failed to parse chat event', err);
        }
        return;
      }
      default:
        return;
    }
  }

  private startPing(): void {
    if (this.pingTimer) clearInterval(this.pingTimer);
    this.pingTimer = setInterval(() => {
      this.send({ event: 'pusher:ping', data: {} });
    }, 25_000);
  }

  getSocketId(): string | undefined {
    return this.socketId;
  }
}
