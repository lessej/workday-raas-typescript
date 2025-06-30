import { WorkdayRequest } from "./request.js"

export class WorkdayRequestJson extends WorkdayRequest {
  async send(): Promise<any> {
    const token = await this.client.auth()
    const endpoint = this.endpoint.toString()
    const headers = { Authorization: `Bearer ${token}` }
    const res = await fetch(endpoint, {
      method: "GET",
      headers: headers,
    })

    const jsonRes = await res.json()

    return jsonRes
  }
}
