import { XMLParser } from "fast-xml-parser"
import { WorkdayClient } from "./client.js"
import { WorkdayRequest } from "./request.js"

export class WorkdayRequestXml extends WorkdayRequest {
  async send(): Promise<any> {
    const token = await this.client.auth()
    const endpoint = this.endpoint.toString()
    const headers = { Authorization: `Bearer ${token}` }
    const res = await fetch(endpoint, {
      method: "GET",
      headers: headers,
    })

    const textRes = await res.text()
    const parser = new XMLParser()

    return parser.parse(textRes)
  }
}
