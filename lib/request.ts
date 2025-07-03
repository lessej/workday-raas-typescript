import { InternalError, isGeneratedError } from "./error.js"

interface WorkdayRequestImpl {
  param: (key: string, val: string) => WorkdayRequest
  json: () => Promise<string>
  xml: () => Promise<string>
  csv: () => Promise<string>
}

const formatQueryParams = (params: string | string[]): string => {
  if (typeof params === "string") {
    return params
  }
  return params.map((value) => value.trim().split(" ").join("_")).join("!")
}

/**
 * Utility for sending preparing and sending requests to Workday RaaS endpoints.
 *
 * To send the request, one of `json()`, `csv()`, or `xml()` needs to be awaited.
 *
 * @example
 * ```ts
 * const res = await client.request("my-endpoing.workday.com")
 *   .param("my key", "my val")
 *   .param("my second key", ["possible", "vals"])
 *   .json()
 * ```
 */
export class WorkdayRequest implements WorkdayRequestImpl {
  private endpoint: URL
  private authRequest: () => Promise<string>

  constructor(endpoint: string, authRequest: () => Promise<string>) {
    try {
      const apiEndpoint = new URL(endpoint)
      this.endpoint = apiEndpoint
      this.authRequest = authRequest
      return this
    } catch (err) {
      throw new InternalError(`An error occured when creating a request for Workday: ${err}.`)
    }
  }


  private async getWorkdayRes(endpoint: string): Promise<Response> {
    const token = await this.authRequest()
    const headers = { Authorization: `Bearer ${token}` }
    const res = await fetch(endpoint, {
      method: "GET",
      headers: headers,
    })

    if (!res.ok) {
      throw new InternalError(`An error occured during the request to Workday: ${await res.text()}.`)
    }

    return res
  }

  /**
   * Appends a query parameter (Workday prompt) to the request URL.
   * Keys must be single strings.  Values can be one or multiple strings.
   *
   * @example
   * ```ts
   * const res = await client.request("my-endpoing.workday.com")
   *   .param("my key", "my val")
   *   .param("my second key", ["possible", "vals"])
   *
   * ```
   */
  param(key: string, val: string | string[]): WorkdayRequest {
    try {
      const paramVals = formatQueryParams(val)
      this.endpoint.searchParams.append(key, paramVals)
      return this
    } catch (err) {
      throw new InternalError(`An error occured when adding Workday prompts: ${err}.`)
    }
  }

  /**
   * Sends the request to Workday with the output format set to JSON
   *
   * @example
   * ```ts
   * const res = await client.request("my-endpoing.workday.com")
   *   .param("my key", "my val")
   *   .param("my second key", ["possible", "vals"])
   *   .json()
   * ```
  */
  async json(): Promise<string> {
    this.endpoint.searchParams.append("format", "json")
    const endpoint = this.endpoint.toString()
    this.endpoint.searchParams.delete("format")

    try {
      const res = await this.getWorkdayRes(endpoint)
      const textRes = await res.text()

      return textRes
    } catch (err) {
      if (!isGeneratedError(err)) {
        throw new InternalError(`An error occured during the JSON request to Workday: ${await err}.`)
      }
      throw err
    }
  }

  /**
   * Sends the request to Workday with the output format set to XML
   *
   * @example
   * ```ts
   * const res = await client.request("my-endpoing.workday.com")
   *   .param("my key", "my val")
   *   .param("my second key", ["possible", "vals"])
   *   .xml()
   * ```
  */
  async xml(): Promise<string> {
    try {
      const res = await this.getWorkdayRes(this.endpoint.toString())
      const textRes = await res.text()

      return textRes
    } catch (err) {
      if (!isGeneratedError(err)) {
        throw new InternalError(`An error occured during the XML request to Workday: ${await err}.`)
      }
      throw err
    }
  }

  /**
   * Sends the request to Workday with the output format set to CSV
   *
   * @example
   * ```ts
   * const res = await client.request("my-endpoing.workday.com")
   *   .param("my key", "my val")
   *   .param("my second key", ["possible", "vals"])
   *   .csv()
   * ```
  */
  async csv(): Promise<any | JSON> {
    this.endpoint.searchParams.append("format", "csv")
    const endpoint = this.endpoint.toString()
    this.endpoint.searchParams.delete("format")

    try {
      const res = await this.getWorkdayRes(endpoint)
      const textRes = await res.text()

      return textRes
    } catch (err) {
      if (!isGeneratedError(err)) {
        throw new InternalError(`An error occured during the XML request to Workday: ${await err}.`)
      }
      throw err
    }
  }
}

if (import.meta.vitest) {
  const { vi, it, expect } = import.meta.vitest

  it("formatQueryParams", () => {
    const formattedSingle = formatQueryParams(["Test Lots Of Spaces"])
    expect(formattedSingle).toBe("Test_Lots_Of_Spaces")

    const formattedMultiple = formatQueryParams(["Test", "Multiple", "Params"])
    expect(formattedMultiple).toBe("Test!Multiple!Params")

    const formattedMultipleWithSpaces = formatQueryParams(["Test Multiple", "With Spaces", "Params"])
    expect(formattedMultipleWithSpaces).toBe("Test_Multiple!With_Spaces!Params")

    const formattedNone = formatQueryParams([])
    expect(formattedNone).toBe("")

    const formattedEmpty = formatQueryParams([""])
    expect(formattedEmpty).toBe("")
  })
  
  it("create request", () => {
    const authRequest = async () => "auth"
    const req = new WorkdayRequest("https://testEndpoint.com", authRequest)
    // @ts-ignore
    expect(typeof req.endpoint).toBe("object")
  })

  const okJson = {
    "Report_Entry": [
      {
        "id": "id_1",
        "name": "name_1"
      },
      {
        "id": "id_2",
        "name": "name_2"
      },
    ]
  }

  it("send methods", async () => {
    const authRequest = async () => "mockToken"
    const req = new WorkdayRequest("https://testEndpoint.com", authRequest)

    let spyFetch = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => (okJson),
      text: async () => (`${okJson}`),
    } as Response)

    await req.json()
    expect(spyFetch).toHaveBeenCalledWith("https://testendpoint.com/?format=json", {
      headers: { Authorization: "Bearer mockToken" },
      method: "GET",
    })
    
    await req.xml()
    expect(spyFetch).toHaveBeenCalledWith("https://testendpoint.com/", {
      headers: { Authorization: "Bearer mockToken" },
      method: "GET",
    })
    
    await req.csv()
    expect(spyFetch).toHaveBeenCalledWith("https://testendpoint.com/?format=csv", {
      headers: { Authorization: "Bearer mockToken" },
      method: "GET",
    })
    
    spyFetch.mockReset()
    spyFetch = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => "Error"
    } as Response)
    
    await expect(async () => await req.json()).rejects.toThrowError(InternalError)
    await expect(async () => await req.xml()).rejects.toThrowError(InternalError)
    await expect(async () => await req.csv()).rejects.toThrowError(InternalError)
  })

  it("param", async () => {
    const authRequest = async () => "mockToken"

    let spyFetch = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => (okJson),
      text: async () => (`${okJson}`),
    } as Response)

    await new WorkdayRequest("https://testEndpoint.com", authRequest).param("myKey", "myVal").json()
    expect(spyFetch).toHaveBeenCalledWith("https://testendpoint.com/?myKey=myVal&format=json", {
      headers: { Authorization: "Bearer mockToken" },
      method: "GET",
    })
    
    await new WorkdayRequest("https://testEndpoint.com", authRequest)
      .param("myKey", "myVal")
      .param("multi", ["multiple ", "values", "multiple values"])
      .json()
    expect(spyFetch).toHaveBeenCalledWith("https://testendpoint.com/?myKey=myVal&multi=multiple%21values%21multiple_values&format=json", {
      headers: { Authorization: "Bearer mockToken" },
      method: "GET",
    })
  })
}
