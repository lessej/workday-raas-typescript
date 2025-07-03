import { XMLParser } from "fast-xml-parser"

interface WorkdayRequestImpl {
  param: (key: string, val: string) => WorkdayRequest
  json: (parse: boolean) => Promise<any | JSON>
  xml: (parse: boolean) => Promise<any | JSON>
}

export class WorkdayRequest implements WorkdayRequestImpl {
  private endpoint: URL
  protected authRequest: () => Promise<string>

  constructor(endpoint: string, authRequest: () => Promise<string>) {
    const apiEndpoint = new URL(endpoint)
    this.endpoint = apiEndpoint
    this.authRequest = authRequest
    return this
  }

  param(key: string, val: string): WorkdayRequest {
    this.endpoint.searchParams.append(key, val)
    return this
  }

  private async getWorkdayRes(): Promise<Response> {
    const endpoint = this.endpoint.toString()
    const token = await this.authRequest()
    const headers = { Authorization: `Bearer ${token}` }
    const res = await fetch(endpoint, {
      method: "GET",
      headers: headers,
    })

    return res
  }

  async json(parse: boolean = true): Promise<any | JSON> {
    this.endpoint.searchParams.append("format", "json")
    const res = await this.getWorkdayRes()

    if (parse) {
      const jsonRes = await res.json()
      return jsonRes
    }

    const textRes = await res.text()
    return textRes
  }

  async xml(parse: boolean = true): Promise<any | JSON> {
    const res = await this.getWorkdayRes()
    const textRes = await res.text()

    if (parse) {
      const parser = new XMLParser()
      return parser.parse(textRes)
    }

    return textRes
  }
}
