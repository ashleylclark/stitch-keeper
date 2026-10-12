# Stitch-Keeper Helm Chart

[![Version: 0.1.7](https://img.shields.io/badge/Version-0.1.7-informational?style=flat-square)](Chart.yaml)
[![AppVersion: v0.9.0](https://img.shields.io/badge/AppVersion-v0.9.0-informational?style=flat-square)](Chart.yaml)

A simple web app to manage your fiber arts stash.

## Overview

This chart deploys Stitch Keeper as a single-replica web application backed by SQLite.

## Installing

### From GHCR (OCI)

```bash
helm install stitch-keeper oci://ghcr.io/ashleylclark/charts/stitch-keeper --version 0.1.7
```

To override values during install:

```bash
helm install stitch-keeper oci://ghcr.io/ashleylclark/charts/stitch-keeper \
  --version 0.1.7 \
  --set ingress.enabled=true
```

### From source

```bash
helm install stitch-keeper ./chart
```

## Upgrading

```bash
helm upgrade stitch-keeper oci://ghcr.io/ashleylclark/charts/stitch-keeper --version 0.1.7
```

## Uninstalling

```bash
helm uninstall stitch-keeper
```

## Optional MCP

MCP is disabled by default. To enable it, add these entries to your existing
`env` values:

```yaml
env:
  - name: MCP_ENABLED
    value: "true"
  - name: MCP_HTTP_ALLOWED_HOSTS
    value: "stitch.example.internal"
```

Replace the example hostname with the hostname clients use to reach the app,
without a scheme or port. MCP uses the app's existing service and port at
`/mcp`; no additional service or token Secret is needed. Your ingress or reverse
proxy must forward `/mcp`, including POST requests and Authorization headers.
Use an image release that includes the built-in MCP endpoint.

Create a read-only API token under **Settings → API Tokens** and give it to
your MCP client. See the [MCP setup guide](../docs/mcp.md) for connection and
Codex plugin instructions.

## Configuration

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| image.repository | string | `"ghcr.io/ashleylclark/stitch-keeper"` | Image repository |
| image.tag | string | `""` | Image tag (defaults to appVersion) |
| image.pullPolicy | string | `"IfNotPresent"` | Image pull policy |
| imagePullSecrets | list | `[]` | Image pull secrets for private registries |
| replicaCount | int | `1` | Number of replicas for the mealie deployment SQLite requires a single instance |
| nameOverride | string | `""` | Override the chart name |
| fullnameOverride | string | `""` | Override the full release name |
| deploymentAnnotations | object | `{}` | Annotations for the Deployment. |
| extraDeploymentLabels | object | `{}` | Additional labels for the Deployment. |
| podAnnotations | object | `{}` | Pod annotations applied |
| podLabels | object | `{}` | Pod labels applied |
| commonLabels | object | `{}` | Labels to add to all resources. |
| podSecurityContext | object | `{}` | Pod-level security context |
| securityContext | object | `{}` | Container-level security context |
| service.type | string | `"ClusterIP"` | Service type (ClusterIP/LoadBalancer/NodePort) |
| service.port | int | `3001` | Service port |
| resources | object | `{}` | Resource requests and limits |
| env | list | `[]` | Environment variables for the container |
| envFrom | list | `[]` | Environment sources (ConfigMap/Secret refs) |
| persistence.enabled | bool | `true` | Enable persistence |
| persistence.storageClass | string | `""` | Storage class for PVC Set to "-" to disable dynamic provisioning and use default storage class Set to "" to use cluster default storage class |
| persistence.size | string | `"1Gi"` | Requested PVC size |
| persistence.accessModes | list | `["ReadWriteOnce"]` | Access modes for the PVC |
| persistence.mountPath | string | `"/data"` | PVC's mount path |
| persistence.existingClaim | string | `""` | Use an existing PVC instead of creating a new one If defined, PVC must be created manually before volume will be bound |
| persistence.annotations | object | `{}` | Annotations for PVC |
| strategy | object | `{}` | Deployment update strategy (default: Recreate when persistence enabled and non-RWX or single replica) |
| ingress.enabled | bool | `false` | Enable ingress |
| ingress.className | string | `""` | Ingress class name |
| ingress.annotations | object | `{}` | Additional ingress annotations |
| ingress.hosts | list | `[{"host":"stitch-keeper.local","paths":[{"path":"/","pathType":"ImplementationSpecific"}]}]` | Ingress rules configuration |
| ingress.tls | list | `[]` | TLS configuration for ingress |
| livenessProbe | object | `{"httpGet":{"path":"/api/health","port":3001}}` | Liveness probe configuration |
| readinessProbe | object | `{"httpGet":{"path":"/api/health","port":3001}}` | Readiness probe configuration |
| startupProbe | object | `{}` | Startup probe configuration |
| nodeSelector | object | `{}` | Node selector for scheduling |
| affinity | object | `{}` | Pod affinity/anti-affinity |
| tolerations | list | `[]` | Pod tolerations |

## License

MIT - see [LICENSE](../LICENSE).
