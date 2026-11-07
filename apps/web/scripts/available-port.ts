import { once } from "node:events";
import { createServer } from "node:net";
import type { AddressInfo } from "node:net";

// Gives a free TCP port on the loopback address. The port is free when this
// function returns, but another process can take it before the caller does.
export const availablePort = async (): Promise<number> => {
  const server = createServer();
  const listening = once(server, "listening");
  server.listen(0, "127.0.0.1");
  await listening;
  // SAFETY: listening on an IP address gives AddressInfo, never a pipe name.
  const address = server.address() as AddressInfo;
  const closed = once(server, "close");
  server.close();
  await closed;
  return address.port;
};
