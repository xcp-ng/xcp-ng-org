---
sidebar_position: 3
---

# Xen Orchestra API

There's two different APIs to manage XCP-ng at scale via Xen Orchestra:
* a REST API, simple to use to read content
* a JSON-RPC over websocket API, more complex but coming with all features

## 📡 REST API

We developed XO original API to be used between the Web UI `xo-web` and the server backend, `xo-server`. That's why it's a JSON-RPC API connected via websockets, allowing us to update objects live in the browser. This is perfect for our usage, but a bit complicated for others.

Also, this API wasn't meant to be public, but over the years some users have expressed a desire to be able to use it for their own purposes. This led us to add more tooling around it, like `xo-cli` and to answer specific requests.

For these reasons we decided to build a new API. Not an evolution of the current one, but 100% new. It is meant to be public and [REST-like](https://en.wikipedia.org/wiki/Representational_state_transfer). So a simple curl command can request it. We will also provide documentation as the intended goal is for it to be used by the public.

### Authentication

A valid authentication token should be attached as a cookie to all HTTP
requests:

```http
GET /rest/v0 HTTP/1.1
Cookie: authenticationToken=TN2YBOMYtXB_hHtf4wTzm9p5tTuqq2i15yeuhcz2xXM
```

The server will respond to an invalid token with a `401 Unauthorized` status.

**[Not implemented at this time]** The server can request that the client updates its token with a `Set-Cookie` header:

```http
HTTP/1.1 200 OK
Set-Cookie: authenticationToken=KQxQdm2vMiv7jBIK0hgkmgxKzemd8wSJ7ugFGKFkTbs
```

Usage with cURL:

```bash
curl -b \
    authenticationToken=KQxQdm2vMiv7jBIK0hgkmgxKzemd8wSJ7ugFGKFkTbs \
    https://xo.company.lan/rest/v0/
```

You can create a token from Xen Orchestra UI, inside your user space:

![](../../../assets/img/newxotoken.png)

Alternatively, you can use `xo-cli` to create an authentication token:

```bash
$ xo-cli --createToken xoa.company.lan admin@admin.net
Password: ********
Successfully logged with admin@admin.net
Authentication token created

DiYBFavJwf9GODZqQJs23eAx9eh3KlsRhBi8RcoX0KM
```

:::info
Only admin users can currently use the API.
:::

### Collections request

Collections of objects are available at `/<name>` (e.g. `/vms`)

The following query parameters are supported:

- `limit`: max number of objects returned
- `fields`: if specified, instead of plain URLs, the results will be objects containing the requested fields
- `filter`: a string that will be used to select only matching objects, see [the syntax documentation](https://xen-orchestra.com/docs/manage_infrastructure.html#live-filter-search)
- `ndjson`: if specified, the result will be in [NDJSON format](https://github.com/ndjson/ndjson-spec)

Simple request:

```http
GET /rest/v0/vms HTTP/1.1
Cookie: authenticationToken=TN2YBOMYtXB_hHtf4wTzm9p5tTuqq2i15yeuhcz2xXM

HTTP/1.1 200 OK
Content-Type: application/json

[
  "/rest/v0/vms/770aa52a-fd42-8faf-f167-8c5c4a237cac",
  "/rest/v0/vms/5019156b-f40d-bc57-835b-4a259b177be1"
]
```

Here is an example with `curl`:

```console
$ curl \
  -b authenticationToken=0OQIKwb1WjeHtch25Ls \
  http://xoa.example.com/rest/v0/vms?fields=name_label,power_state
[
  {
    "name_label": "FreeNAS",
    "power_state": "Running",
    "href": "/rest/v0/vms/0fc14abc-ae7a-4209-79c4-d20ca1f0e567"
  },
  {
    "name_label": "Ubuntu 20.04 test",
    "power_state": "Halted",
    "href": "/rest/v0/vms/d505eb99-164e-5516-27e1-43837a01be45"
  },
  {
    "name_label": "Rocky Linux 8",
    "power_state": "Halted",
    "href": "/rest/v0/vms/38f423b7-1498-ee8c-ca8d-d3bb8fcffcf2"
  },
  {
    "name_label": "XOA 🎷",
    "power_state": "Running",
    "href": "/rest/v0/vms/857e34e5-c61a-f3f1-65e6-a7a9306b347b"
  }
]
```

As NDJSON:

```http
GET /rest/v0/vms?fields=name_label,power_state&ndjson HTTP/1.1
Cookie: authenticationToken=TN2YBOMYtXB_hHtf4wTzm9p5tTuqq2i15yeuhcz2xXM

HTTP/1.1 200 OK
Content-Type: application/x-ndjson

{"name_label":"Debian 10 Cloudinit","power_state":"Running","url":"/rest/v0/vms/770aa52a-fd42-8faf-f167-8c5c4a237cac"}
{"name_label":"Debian 10 Cloudinit self-service","power_state":"Halted","url":"/rest/v0/vms/5019156b-f40d-bc57-835b-4a259b177be1"}
```

### Properties update

> This feature is restricted to `name_label` and `name_description` at the moment.

```sh
curl \
  -X PATCH \
  -b authenticationToken=KQxQdm2vMiv7jBIK0hgkmgxKzemd8wSJ7ugFGKFkTbs \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  -d '{ "name_label": "The new name", "name_description": "The new description" }' \
  'https://xo.example.org/rest/v0/vms/770aa52a-fd42-8faf-f167-8c5c4a237cac'
```

### VM and VDI destruction

For a VM:

```sh
curl \
  -X DELETE \
  -b authenticationToken=KQxQdm2vMiv7jBIK0hgkmgxKzemd8wSJ7ugFGKFkTbs \
  'https://xo.example.org/rest/v0/vms/770aa52a-fd42-8faf-f167-8c5c4a237cac'
```

For a VDI:

```sh
curl \
  -X DELETE \
  -b authenticationToken=KQxQdm2vMiv7jBIK0hgkmgxKzemd8wSJ7ugFGKFkTbs \
  'https://xo.example.org/rest/v0/vdis/1a269782-ea93-4c4c-897a-475365f7b674'
```

### VM and VDI export

VDI export and VM export are supported by the API. Below is a simple example to export a VM with `zstd` compression into a `myVM.xva` file:

```sh
curl \
  -b authenticationToken=KQxQdm2vMiv7jFEAZXOAGKFkTbs \
  'https://xoa.example.org/rest/v0/vms/770aa52a-fd42-8faf-f167-8c5c4a237a12.xva?compress=zstd' \
  > myVM.xva
```

A VDI can be exported in VHD format at `/rest/v0/vdis/<uuid>.vhd` or the raw content at `/rest/v0/vdis/<uuid>.raw`.

```sh
curl \
  -b authenticationToken=KQxQdm2vMiv7FkTbs \
  'https://xoa.example.org/rest/v0/vdis/1a269782-ea93-4c4c-897a-475365f7b674.vhd' \
  > myDisk.vhd
```

### VDI Import

A VHD or a raw export can be imported on an SR to create a new VDI at `/rest/v0/srs/<sr uuid>/vdis`.

```sh
curl \
  -X POST \
  -b authenticationToken=KQxQdm2vMiv7jBIK0hgkmgxKzemd8wSJ7ugFGKFkTbs \
  -T myDisk.raw \
  'https://xo.example.org/rest/v0/srs/357bd56c-71f9-4b2a-83b8-3451dec04b8f/vdis?raw&name_label=my_imported_VDI' \
  | cat
```

> Note: the final `| cat` ensures cURL's standard output is not a TTY, which is necessary for upload stats to be dislayed.

This request returns the UUID of the created VDI.

The following query parameters are supported to customize the created VDI:

- `name_label`
- `name_description`
- `raw`: this parameter must be used if importing a raw export instead of a VHD

### Actions

#### Available actions

To see the actions available on a given object, get the collection at `/rest/v0/<type>/<uuid>/actions`.

For example, to list all actions on a given VM:

```sh
curl \
  -b authenticationToken=KQxQdm2vMiv7jBIK0hgkmgxKzemd8wSJ7ugFGKFkTbs \
  'https://xo.example.org/rest/v0/vms/770aa52a-fd42-8faf-f167-8c5c4a237cac/actions'
```

#### Start an action

Post at the action endpoint which is `/rest/v0/<type>/<uuid>/actions/<action>`.

For instance, to reboot a VM:

```sh
curl \
  -X POST \
  -b authenticationToken=KQxQdm2vMiv7jBIK0hgkmgxKzemd8wSJ7ugFGKFkTbs \
  'https://xo.example.org/rest/v0/vms/770aa52a-fd42-8faf-f167-8c5c4a237cac/actions/clean_reboot'
```

Some actions accept parameters, they should be provided in a JSON-encoded object as the request body:

```sh
curl \
  -X POST \
  -b authenticationToken=KQxQdm2vMiv7jBIK0hgkmgxKzemd8wSJ7ugFGKFkTbs \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  -d '{ "name_label": "My snapshot" }' \
  'https://xo.example.org/rest/v0/vms/770aa52a-fd42-8faf-f167-8c5c4a237cac/actions/snapshot'
```

By default, actions are asynchronous and return the reference of the task associated with the request.

> Tasks monitoring is still under construcration and will come in a future release :)

The `?sync` flag can be used to run the action synchronously without requiring task monitoring. The result of the action will be returned encoded as JSON:

```console
$ curl \
  -X POST \
  -b authenticationToken=KQxQdm2vMiv7jBIK0hgkmgxKzemd8wSJ7ugFGKFkTbs \
  'https://xo.example.org/rest/v0/vms/770aa52a-fd42-8faf-f167-8c5c4a237cac/actions/clean_reboot'
"2b0266aa-c753-6fbc-e4dd-c79be7782052"
```

### The future

We are adding features and improving the REST API step by step. If you have interesting use cases or feedback, please ask directly at [the dedicated forum section](https://xcp-ng.org/forum/category/18/rest-api).

## 🥋 JSON-RPC over websockets

This is the API used between Xen Orchestra web UI and the server part, `xo-server`. It's a bit harder to use than the REST API, but if you need a live subscription to events happening in your infrastructure, or to send advanced commands, this is the right one.

:::note
All features visible in your XO web UI are in fact using this API. So everything you do in the web UI is also doable in this API.
:::

To know all the available methods you can call, the best way is to use `xo-cli` to do so.

### List of all commands

You can discover all available commands by running `xo-cli --list-commands` with your registered XO CLI.

### List all objects

`xo-cli --list-objects` will print all objects you can request.
