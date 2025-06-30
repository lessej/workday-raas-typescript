import { WorkdayClient } from "./client.js"

type OutputFormat = "json"

interface WorkdayRequestImpl {
  param: (key: string, val: string) => WorkdayRequest
  send: (req: WorkdayRequest) => Promise<JSON>
}

export abstract class WorkdayRequest implements WorkdayRequestImpl {
  protected endpoint: URL
  protected client: WorkdayClient

  constructor(client: WorkdayClient, endpoint: string, outputFormat: OutputFormat) {
    const apiEndpoint = new URL(endpoint)
    switch (outputFormat) {
      case "json":
      default:
        apiEndpoint.searchParams.append("format", "json")
    }
    this.endpoint = apiEndpoint
    this.client = client
    return this
  }

  param(key: string, val: string): WorkdayRequest {
    this.endpoint.searchParams.append(key, val)
    return this
  }

  abstract send(): Promise<any>
}
