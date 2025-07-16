# Workday RaaS Client

A TypeScript client library for interacting with Workday Reports-as-a-Service APIs.

## Install


## Requirements

1. [A workday API client](https://doc.workday.com/reader/J1YvI9CYZUWl1U7_PSHyHA/qAugF2pRAGtECVLHKdMO_A).  These are used to initialize the RaaS client:
```ts
interface IsuCredentials {
    clientId: string,
    clientSecret: string,
    refreshToken: string,
}
```

2. A Workday REST API endpoint for a Workday RaaS report.

## Usage

The library provides two utility classes: `RaasClient` and `WorkdayRequest`.  These work together to build reusable requests.

```ts
// Store the credentials as a JS object
const credentials: IsuCredentials = {
    clientId: "myClientId",
    clientSecret: "myClientSecret",
    refreshToken: "myRefreshToken",
}
const authEndpoint = "authEndpoint"

// Initialize a client using the credentials and an auth endpoint
const client = new RaasClient(credentials, authEndpoint)

// Build requests
const raasEndpoint1 = "https://myRaasEndpoint.com"
const raasEndpoint2
const req1 = client
    .request(raasEndpoint1)
    .param("myParam", "myParamVal")
    .param("multiValParam", ["val1", "val2", "val3")
const req2 = client
    .request(raasEndpoint2)
    .param("myPrompt", "myPromptVal")

// Send the requests in different formats
const jsonRes = await req1.json()
const xmlRes = await req1.xml()
const csv = await req2.csv()
```
