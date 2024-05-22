// index.ts
import * as pulumi from "@pulumi/pulumi";
import * as cloudflare from "@pulumi/cloudflare";
import * as std from "@pulumi/std";

const config = new pulumi.Config();
const accountId = config.get("accountId")!;
const zoneId = config.get("zoneId")!;

const zoneSettings = new cloudflare.ZoneSettingsOverride("zone-settings", {
    zoneId,
    settings: {
        alwaysUseHttps: "on",
        automaticHttpsRewrites: "on",
        ssl: "strict",
        minTlsVersion: "1.2",
        universalSsl: "on",
    },
});

const record = new cloudflare.Record(
    "pulumi-initech.com",
    {
        zoneId,
        name: "@",
        type: "CNAME",
        value: "www.pulumi-initech.com",
        proxied: true,
    },
    {
        deleteBeforeReplace: true,
    }
);

const worker = new cloudflare.WorkerScript(
  "worker",
  {
    accountId,
    name: "redirect",
    content: std.file({
        input: "worker.js",
    }).then(invoke => invoke.result),
  }
);

const workerRoute = new cloudflare.WorkerRoute(
    "worker-route",
    {
        zoneId,
        pattern: "pulumi-initech.com/*",
        scriptName: worker.name,
    }
);
