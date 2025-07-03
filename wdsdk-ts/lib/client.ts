import { jwtDecode, JwtPayload } from "jwt-decode"
import { WorkdayRequest } from "./request.js"
import { InternalError, isGeneratedError } from "./error.js"

type TokenResponse = { access_token: string }

type IsuCredentials = {
  clientId: string,
  clientSecret: string,
  refreshToken: string,
}

interface RaasClientImpl {
  request: (endpoint: string) => WorkdayRequest
}

const isTokenExpired = (token: string): boolean => {
  try {
    const { exp } = jwtDecode<JwtPayload>(token)
    if (exp === undefined) {
      return true
    }
    return Date.now() >= exp * 1000
  } catch (err) {
    throw new InternalError(`The format of the token was invalid: ${err}.`)
  }
}

/**
 * A Workday RaaS client configured to auth requests to Workday RaaS endpoints.
 *
 * @example
 * const client = new WorkdayClient({
 *   clientId: "my-id",
 *   clientSecret: "my-secret",
 *   refreshToken: "my-refresh-token",
 * }, "my-auth-endpoint")
 */
export class RaasClient implements RaasClientImpl {
  private authEndpoint: string
  private isuCredentials: IsuCredentials
  private token: string | undefined

  constructor(isuCredentials: IsuCredentials, authEndpoint: string) {
    this.isuCredentials = isuCredentials
    this.authEndpoint = authEndpoint
    return this
  }

  private async auth(): Promise<string> {
    if (!this.token || isTokenExpired(this.token)) {
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

      if (!res.ok) {
        throw new InternalError(`An error occured during the auth request to Workday: ${await res.text()}.`)
      }

      const jsonRes = await res.json() 
      const token = (jsonRes as TokenResponse).access_token

      if (!token) {
        throw new InternalError("An unexpected response was received from Workday.  access_token was not included")
      }
      
      return token
    } catch (err) {
      if (!isGeneratedError(err)) {
        throw new InternalError(`An error occured during the auth request to Workday: ${err}.`)
      }
      throw err
    }
  }

  /**
   * Creates a reusable RaaS request object.
   *
   * @example
   * const req = client.request("my-raas-endpoint.workday.com")
   */
  request(endpoint: string): WorkdayRequest {
    const authRequest = () => {
      return this.auth()
    }
    return new WorkdayRequest(endpoint, authRequest)
  }
}

if (import.meta.vitest) {
  const { expect, it } = import.meta.vitest
  it("isTokenExpired", () => {
    const mockNotExpiringToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZXhwIjoiOTU2MzM0NDc0NjciLCJuYW1lIjoiSm9obiBEb2UiLCJhZG1pbiI6dHJ1ZSwiaWF0IjoxNzUxNjM5NTk1fQ.dIW0QVtqiw2P8TbGWeQxmnn9lw95ey4HNmRze_lfTHU"
    const mockExpiredtoken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZXhwIjoiMTEyMDQwMTA2NyIsIm5hbWUiOiJKb2huIERvZSIsImFkbWluIjp0cnVlLCJpYXQiOjE3NTE2Mzk1OTV9.PtkouBU0ktF6fCPTSqGqYXbxopTlmjQYe-tLsod-MaY"

    expect(() => isTokenExpired("")).toThrowError(InternalError)
    expect(isTokenExpired(mockNotExpiringToken)).toBe(false)
    expect(isTokenExpired(mockExpiredtoken)).toBe(true)
  })

  it("request", () => {
    const client = new RaasClient({
      clientId: "id",
      clientSecret: "secret",
      refreshToken: "refresh",
    }, "testEndpoint")

    // @ts-ignore
    expect(client.authEndpoint).toBe("testEndpoint")
    // @ts-ignore
    expect(client.isuCredentials).toStrictEqual({
      clientId: "id",
      clientSecret: "secret",
      refreshToken: "refresh",
    })
  })
}
