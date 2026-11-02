// The `analytics` operations: a client's value, cost, ROI and anomalies
// over a period.

import type { RequestOptions } from "../options.js";
import { call } from "../request.js";
import type { TransportConfig } from "../transport.js";
import type {
  Anomalies,
  ClientCost,
  ClientValue,
  GetClientAnomaliesQuery,
  GetClientCostQuery,
  GetClientRoiQuery,
  GetClientValueQuery,
  RoiResult,
} from "../types.js";

/** The `analytics` operations. */
export class Analytics {
  readonly #config: TransportConfig;

  constructor(config: TransportConfig) {
    this.#config = config;
  }

  /**
   * Computes a client's value.
   *
   * Needs the `read` scope. Operation `getClientValue`.
   *
   * @param clientId - the client's id.
   */
  getValueForClient(
    clientId: string,
    query?: GetClientValueQuery,
    options?: RequestOptions,
  ): Promise<ClientValue> {
    return call(this.#config, "getClientValue", {
      path: { id: clientId },
      query,
      options,
    });
  }

  /**
   * Computes a client's cost over a period. Both bounds are required:
   * standing charges are prorated day by day, so an open `from` would
   * prorate each charge from its own start date, however long ago.
   *
   * Needs the `read` scope. Operation `getClientCost`.
   *
   * @param clientId - the client's id.
   */
  getCostForClient(
    clientId: string,
    query: GetClientCostQuery,
    options?: RequestOptions,
  ): Promise<ClientCost> {
    return call(this.#config, "getClientCost", {
      path: { id: clientId },
      query,
      options,
    });
  }

  /**
   * Computes a client's ROI over a period.
   *
   * Needs the `read` scope. Operation `getClientRoi`.
   *
   * @param clientId - the client's id.
   */
  getRoiForClient(
    clientId: string,
    query: GetClientRoiQuery,
    options?: RequestOptions,
  ): Promise<RoiResult> {
    return call(this.#config, "getClientRoi", {
      path: { id: clientId },
      query,
      options,
    });
  }

  /**
   * Flags anomalies in a client's period.
   *
   * Needs the `read` scope. Operation `getClientAnomalies`.
   *
   * @param clientId - the client's id.
   */
  getAnomaliesForClient(
    clientId: string,
    query: GetClientAnomaliesQuery,
    options?: RequestOptions,
  ): Promise<Anomalies> {
    return call(this.#config, "getClientAnomalies", {
      path: { id: clientId },
      query,
      options,
    });
  }
}
