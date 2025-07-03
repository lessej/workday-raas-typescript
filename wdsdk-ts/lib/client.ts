import { jwtDecode, JwtPayload } from "jwt-decode"
import { WorkdayRequest } from "./request.js"

type TokenResponse = { access_token: string }

type IsuCredentials = {
  clientId: string,
  clientSecret: string,
  refreshToken: string,
}

interface WorkdayClientImpl {
  request: (endpoint: string) => WorkdayRequest
}

export class WorkdayClient implements WorkdayClientImpl {
  private authEndpoint: string
  private isuCredentials: IsuCredentials
  private token: string | undefined

  constructor(isuCredentials: IsuCredentials, authEndpoint: string) {
    this.isuCredentials = isuCredentials
    this.authEndpoint = authEndpoint
    return this
  }

  private isTokenExpired(token: string) {
    const { exp } = jwtDecode<JwtPayload>(token)
    if (exp === undefined) {
      return true
    }
    return Date.now() >= exp * 1000
  }

  private async auth(): Promise<string> {
    if (!this.token || this.isTokenExpired(this.token)) {
      const token = await this.getToken()
      this.token = token
    }
    return this.token
  }

  private async getToken(): Promise<string> {
    const { clientId, clientSecret, refreshToken } = this.isuCredentials
    const encodedToken = btoa(`${clientId}:${clientSecret}`)
    const body = new URLSearchParams()
    body.append("grant_type", "refresh_token")
    body.append("refresh_token", refreshToken)
    const headers = {
      "Content-type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${encodedToken}`,
    }

    try {
      const res = await fetch(this.authEndpoint, {
        method: "POST",
        body: body.toString(),
        headers: headers,
      })

      const jsonRes = await res.json() 
      return (jsonRes as TokenResponse).access_token
    } catch (err) {
      return ""
    }
  }

  request(endpoint: string): WorkdayRequest {
    const authRequest = () => {
      return this.auth()
    }
    return new WorkdayRequest(endpoint, authRequest)
  }
}
